'use client'

import { useRealtimeEvents } from '@/hooks/use-realtime-events'

/**
 * Componente invisible: monta el stream SSE del CRM. Se inyecta una vez en el
 * layout del CRM para que el board y el hilo sean reactivos sin polling.
 */
export function RealtimeSync() {
  useRealtimeEvents()
  return null
}
