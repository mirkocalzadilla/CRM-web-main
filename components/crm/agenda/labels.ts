import {
  EVENT_STATUS_ACTIVE,
  EVENT_STATUS_CLOSED,
  type EventRead,
} from '@/lib/api/agenda'

export const EVENT_STATUS_SCHEDULED = 'scheduled'

/** Los tres estados, en el orden en que ocurren. El `status` viaja como `string` desde
 *  el backend, así que un estado nuevo se muestra crudo en vez de romper la pantalla. */
export const eventStatuses = [
  { value: EVENT_STATUS_SCHEDULED, label: 'Programado' },
  { value: EVENT_STATUS_ACTIVE, label: 'En curso' },
  { value: EVENT_STATUS_CLOSED, label: 'Cerrado' },
] as const

export function statusLabel(status: string): string {
  return eventStatuses.find((s) => s.value === status)?.label ?? status
}

export function statusClasses(status: string): string {
  if (status === EVENT_STATUS_ACTIVE) {
    return 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300'
  }
  if (status === EVENT_STATUS_CLOSED) {
    return 'border-white/10 bg-white/[0.03] text-zinc-500'
  }
  return 'border-violet-500/25 bg-violet-500/[0.08] text-violet-300'
}

/** Fecha y hora en la zona del negocio, que es la que lee quien organiza el evento. */
export function formatStartsAt(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    timeZone: 'America/La_Paz',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Un evento ya pasó (sirve para atenuarlo en la lista, no para bloquearlo). */
export function hasPassed(event: EventRead): boolean {
  return new Date(event.starts_at).getTime() < Date.now()
}

/** Cupo legible: "12 / 50" o "12 emitidas" cuando no hay tope. */
export function capacityLabel(event: EventRead): string {
  return event.capacity === null ? `${event.issued} emitidas` : `${event.issued} / ${event.capacity}`
}

/** Cupo lleno: el fulfillment deja de entregar solo y avisa. */
export function isFull(event: EventRead): boolean {
  return event.capacity !== null && event.issued >= event.capacity
}

/** `datetime-local` necesita `YYYY-MM-DDTHH:mm` en hora local del navegador. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
