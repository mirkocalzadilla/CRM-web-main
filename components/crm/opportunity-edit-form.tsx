'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateCard } from '@/hooks/use-card-mutations'

interface OpportunityEditFormProps {
  cardId: string
  initialName: string
  initialNotes: string
  onDone: () => void
}

const FIELD = 'border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-zinc-600'
const LABEL = 'text-xs font-medium text-zinc-400'

/** Edición inline de nombre + notas de la oportunidad (#54). */
export function OpportunityEditForm({
  cardId,
  initialName,
  initialNotes,
  onDone,
}: OpportunityEditFormProps) {
  const update = useUpdateCard(cardId)
  const [name, setName] = useState(initialName)
  const [notes, setNotes] = useState(initialNotes)

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (update.isPending) return
    update.mutate(
      { full_name: name.trim() || null, notes: notes.trim() || null },
      { onSuccess: onDone },
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="edit-name" className={LABEL}>
          Nombre
        </Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre del lead"
          className={FIELD}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-notes" className={LABEL}>
          Notas
        </Label>
        <Textarea
          id="edit-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ej: cliente enojado, cambió la fecha de la boda…"
          rows={4}
          className={FIELD}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={update.isPending}
          className="flex-1 bg-gradient-to-b from-violet-500 to-violet-700 text-sm text-white hover:from-violet-400 hover:to-violet-600 disabled:opacity-60"
        >
          {update.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
