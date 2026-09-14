'use client'

import { useForm } from 'react-hook-form'
import { CalendarPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { EventFields, type FormValues } from '@/components/crm/agenda/event-form'
import { toLocalInput } from '@/components/crm/agenda/labels'
import { useCreateEvent, useUpdateEvent } from '@/hooks/use-agenda'
import type { EventRead } from '@/lib/api/agenda'

interface EventEditorProps {
  /** `null` = alta. */
  event: EventRead | null
  /** Preselección del servicio en el alta (llega del filtro `?service=` del catálogo). */
  defaultServiceId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function defaults(event: EventRead | null, defaultServiceId?: string | null): FormValues {
  return {
    service_id: event?.service_id ?? defaultServiceId ?? '',
    nombre: event?.nombre ?? '',
    starts_at: event ? toLocalInput(event.starts_at) : '',
    location: event?.location ?? '',
    maps_url: event?.maps_url ?? '',
    capacity: event?.capacity === null || event === null ? '' : String(event.capacity),
    status: event?.status ?? 'scheduled',
  }
}

/** Alta y edición del evento. El servicio sólo se elige al crear: moverlo después
 *  dejaría las entradas ya emitidas apuntando a otra cosa. */
export function EventEditor({ event, defaultServiceId, open, onOpenChange }: EventEditorProps) {
  const isNew = event === null
  const create = useCreateEvent()
  const update = useUpdateEvent()
  const pending = create.isPending || update.isPending

  const { control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: defaults(event, defaultServiceId),
    mode: 'onBlur',
  })

  function onSubmit(values: FormValues) {
    const body = {
      nombre: values.nombre.trim(),
      // `datetime-local` no lleva zona: se interpreta en la del navegador, que es la
      // del negocio, y viaja como ISO con offset.
      starts_at: new Date(values.starts_at).toISOString(),
      location: values.location.trim() || null,
      maps_url: values.maps_url.trim() || null,
      capacity: values.capacity.trim() === '' ? null : Number(values.capacity),
      status: values.status,
    }
    const done = { onSuccess: () => onOpenChange(false) }
    if (isNew) {
      create.mutate({ ...body, service_id: values.service_id }, done)
      return
    }
    update.mutate({ eventId: event.id, body }, done)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CalendarPlus className="size-5 text-violet-300" />
            {isNew ? 'Nuevo evento' : 'Editar evento'}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            La fecha y el lugar viajan en el mensaje que recibe quien compra, y el escáner
            rechaza en la puerta las entradas de otra fecha.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <EventFields control={control} lockService={!isNew} />

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10 bg-white/[0.03] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending || !formState.isValid}
              className="gap-2 bg-violet-600 text-white hover:bg-violet-500"
            >
              {pending && <Spinner className="size-4" />}
              {isNew ? 'Crear evento' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
