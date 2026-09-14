'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  checkInEntry,
  getAttendance,
  redeemEntry,
  type Attendance,
  type RedeemResult,
} from '@/lib/api/entries'
import { apiErrorMessage } from '@/lib/api/errors'

export const entryKeys = {
  attendance: (eventId: string) => ['crm', 'attendance', eventId] as const,
}

/** Refresco de la lista de asistencia. Corto a propósito: en la puerta puede haber dos
 *  teléfonos admitiendo la misma fila, y quien mira la lista necesita ver lo que acaba de
 *  escanear el otro. */
const POLL_ATTENDANCE_MS = 10_000

export function useAttendance(eventId: string | null) {
  return useQuery<Attendance>({
    queryKey: entryKeys.attendance(eventId ?? ''),
    queryFn: () => getAttendance(eventId ?? ''),
    enabled: Boolean(eventId),
    refetchInterval: POLL_ATTENDANCE_MS,
  })
}

interface RedeemArgs {
  token: string
  eventId: string | null
}

/** Escaneo. **Sin toast por un rechazo**: un rechazo es una respuesta válida y la pantalla
 *  entera es el mensaje. El toast queda para la falla de red, que es lo único que la
 *  pantalla de veredicto no puede contar. */
export function useRedeemEntry() {
  const queryClient = useQueryClient()

  return useMutation<RedeemResult, Error, RedeemArgs>({
    mutationFn: ({ token, eventId }) => redeemEntry(token, eventId),
    onSuccess: (_result, { eventId }) => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: entryKeys.attendance(eventId) })
      }
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? 'No pudimos consultar la entrada. Reintentá.')
    },
  })
}

/** Check-in a mano desde la lista, cuando la cámara no sirve. Mismo shape de respuesta
 *  que el escaneo, así que el veredicto se muestra con el mismo componente. */
export function useCheckInEntry(eventId: string | null) {
  const queryClient = useQueryClient()

  return useMutation<RedeemResult, Error, string>({
    mutationFn: (entryId) => checkInEntry(entryId, eventId),
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: entryKeys.attendance(eventId) })
      }
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? 'No pudimos registrar la entrada. Reintentá.')
    },
  })
}
