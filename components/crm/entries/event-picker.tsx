'use client'

import { useEffect } from 'react'
import { CalendarClock } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useEvents } from '@/hooks/use-agenda'
import { EVENT_STATUS_ACTIVE, EVENT_STATUS_CLOSED, type EventRead } from '@/lib/api/agenda'
import { isForbidden } from '@/lib/api/errors'
import { formatTicketTime } from '@/lib/format'

const NO_EVENT = 'sin-evento'

/** El que se está controlando ahora: el marcado `active`, o el más próximo que no esté
 *  cerrado. Ahorra un toque en la puerta, donde se atiende con una mano. */
function defaultEvent(events: EventRead[]): EventRead | undefined {
  return (
    events.find((event) => event.status === EVENT_STATUS_ACTIVE) ??
    events.find((event) => event.status !== EVENT_STATUS_CLOSED)
  )
}

interface EventPickerProps {
  eventId: string | null
  onChange: (eventId: string | null) => void
}

/** Qué evento se está controlando. Sin evento el escaneo igual funciona, pero el backend
 *  no puede rechazar una entrada de otra fecha y la lista de asistencia no se puede pedir
 *  (se pide por evento), así que la pantalla lo dice. */
export function EventPicker({ eventId, onChange }: EventPickerProps) {
  const { data: events, isLoading, error } = useEvents()

  useEffect(() => {
    if (eventId !== null || !events) return
    const fallback = defaultEvent(events)
    if (fallback) onChange(fallback.id)
  }, [eventId, events, onChange])

  if (isLoading) return <Skeleton className="h-14 w-full bg-white/[0.04]" />

  if (error) {
    return (
      <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2.5 text-sm text-amber-200/90">
        {isForbidden(error)
          ? 'Tu usuario no puede ver la agenda de eventos, así que no se puede elegir cuál se está controlando ni abrir la lista de asistencia. Escanear igual funciona: pedile a un administrador que te habilite la agenda.'
          : 'No pudimos cargar la agenda de eventos. Escanear igual funciona, pero no vamos a poder rechazar una entrada de otra fecha.'}
      </p>
    )
  }

  const list = events ?? []
  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-400">
        Todavía no hay eventos en la agenda. Escanear igual funciona, pero sin evento no se
        puede rechazar una entrada de otra fecha.
      </p>
    )
  }

  return (
    <Select
      value={eventId ?? NO_EVENT}
      onValueChange={(value) => onChange(value === NO_EVENT ? null : value)}
    >
      <SelectTrigger
        aria-label="Evento que se está controlando"
        className="h-14 w-full border-white/10 bg-white/[0.04] text-base text-white"
      >
        <CalendarClock className="size-5 text-violet-300" />
        <SelectValue placeholder="Elegí el evento" />
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-zinc-950 text-white">
        {list.map((event) => (
          <SelectItem key={event.id} value={event.id} className="py-3 text-base">
            {event.nombre}
            <span className="text-zinc-500">{formatTicketTime(event.starts_at)}</span>
          </SelectItem>
        ))}
        <SelectItem value={NO_EVENT} className="py-3 text-base text-zinc-400">
          Sin evento
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
