'use client'

import Link from 'next/link'
import { CalendarDays, CalendarX2 } from 'lucide-react'

import { hasPassed } from '@/components/crm/agenda/labels'
import { useEvents } from '@/hooks/use-agenda'
import { EVENT_STATUS_CLOSED } from '@/lib/api/agenda'
import type { ServiceModality } from '@/lib/api/catalogo'

/** ¿Este servicio emite entrada con QR? Solo esos dependen de la Agenda. */
function emitsEntry(modality: ServiceModality | null): boolean {
  return modality === 'presencial' || modality === 'hibrido'
}

/** Cuántas fechas próximas tiene un servicio que emite entradas, con link a la Agenda
 *  ya filtrada. Existe para que el catálogo diga solo que la fecha vive en la Agenda:
 *  un presencial sin evento próximo NO entrega la entrada sola (aviso `no_event`),
 *  y esa dependencia era invisible desde esta pantalla. */
export function ServiceEventsLink({
  serviceId,
  modality,
}: {
  serviceId: string
  modality: ServiceModality | null
}) {
  const { data: events } = useEvents()
  if (!emitsEntry(modality)) return null
  // Cargando o sin permiso de agenda: no se muestra nada en vez de romper la fila.
  if (!events) return null

  // Mismo criterio que el gate de entrega: ni cerrado ni con la fecha ya pasada.
  const upcoming = events.filter(
    (event) =>
      event.service_id === serviceId &&
      event.status !== EVENT_STATUS_CLOSED &&
      !hasPassed(event),
  ).length

  if (upcoming === 0) {
    return (
      <Link
        href={`/agenda?service=${serviceId}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-amber-300/90 hover:text-amber-200"
      >
        <CalendarX2 className="size-3" />
        sin eventos próximos — cargar en Agenda
      </Link>
    )
  }

  return (
    <Link
      href={`/agenda?service=${serviceId}`}
      onClick={(e) => e.stopPropagation()}
      className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200"
    >
      <CalendarDays className="size-3" />
      {upcoming} {upcoming === 1 ? 'evento próximo' : 'eventos próximos'} en Agenda
    </Link>
  )
}
