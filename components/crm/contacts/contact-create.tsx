'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCreateContact } from '@/hooks/use-contacts'

interface ContactCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Teléfono precargado (ej. convertir el número de una oportunidad en contacto, #84). */
  defaultPhone?: string
  /** Nombre precargado (ej. el nombre ya capturado en la oportunidad). */
  defaultName?: string
  /** Se invoca tras crear con éxito (ej. refrescar el detalle de la card). */
  onCreated?: () => void
}

export function ContactCreateSheet({
  open,
  onOpenChange,
  defaultPhone = '',
  defaultName = '',
  onCreated,
}: ContactCreateSheetProps) {
  const create = useCreateContact()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')

  // Al abrir, precarga teléfono y nombre desde la oportunidad. Patrón de ajuste-en-render
  // (sin effect): React reejecuta antes de pintar, sin parpadeo.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setPhone(defaultPhone)
      setName(defaultName)
    }
  }

  // Nombre y teléfono son obligatorios: no puede haber un contacto sin nombre (server#229).
  const canSave = phone.trim().length > 0 && name.trim().length > 0 && !create.isPending

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSave) return
    await create.mutateAsync({ phone: phone.trim(), full_name: name.trim() })
    setPhone('')
    setName('')
    onCreated?.()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full bg-zinc-950 text-white sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-white">Nuevo contacto</SheetTitle>
          <SheetDescription>
            Normalmente los contactos se crean al ganar una oportunidad. Acá podés agregarlo a mano.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-4 px-4 pb-8">
          <div className="space-y-1.5">
            <Label htmlFor="new-phone" className="text-xs font-medium text-zinc-400">
              Teléfono
            </Label>
            <Input
              id="new-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="59170000000"
              className="border-white/10 bg-white/[0.03] text-sm text-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-name" className="text-xs font-medium text-zinc-400">
              Nombre
            </Label>
            <Input
              id="new-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del contacto"
              className="border-white/10 bg-white/[0.03] text-sm text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={!canSave}
            className="w-full bg-gradient-to-b from-violet-500 to-violet-700 text-white"
          >
            {create.isPending ? 'Creando…' : 'Crear contacto'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
