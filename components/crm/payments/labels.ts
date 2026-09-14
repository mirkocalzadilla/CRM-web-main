import type { PendingPayment } from '@/lib/api/payments'

// Presentación de la cola de conciliación (server#274). Los valores del comprobante van
// **sin reformatear**, igual que en el panel del comprobante (CR3): el operador los
// compara contra el extracto del banco, y "arreglar" un monto o una fecha rompe esa
// comparación. `paid_at` es date-only, así que nunca pasa por `new Date()`.

export const NO_VALUE = '—'

/** Monto tal cual vino, con la moneda cruda al lado. `null` si el modelo no lo leyó. */
export function paymentAmount(payment: PendingPayment): string | null {
  if (payment.amount === null) return null
  return payment.currency ? `${payment.amount} ${payment.currency}` : payment.amount
}

/** De qué pago se está hablando, para el diálogo de rechazo: monto y número de
 *  transacción son lo que identifica el movimiento en el extracto. */
export function paymentSubject(payment: PendingPayment): string {
  const parts: string[] = []
  const amount = paymentAmount(payment)
  if (amount) parts.push(amount)
  if (payment.reference) parts.push(`transacción ${payment.reference}`)
  return parts.length > 0 ? parts.join(' · ') : 'Este pago'
}
