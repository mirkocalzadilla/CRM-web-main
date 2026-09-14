import { z } from 'zod'

import { apiClient } from '@/lib/api/client'

// Conciliación humana de los pagos que el sistema aprobó solo (server#274, CR4).
// Mientras no haya pasarela bancaria un comprobante es una imagen — y una imagen se
// puede editar. El sistema valida y entrega para que el lead no espere, pero el dinero
// no está confirmado hasta que una persona lo coteja contra el extracto del banco.

// Espejo de reconciliation_schemas.NOTE_MAX.
export const NOTE_MAX = 2000

/** Un pago de la cola. `amount` y `paid_at` llegan como string a propósito (decimal y
 *  date-only del comprobante) y se muestran **sin reformatear**: son los valores que el
 *  operador busca en el extracto. `paid_at` es `YYYY-MM-DD` y no debe pasar por
 *  `new Date()` — en husos negativos mostraría el día anterior. */
export const pendingPaymentSchema = z.object({
  id: z.string(),
  card_id: z.string(),
  amount: z.string().nullable(),
  currency: z.string().nullable(),
  paid_at: z.string().nullable(),
  beneficiary: z.string().nullable(),
  reference: z.string().nullable(),
  bank: z.string().nullable(),
  created_at: z.string(),
})

/** `total` viene del backend y es el número que la UI muestra como señal de trabajo
 *  pendiente; no se recalcula desde `items`. */
export const pendingPaymentsSchema = z.object({
  total: z.number(),
  items: z.array(pendingPaymentSchema),
})

export type PendingPayment = z.infer<typeof pendingPaymentSchema>
export type PendingPayments = z.infer<typeof pendingPaymentsSchema>

/** Solo los pagos que **el sistema** aprobó y nadie cotejó todavía: los que un humano
 *  validó a mano no entran (ya pasaron por ojos humanos). Orden FIFO del backend. */
export async function listPendingPayments(): Promise<PendingPayments> {
  const { data } = await apiClient.get('/crm/payments/pending')
  return pendingPaymentsSchema.parse(data)
}

/** Sella el pago como cotejado contra el banco. Idempotente; 404 si no existe. */
export async function confirmPayment(paymentId: string): Promise<PendingPayment> {
  const { data } = await apiClient.post(`/crm/payments/${paymentId}/confirm`)
  return pendingPaymentSchema.parse(data)
}

/** El pago no entró: revoca la entrada y cierra la oportunidad como perdida, con el
 *  motivo en su historial. La nota es obligatoria (422 si es vacía o corta). */
export async function rejectPayment(
  paymentId: string,
  note: string,
): Promise<PendingPayment> {
  const { data } = await apiClient.post(`/crm/payments/${paymentId}/reject`, { note })
  return pendingPaymentSchema.parse(data)
}

export interface PaymentsExport {
  blob: Blob
  filename: string
}

/** CSV de los pagos auto-validados de un día. `day` en `YYYY-MM-DD`; sin él el backend
 *  usa hoy en UTC. */
export async function exportPayments(day?: string): Promise<PaymentsExport> {
  const response = await apiClient.get<Blob>('/crm/payments/export', {
    params: day ? { day } : {},
    responseType: 'blob',
  })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const fallback = day ? `pagos-${day}.csv` : 'pagos.csv'
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallback
  return { blob: response.data, filename }
}

/** Día local en `YYYY-MM-DD`, sin pasar por UTC: "hoy" es el día del operador, no el
 *  del servidor. `offsetDays` negativo para ayer. */
export function localDayIso(offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
