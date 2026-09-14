'use client'

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  getReceipt,
  overrideReceipt,
  validateReceipt,
  type Receipt,
} from '@/lib/api/receipt'
import { apiErrorMessage } from '@/lib/api/errors'
import { boardKeys } from '@/hooks/use-board'
import { cardKeys } from '@/hooks/use-card'
import { POLL_CARD_MS } from '@/lib/crm/realtime'

export const receiptKeys = {
  detail: (cardId: string) => ['crm', 'receipt', cardId] as const,
}

/** Comprobante más reciente de la card, o `null` si el lead no mandó ninguno.
 *  Poll como el detalle: el comprobante lo procesa un worker, así que puede aparecer
 *  mientras el operador ya tiene la card abierta. */
export function useReceipt(cardId: string | null) {
  return useQuery<Receipt | null>({
    queryKey: receiptKeys.detail(cardId ?? ''),
    queryFn: () => (cardId ? getReceipt(cardId) : Promise.resolve(null)),
    enabled: Boolean(cardId),
    refetchInterval: POLL_CARD_MS,
  })
}

/** Validar mueve la card a "Pago validado" y entrega: se invalida el comprobante, el
 *  detalle **y el tablero**, porque la card cambia de columna. */
function invalidateAfterValidation(queryClient: QueryClient, cardId: string): void {
  queryClient.invalidateQueries({ queryKey: receiptKeys.detail(cardId) })
  queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
  queryClient.invalidateQueries({ queryKey: boardKeys.all })
}

/** Validación en 1 click de un comprobante que pasó los checks. */
export function useValidateReceipt(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<Receipt | null, Error>({
    mutationFn: () => validateReceipt(cardId),
    onSuccess: () => {
      invalidateAfterValidation(queryClient, cardId)
      toast.success('Pago validado.')
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? 'No se pudo validar el pago. Reintentá.')
    },
  })
}

/** Validación con nota obligatoria (override) de un comprobante que no pasó los checks.
 *  Sin toast de error a propósito: el diálogo muestra el mensaje del backend al lado de
 *  la nota, que es donde el operador la puede corregir. */
export function useOverrideReceipt(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<Receipt | null, Error, string>({
    mutationFn: (note) => overrideReceipt(cardId, note),
    onSuccess: () => {
      invalidateAfterValidation(queryClient, cardId)
      toast.success('Pago validado con nota.')
    },
  })
}
