'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useDeleteCard } from '@/hooks/use-card-mutations'

interface OpportunityDeleteDialogProps {
  cardId: string
  cardTitle: string
  onDeleted: () => void
}

/** Baja de oportunidad con doble confirmación: abrir el diálogo + tildar el checkbox
 *  "entiendo que es permanente" para habilitar el botón destructivo. */
export function OpportunityDeleteDialog({
  cardId,
  cardTitle,
  onDeleted,
}: OpportunityDeleteDialogProps) {
  const del = useDeleteCard()
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function handleDelete() {
    if (!confirmed || del.isPending) return
    del.mutate(cardId, {
      onSuccess: () => {
        setOpen(false)
        setConfirmed(false)
        onDeleted()
      },
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setConfirmed(false)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="size-3.5" />
          Eliminar oportunidad
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Eliminar oportunidad</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Vas a eliminar <span className="font-medium text-zinc-200">{cardTitle}</span> y todo su
            historial de movimientos. Esta acción es permanente y no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5">
          <Checkbox
            checked={confirmed}
            onCheckedChange={(value) => setConfirmed(value === true)}
            className="border-zinc-600 data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600"
          />
          <span className="text-xs text-zinc-300">Entiendo que se eliminará permanentemente.</span>
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white">
            Cancelar
          </AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={!confirmed || del.isPending}
            className="bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
          >
            {del.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
