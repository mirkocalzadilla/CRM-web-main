'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  confirmPayment,
  exportPayments,
  listPendingPayments,
  rejectPayment,
  type PaymentsExport,
  type PendingPayment,
  type PendingPayments,
} from '@/lib/api/payments'
import { apiErrorMessage } from '@/lib/api/errors'
import { boardKeys } from '@/hooks/use-board'
import { cardKeys } from '@/hooks/use-card'
import { receiptKeys } from '@/hooks/use-receipt'
import { POLL_BOARD_MS } from '@/lib/crm/realtime'

export const paymentKeys = {
  pending: ['crm', 'payments', 'pending'] as const,
}

/** Cola de conciliación. La consumen la pantalla y el contador del menú: misma query
 *  key, así que es un solo request por ciclo. Poll como el tablero — un pago entra a la
 *  cola cuando el worker valida un comprobante, sin que nadie toque la pantalla. */
export function usePendingPayments() {
  return useQuery<PendingPayments>({
    queryKey: paymentKeys.pending,
    queryFn: listPendingPayments,
    refetchInterval: POLL_BOARD_MS,
  })
}

/** Conciliar cambia la cola y también la card: confirmar le saca el aviso
 *  `payment_unconfirmed` y rechazar la mueve al stage perdido. De ahí el tablero, el
 *  detalle y el comprobante (que guarda la nota del rechazo). */
function invalidateAfterReconciliation(queryClient: QueryClient, cardId: string): void {
  queryClient.invalidateQueries({ queryKey: paymentKeys.pending })
  queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
  queryClient.invalidateQueries({ queryKey: receiptKeys.detail(cardId) })
  queryClient.invalidateQueries({ queryKey: boardKeys.all })
}

/** Confirmar en 1 click: el pago está en el extracto. Idempotente en el backend. */
export function useConfirmPayment() {
  const queryClient = useQueryClient()

  return useMutation<PendingPayment, Error, string>({
    mutationFn: (paymentId) => confirmPayment(paymentId),
    onSuccess: (payment) => {
      invalidateAfterReconciliation(queryClient, payment.card_id)
      toast.success('Pago confirmado contra el banco.')
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? 'No se pudo confirmar el pago. Reintentá.')
    },
  })
}

export interface RejectPaymentVars {
  paymentId: string
  note: string
}

/** Rechazo con nota obligatoria: revoca la entrada y cierra la oportunidad como
 *  perdida. Sin toast de error a propósito — el diálogo muestra el mensaje del backend
 *  al lado de la nota, que es donde el operador la puede corregir. */
export function useRejectPayment() {
  const queryClient = useQueryClient()

  return useMutation<PendingPayment, Error, RejectPaymentVars>({
    mutationFn: ({ paymentId, note }) => rejectPayment(paymentId, note),
    onSuccess: (payment) => {
      invalidateAfterReconciliation(queryClient, payment.card_id)
      toast.success('Pago rechazado: la entrada quedó revocada.')
    },
  })
}

/** Baja el CSV del día y dispara la descarga en el browser (mismo mecanismo que el
 *  export de leads, #113). */
export function useExportPayments() {
  return useMutation<PaymentsExport, Error, string>({
    mutationFn: (day) => exportPayments(day),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('CSV descargado')
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? 'No se pudo descargar el CSV.')
    },
  })
}
