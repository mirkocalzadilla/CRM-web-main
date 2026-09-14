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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useMoveCard } from '@/hooks/use-card-mutations'
import type { Boards, Card } from '@/lib/api/crm'
import { formatPhone } from '@/lib/format'

/** Motivos frecuentes de descalificación (copy de UI). 'Otro' exige texto libre. */
const OTHER = 'Otro'
const DISQUALIFY_REASONS = [
  'Precio fuera de presupuesto',
  'No responde',
  'Lead duplicado',
  'Fuera de alcance/zona',
  'No calificado',
  OTHER,
] as const

/** Move a un stage 'lost' que espera el motivo antes de confirmar. */
export interface PendingDisqualify {
  cardId: string
  stageId: string
  phone: string
}

/** Gate de "descalificar exige motivo" (web#173): si el move apunta a un stage 'lost'
 *  (por status_code, NO por nombre) devuelve el PendingDisqualify para abrir este dialog
 *  en vez de mover directo. Cualquier otro destino → null (drag sin fricción). */
export function pendingDisqualifyFor(
  boards: Boards | undefined,
  cardId: string,
  stageId: string,
): PendingDisqualify | null {
  let card: Card | undefined
  let stage: Boards['pipelines'][number]['stages'][number] | undefined
  for (const pipeline of boards?.pipelines ?? []) {
    for (const s of pipeline.stages) {
      if (s.id === stageId) stage = s
      card ??= s.cards.find((c) => c.id === cardId)
    }
  }
  if (!card || stage?.status_code !== 'lost') return null
  return { cardId, stageId, phone: card.phone }
}

/** Construye el motivo final: 'Otro' → el texto libre es el motivo; un preset con nota
 *  se combina; un preset sin nota va tal cual. */
function buildReason(motivo: string, note: string): string {
  const n = note.trim()
  if (motivo === OTHER) return n
  return n ? `${motivo} — ${n}` : motivo
}

interface DisqualifyReasonDialogProps {
  pending: PendingDisqualify | null
  onClose: () => void
}

/** Descalificar exige motivo (web#173): al soltar una card en un stage 'lost' se pide
 *  un motivo (dropdown de frecuentes + nota libre opcional) antes de mover. El motivo
 *  queda en el audit del move (server#253). Cancelar no mueve la card. */
export function DisqualifyReasonDialog({ pending, onClose }: DisqualifyReasonDialogProps) {
  const moveCard = useMoveCard()
  const [motivo, setMotivo] = useState('')
  const [note, setNote] = useState('')

  // Reset de los campos al abrir para otra card (ajuste-en-render, sin effect).
  const [lastCardId, setLastCardId] = useState<string | null>(null)
  if (pending && pending.cardId !== lastCardId) {
    setLastCardId(pending.cardId)
    setMotivo('')
    setNote('')
  }

  const needsNote = motivo === OTHER
  const canConfirm =
    motivo.length > 0 &&
    (!needsNote || note.trim().length > 0) &&
    !moveCard.isPending

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canConfirm || !pending) return
    moveCard.mutate(
      {
        cardId: pending.cardId,
        stageId: pending.stageId,
        reason: buildReason(motivo, note),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={pending !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Descalificar oportunidad</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Indicá por qué se descalifica la oportunidad
            {pending ? ` de ${formatPhone(pending.phone)}` : ''}. El motivo queda en el
            historial de la card.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="disqualify-reason" className="text-xs font-medium text-zinc-400">
              Motivo
            </Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger
                id="disqualify-reason"
                className="w-full border-white/10 bg-white/[0.03] text-sm text-white"
              >
                <SelectValue placeholder="Elegí un motivo" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-950 text-white">
                {DISQUALIFY_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disqualify-note" className="text-xs font-medium text-zinc-400">
              {needsNote ? 'Detalle' : 'Detalle (opcional)'}
            </Label>
            <Textarea
              id="disqualify-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={needsNote ? 'Escribí el motivo' : 'Agregá un detalle si querés'}
              maxLength={2000}
              className="min-h-20 border-white/10 bg-white/[0.03] text-sm text-white"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canConfirm}
              className="bg-gradient-to-b from-rose-500 to-rose-700 text-white hover:from-rose-400 hover:to-rose-600"
            >
              {moveCard.isPending ? 'Descalificando…' : 'Descalificar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
