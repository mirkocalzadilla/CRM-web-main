'use client'

import { MapPin, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  capacityLabel,
  formatStartsAt,
  hasPassed,
  isFull,
  statusClasses,
  statusLabel,
} from '@/components/crm/agenda/labels'
import type { EventRead } from '@/lib/api/agenda'
import { cn } from '@/lib/utils'

interface EventTableProps {
  events: EventRead[]
  onEdit: (event: EventRead) => void
  onDelete: (event: EventRead) => void
}

export function EventTable({ events, onEdit, onDelete }: EventTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-zinc-500">Evento</TableHead>
            <TableHead className="text-zinc-500">Cuándo</TableHead>
            <TableHead className="text-zinc-500">Dónde</TableHead>
            <TableHead className="text-zinc-500">Cupo</TableHead>
            <TableHead className="text-zinc-500">Estado</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              className={cn('border-white/5', hasPassed(event) && 'opacity-55')}
            >
              <TableCell className="font-medium text-white">{event.nombre}</TableCell>
              <TableCell className="whitespace-nowrap text-zinc-300">
                {formatStartsAt(event.starts_at)}
              </TableCell>
              <TableCell className="max-w-56 text-zinc-400">
                <span className="line-clamp-2">{event.location ?? '—'}</span>
                {event.maps_url !== null && (
                  <a
                    href={event.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
                  >
                    <MapPin className="size-3" /> ver mapa
                  </a>
                )}
              </TableCell>
              <TableCell
                className={cn('whitespace-nowrap', isFull(event) ? 'text-amber-300' : 'text-zinc-400')}
              >
                {capacityLabel(event)}
                {isFull(event) && <span className="block text-xs">cupo lleno</span>}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-xs whitespace-nowrap',
                    statusClasses(event.status),
                  )}
                >
                  {statusLabel(event.status)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Editar ${event.nombre}`}
                    onClick={() => onEdit(event)}
                    className="size-8 text-zinc-400 hover:text-white"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Eliminar ${event.nombre}`}
                    onClick={() => onDelete(event)}
                    className="size-8 text-zinc-400 hover:text-rose-300"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
