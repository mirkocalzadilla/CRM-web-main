'use client'

import { useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceRow } from '@/components/crm/entries/attendance-row'
import { useAttendance } from '@/hooks/use-entries'
import type { Attendee } from '@/lib/api/entries'

/** Búsqueda sin acentos: en la puerta se tipea rápido y con una mano, y "muñoz" tiene que
 *  encontrar a "Muñoz". El rango cubre los diacríticos combinantes que deja el NFD. */
function searchKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function filterAttendees(attendees: Attendee[], query: string): Attendee[] {
  const term = searchKey(query.trim())
  if (term === '') return attendees
  return attendees.filter((attendee) => searchKey(attendee.lead_name).includes(term))
}

interface AttendanceListProps {
  eventId: string | null
  checkingIn: string | null
  onCheckIn: (entryId: string) => void
}

/** Lista de asistencia del evento: quién tiene entrada, quién ya entró y quién pasó a
 *  mano. Es el camino de escape cuando la cámara no sirve. */
export function AttendanceList({ eventId, checkingIn, onCheckIn }: AttendanceListProps) {
  const [query, setQuery] = useState('')
  const { data, isLoading, isError } = useAttendance(eventId)

  const visible = useMemo(
    () => filterAttendees(data?.attendees ?? [], query),
    [data?.attendees, query],
  )

  if (eventId === null) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-zinc-400">
        Elegí arriba el evento que estás controlando para ver su lista de asistencia.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton key={index} className="h-12 w-full bg-white/[0.04]" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <p className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-3 py-3 text-sm text-rose-200">
        No pudimos cargar la lista de asistencia. Reintentá en unos segundos.
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-base text-zinc-300">
          <Users className="size-5 text-violet-300" />
          <span className="text-xl font-bold text-white">{data.checked_in}</span>
          de {data.total} adentro
        </p>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-zinc-500" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre"
          aria-label="Buscar por nombre"
          className="h-14 border-white/10 bg-white/[0.04] pl-11 text-base text-white placeholder:text-zinc-500"
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-zinc-400">
          {data.attendees.length === 0
            ? 'Este evento todavía no tiene entradas emitidas.'
            : 'Nadie con ese nombre en la lista. Revisá cómo está escrito, o pedile el QR.'}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] px-3">
          {visible.map((attendee) => (
            <AttendanceRow
              key={attendee.entry_id}
              attendee={attendee}
              pending={checkingIn === attendee.entry_id}
              onCheckIn={onCheckIn}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
