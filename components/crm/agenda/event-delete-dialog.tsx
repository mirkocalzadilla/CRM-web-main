'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteEvent } from '@/hooks/use-agenda'
import type { EventRead } from '@/lib/api/agenda'

interface EventDeleteDialogProps {
  event: EventRead | null
  onOpenChange: (open: boolean) => void
}

/** Borrar el evento **no** borra las entradas ya emitidas: quien las tiene en el
 *  teléfono sigue con su QR. Se dice explícitamente porque es lo que decide si borrar
 *  o cerrar el evento. */
export function EventDeleteDialog({ event, onOpenChange }: EventDeleteDialogProps) {
  const remove = useDeleteEvent()

  return (
    <AlertDialog open={event !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-zinc-950">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            ¿Eliminar “{event?.nombre}”?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-zinc-400">
            <span className="block">
              Las {event?.issued ?? 0} entradas ya emitidas <strong>no se borran</strong>: quien
              las tiene sigue con su QR, pero queda sin fecha y en la puerta hay que verificarla
              a mano.
            </span>
            <span className="block">
              Si el evento ya pasó, conviene marcarlo <strong>Cerrado</strong> en vez de borrarlo.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/[0.03] text-white">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={remove.isPending}
            onClick={() => {
              if (event !== null) {
                remove.mutate(event.id, { onSuccess: () => onOpenChange(false) })
              }
            }}
            className="bg-rose-600 text-white hover:bg-rose-500"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
