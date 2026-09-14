'use client'

import { useState } from 'react'
import { TicketX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiErrorMessage } from '@/lib/api/errors'
import { NOTE_MAX, type PendingPayment } from '@/lib/api/payments'
import { auditNote } from '@/lib/validation'
import { useRejectPayment } from '@/hooks/use-payments'
import { paymentSubject } from '@/components/crm/payments/labels'

// Mismo criterio que el motivo al descalificar (#173) y el override del comprobante
// (#182): validar contra el esquema antes de habilitar el botón, para no depender del 422.
const noteSchema = auditNote(NOTE_MAX)

const CONSEQUENCES: readonly string[] = [
  'Se revoca la entrada: si el lead ya tiene el QR, el escáner la va a rechazar en la puerta.',
  'La oportunidad se cierra como perdida, con este motivo en su historial.',
  'No se deshace con un click: para revertirlo hay que rehacer la venta a mano.',
]

function ConsequencesWarning() {
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/[0.07] px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
        <TicketX className="size-3.5 shrink-0" />
        Rechazar el pago hace esto:
      </p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs font-normal text-zinc-300">
        {CONSEQUENCES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}

interface PaymentRejectDialogProps {
  payment: PendingPayment | null
  onClose: () => void
}

/** Rechazo de un pago de la cola de conciliación (server#274): el dinero no entró.
 *  Revierte algo que ya se entregó, así que la nota es obligatoria —es lo único que
 *  después explica por qué se le anuló la entrada a alguien— y las consecuencias se
 *  dicen antes de ejecutar, no después. */
export function PaymentRejectDialog({ payment, onClose }: PaymentRejectDialogProps) {
  const reject = useRejectPayment()
  const [note, setNote] = useState('')

  const parsed = noteSchema.safeParse(note)
  // El error del cliente aparece recién cuando el operador escribió algo.
  const clientError =
    note.length > 0 && !parsed.success ? (parsed.error.issues[0]?.message ?? null) : null
  const serverError = apiErrorMessage(reject.error)

  function close() {
    setNote('')
    reject.reset()
    onClose()
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!parsed.success || reject.isPending || !payment) return
    reject.mutate({ paymentId: payment.id, note: parsed.data }, { onSuccess: close })
  }

  return (
    <Dialog open={payment !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Rechazar el pago</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {payment ? `${paymentSubject(payment)}. ` : ''}
            El dinero no está en el extracto del banco.
          </DialogDescription>
        </DialogHeader>

        <ConsequencesWarning />

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-reject-note" className="text-xs font-medium text-zinc-400">
              Motivo
            </Label>
            <Textarea
              id="payment-reject-note"
              autoFocus
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ej.: la transacción 8842190 no aparece en el extracto del 22/08."
              maxLength={NOTE_MAX}
              className="min-h-20 border-white/10 bg-white/[0.03] text-sm text-white"
            />
            {(clientError ?? serverError) && (
              <p className="text-xs font-normal text-rose-400">{clientError ?? serverError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={close}
              className="text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!parsed.success || reject.isPending}
              className="bg-gradient-to-b from-rose-500 to-rose-700 text-white hover:from-rose-400 hover:to-rose-600"
            >
              {reject.isPending ? 'Rechazando…' : 'Rechazar y revocar la entrada'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
