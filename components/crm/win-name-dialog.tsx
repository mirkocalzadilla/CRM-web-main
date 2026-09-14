'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { moveCard, updateCard, type Boards, type Card } from '@/lib/api/crm'
import { boardKeys } from '@/hooks/use-board'
import { cardKeys } from '@/hooks/use-card'
import { formatPhone, isUnnamedLead } from '@/lib/format'

/** Move a un stage 'won' que quedó pendiente porque el lead no tiene nombre. */
export interface PendingWin {
  cardId: string
  stageId: string
  phone: string
}

/** Gate de "ganar exige nombre" (#162): si el move apunta a un stage 'won' y la
 *  card no tiene nombre, devuelve el PendingWin para abrir este dialog en vez de
 *  mover. El backend rechaza ese move con 422 de todos modos (server#241). */
export function pendingWinFor(
  boards: Boards | undefined,
  cardId: string,
  stageId: string,
): PendingWin | null {
  let card: Card | undefined
  let stage: Boards['pipelines'][number]['stages'][number] | undefined
  for (const pipeline of boards?.pipelines ?? []) {
    for (const s of pipeline.stages) {
      if (s.id === stageId) stage = s
      card ??= s.cards.find((c) => c.id === cardId)
    }
  }
  if (!card || stage?.status_code !== 'won') return null
  return isUnnamedLead(card.title, card.phone)
    ? { cardId, stageId, phone: card.phone }
    : null
}

interface WinNameDialogProps {
  pending: PendingWin | null
  onClose: () => void
}

/** Ganar exige nombre (#162): al soltar una card sin nombre en un stage 'won' se
 *  pide el nombre del lead, se guarda en la oportunidad y recién ahí se mueve —
 *  así el contacto que crea el hook de 'won' nunca nace "Sin nombre". El backend
 *  rechaza el move con 422 si llegara sin nombre (server#241). */
export function WinNameDialog({ pending, onClose }: WinNameDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  // Reset del input al abrir para otra card (ajuste-en-render, sin effect).
  const [lastCardId, setLastCardId] = useState<string | null>(null)
  if (pending && pending.cardId !== lastCardId) {
    setLastCardId(pending.cardId)
    setName('')
  }

  const winWithName = useMutation<Card, Error, { pending: PendingWin; name: string }>({
    mutationFn: async ({ pending: win, name: fullName }) => {
      await updateCard(win.cardId, { full_name: fullName })
      return moveCard(win.cardId, win.stageId)
    },
    onSuccess: (_card, { pending: win }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(win.cardId) })
      toast.success('Oportunidad ganada.')
      onClose()
    },
    onError: () => {
      toast.error('No se pudo ganar la oportunidad. Reintentá.')
    },
  })

  const canSave = name.trim().length > 0 && !winWithName.isPending

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSave || !pending) return
    winWithName.mutate({ pending, name: name.trim() })
  }

  return (
    <Dialog open={pending !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Falta el nombre del lead</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Al ganar la oportunidad
            {pending ? ` de ${formatPhone(pending.phone)}` : ''} se crea su contacto, y un
            contacto no puede quedar sin nombre. Completalo para cerrar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="win-name" className="text-xs font-medium text-zinc-400">
              Nombre
            </Label>
            <Input
              id="win-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del lead"
              className="border-white/10 bg-white/[0.03] text-sm text-white"
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
              disabled={!canSave}
              className="bg-gradient-to-b from-violet-500 to-violet-700 text-white"
            >
              {winWithName.isPending ? 'Guardando…' : 'Guardar y ganar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
