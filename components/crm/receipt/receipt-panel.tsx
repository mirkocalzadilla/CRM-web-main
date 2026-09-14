'use client'

import { cn } from '@/lib/utils'
import { receiptState, type Receipt, type ReceiptState } from '@/lib/api/receipt'
import { useReceipt } from '@/hooks/use-receipt'
import { SectionTitle } from '@/components/crm/section-title'
import { ReceiptActions } from '@/components/crm/receipt/receipt-actions'
import { ReceiptChecks } from '@/components/crm/receipt/receipt-checks'
import { ReceiptExtracted } from '@/components/crm/receipt/receipt-extracted'
import { ReceiptImage } from '@/components/crm/receipt/receipt-image'
import { ReceiptStatus } from '@/components/crm/receipt/receipt-status'

/** La nota humana es el motivo de un override o de un rechazo: el título dice cuál. */
function noteLabel(state: ReceiptState): string {
  if (state === 'rejected') return 'Rechazado. Motivo:'
  if (state === 'approved') return 'Validado a mano. Motivo:'
  return 'Nota del operador:'
}

function HumanNote({ state, note }: { state: ReceiptState; note: string }) {
  const rejected = state === 'rejected'
  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-2',
        rejected ? 'border-red-500/20 bg-red-500/[0.07]' : 'border-violet-500/20 bg-violet-500/[0.07]',
      )}
    >
      <p className={cn('text-[11px] font-medium', rejected ? 'text-red-300' : 'text-violet-300')}>
        {noteLabel(state)}
      </p>
      <p className="text-xs font-normal whitespace-pre-wrap text-zinc-300">{note}</p>
    </div>
  )
}

function ReceiptBody({ receipt }: { receipt: Receipt }) {
  const state = receiptState(receipt)
  const okCount = receipt.checks.filter((check) => check.passed).length
  // Solo mientras nadie decidió: sobre un pago aprobado, confirmado o rechazado el
  // botón no tiene sentido — y "validar" de nuevo re-entregaba al lead (web#194).
  const actionable = state === 'pending' || state === 'review'

  return (
    <div className="space-y-3">
      <ReceiptStatus receipt={receipt} />

      <div className="grid gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
        <ReceiptImage url={receipt.image_url} />
        <ReceiptExtracted extracted={receipt.extracted} />
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <p className="mb-2 text-[11px] font-medium text-zinc-400">
          Verificaciones ({okCount} de {receipt.checks.length} pasaron)
        </p>
        <ReceiptChecks checks={receipt.checks} />
      </div>

      {receipt.human_note && <HumanNote state={state} note={receipt.human_note} />}

      {actionable && <ReceiptActions cardId={receipt.card_id} passed={state === 'pending'} />}
    </div>
  )
}

/** Panel del comprobante de pago en el detalle de la card (web#182 / server#272): la
 *  imagen, lo que el sistema leyó y el semáforo de verificaciones, para decidir sin
 *  descifrar la foto ni hacer cuentas.
 *
 *  No se renderiza nada si el lead no mandó comprobante (el endpoint devuelve `null`):
 *  una sección vacía sería ruido en cada card que nunca llegó a pagar. */
export function ReceiptPanel({ cardId }: { cardId: string }) {
  const { data: receipt } = useReceipt(cardId)
  if (!receipt) return null

  return (
    <div className="mt-5 border-t border-white/5 pt-5">
      <SectionTitle>Comprobante de pago</SectionTitle>
      <ReceiptBody receipt={receipt} />
    </div>
  )
}
