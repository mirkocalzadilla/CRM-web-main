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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDeleteUser } from '@/hooks/use-users'

interface UserDeleteDialogProps {
  userId: string
  userLabel: string
  /** Fila del propio usuario: no podés auto-eliminarte (el backend igual lo bloquea). */
  isSelf?: boolean
}

/** Baja de usuario con confirmación. Deshabilitada en la fila propia (anti-self-lockout). */
export function UserDeleteDialog({ userId, userLabel, isSelf }: UserDeleteDialogProps) {
  const del = useDeleteUser()
  const [open, setOpen] = useState(false)

  function handleDelete() {
    if (del.isPending) return
    del.mutate(userId, { onSuccess: () => setOpen(false) })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Span: un botón disabled no dispara eventos y el tooltip no abriría (#138). */}
          <span className="inline-flex">
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  isSelf ? 'No podés eliminar tu propia cuenta' : `Eliminar ${userLabel}`
                }
                disabled={isSelf}
                className="text-zinc-400 hover:text-red-400 disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {isSelf
            ? 'No podés eliminar tu propia cuenta (anti-bloqueo)'
            : `Eliminar ${userLabel}`}
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Eliminar usuario</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Vas a eliminar a <span className="font-medium text-zinc-200">{userLabel}</span>. Perderá
            el acceso al sistema. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white">
            Cancelar
          </AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={del.isPending}
            className="bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
          >
            {del.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
