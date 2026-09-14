'use client'

import { useState } from 'react'

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
import { NOTE_MAX } from '@/lib/api/receipt'
import { auditNote } from '@/lib/validation'
import { useOverrideReceipt } from '@/hooks/use-receipt'

// Mismo criterio que el motivo al descalificar (#173): validar contra el esquema antes
// de habilitar el botón, para no depender del 422 del backend.
const noteSchema = auditNote(NOTE_MAX)

interface ReceiptOverrideDialogProps {
  cardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Override del comprobante (server#272): validar un pago que el sistema no aprobaría
 *  exige una nota. Es lo único que después explica la decisión, así que queda auditada
 *  en el comprobante y como motivo del movimiento de la card. */
export function ReceiptOverrideDialog({
  cardId,
  open,
  onOpenChange,
}: ReceiptOverrideDialogProps) {
  const override = useOverrideReceipt(cardId)
  const [note, setNote] = useState('')

  const parsed = noteSchema.safeParse(note)
  // El error del cliente aparece recién cuando el operador escribió algo: un campo
  // vacío al abrir no es un error todavía.
  const clientError =
    note.length > 0 && !parsed.success ? (parsed.error.issues[0]?.message ?? null) : null
  const serverError = apiErrorMessage(override.error)

  function close() {
    setNote('')
    override.reset()
    onOpenChange(false)
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!parsed.success || override.isPending) return
    override.mutate(parsed.data, { onSuccess: close })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Validar el pago a mano</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Este comprobante no pasó las verificaciones. Si igual corresponde aprobarlo,
            escribí por qué: la nota queda en el comprobante y en el historial de la card.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="receipt-override-note"
              className="text-xs font-medium text-zinc-400"
            >
              Motivo
            </Label>
            <Textarea
              id="receipt-override-note"
              autoFocus
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ej.: pagó 900 porque incluye el material impreso, acordado por teléfono."
              maxLength={NOTE_MAX}
              className="min-h-20 border-white/10 bg-white/[0.03] text-sm text-white"
            />
            {(clientError ?? serverError) && (
              <p className="text-xs font-normal text-rose-400">
                {clientError ?? serverError}
              </p>
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
              disabled={!parsed.success || override.isPending}
              className="bg-gradient-to-b from-violet-500 to-violet-700 text-white hover:from-violet-400 hover:to-violet-600"
            >
              {override.isPending ? 'Validando…' : 'Validar el pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
