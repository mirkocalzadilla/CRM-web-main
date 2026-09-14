'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  type EventCreate,
  type EventRead,
  type EventUpdate,
} from '@/lib/api/agenda'
import { apiErrorMessage, isForbidden } from '@/lib/api/errors'

export const agendaKeys = {
  list: ['crm', 'agenda'] as const,
}

function fail(error: unknown, fallback: string): void {
  toast.error(apiErrorMessage(error) ?? fallback)
}

/** Eventos de la organización. No se reintenta ante un 403: `GET /crm/agenda` exige
 *  `client_admin`, así que para el `staff` que atiende la puerta el error es definitivo
 *  y la pantalla tiene que explicarlo, no insistir. */
export function useEvents() {
  return useQuery<EventRead[]>({
    queryKey: agendaKeys.list,
    queryFn: () => listEvents(),
    retry: (failureCount, error) => !isForbidden(error) && failureCount < 2,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation<EventRead, Error, EventCreate>({
    mutationFn: (body) => createEvent(body),
    onSuccess: (event) => {
      toast.success(`Evento "${event.nombre}" creado`)
      queryClient.invalidateQueries({ queryKey: agendaKeys.list })
    },
    onError: (error) => fail(error, 'No se pudo crear el evento.'),
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation<EventRead, Error, { eventId: string; body: EventUpdate }>({
    mutationFn: ({ eventId, body }) => updateEvent(eventId, body),
    onSuccess: () => {
      toast.success('Evento actualizado')
      queryClient.invalidateQueries({ queryKey: agendaKeys.list })
    },
    onError: (error) => fail(error, 'No se pudo actualizar el evento.'),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (eventId) => deleteEvent(eventId),
    onSuccess: () => {
      toast.success('Evento eliminado')
      queryClient.invalidateQueries({ queryKey: agendaKeys.list })
    },
    onError: (error) => fail(error, 'No se pudo eliminar el evento.'),
  })
}
