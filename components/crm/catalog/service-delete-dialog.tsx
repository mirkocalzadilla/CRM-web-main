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
import { useDeleteService } from '@/hooks/use-catalogo'

interface ServiceDeleteDialogProps {
  serviceId: string
  serviceName: string
  disabled?: boolean
}

/** Baja de servicio del catálogo con doble confirmación: abrir el diálogo + tildar el
 *  checkbox "entiendo que se elimina" para habilitar el botón destructivo. */
export function ServiceDeleteDialog({
  serviceId,
  serviceName,
  disabled,
}: ServiceDeleteDialogProps) {
  const del = useDeleteService()
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function handleDelete() {
    if (!confirmed || del.isPending) return
    del.mutate(serviceId, {
      onSuccess: () => {
        setOpen(false)
        setConfirmed(false)
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
          size="icon"
          aria-label="Eliminar"
          disabled={disabled}
          className="text-zinc-400 hover:text-red-400"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Eliminar servicio</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Vas a eliminar <span className="font-medium text-zinc-200">{serviceName}</span> del
            catálogo. El agente dejará de ofrecerlo. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5">
          <Checkbox
            checked={confirmed}
            onCheckedChange={(value) => setConfirmed(value === true)}
            className="border-zinc-600 data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600"
          />
          <span className="text-xs text-zinc-300">Entiendo que se eliminará del catálogo.</span>
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
