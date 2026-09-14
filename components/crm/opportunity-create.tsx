'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCreateCard } from '@/hooks/use-card-mutations'

interface OpportunityCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FIELD = 'border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-zinc-600'
const LABEL = 'text-xs font-medium text-zinc-400'

/** Alta manual de oportunidad (#54): teléfono + nombre + notas. Entra al primer stage
 *  del embudo con el chat vacío. */
export function OpportunityCreateSheet({ open, onOpenChange }: OpportunityCreateSheetProps) {
  const create = useCreateCard()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  const canSave = phone.trim().length > 0 && !create.isPending

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSave) return
    create.mutate(
      {
        phone: phone.trim(),
        full_name: name.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setPhone('')
          setName('')
          setNotes('')
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full bg-zinc-950 text-white sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-white">Nueva oportunidad</SheetTitle>
          <SheetDescription>
            Cargá un lead a mano. Entra al primer estado del embudo con el chat vacío.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-4 px-4 pb-8">
          <div className="space-y-1.5">
            <Label htmlFor="opp-phone" className={LABEL}>
              Teléfono
            </Label>
            <Input
              id="opp-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="59170000000"
              className={FIELD}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opp-name" className={LABEL}>
              Nombre (opcional)
            </Label>
            <Input
              id="opp-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del lead"
              className={FIELD}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opp-notes" className={LABEL}>
              Notas (opcional)
            </Label>
            <Textarea
              id="opp-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: cliente derivado por un conocido"
              rows={3}
              className={FIELD}
            />
          </div>

          <Button
            type="submit"
            disabled={!canSave}
            className="w-full bg-gradient-to-b from-violet-500 to-violet-700 text-white hover:from-violet-400 hover:to-violet-600 disabled:opacity-60"
          >
            {create.isPending ? 'Creando…' : 'Crear oportunidad'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
