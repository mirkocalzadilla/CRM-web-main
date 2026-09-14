'use client'

import { useEffect } from 'react'

import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import type { Boards } from '@/lib/api/crm'
import { boardKeys } from '@/hooks/use-board'
import { cardKeys } from '@/hooks/use-card'
import { paymentKeys } from '@/hooks/use-payments'
import { receiptKeys } from '@/hooks/use-receipt'
import { useAuthStore } from '@/store/auth-store'

// SPEC_B5_sse-front §2: contrato del stream `GET /crm/events?token=<jwt>`.
const crmEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('card_moved'),
    card_id: z.string(),
    stage: z.string(),
    pipeline_kind: z.string().optional(),
    conversation_id: z.string().optional(),
  }),
  z.object({
    type: z.literal('handoff'),
    conversation_id: z.string(),
    external_id: z.string(),
    reason: z.string(),
    summary: z.string(),
  }),
  z.object({
    type: z.literal('ai_active_changed'),
    conversation_id: z.string(),
    is_ai_active: z.boolean(),
  }),
  // server#288: el turno del agente falló fuera del flujo de handoff (error interno /
  // envío). El evento de sistema ya está persistido en el hilo.
  z.object({
    type: z.literal('agent_error'),
    conversation_id: z.string(),
    category: z.string().optional(),
  }),
  // server 0036: alguien marcó la oportunidad como atendida y sale de la cola. Llega a
  // las demás sesiones para que no sigan viendo trabajo que ya se tomó otra persona.
  z.object({
    type: z.literal('card_attended'),
    card_id: z.string(),
    conversation_id: z.string().optional(),
  }),
  // UAT 2026-08-31: la validación automática dejó el comprobante en revisión. La card no
  // se mueve (no hay card_moved), así que sin esto el aviso, la nota del resumen IA y el
  // semáforo del panel esperaban al poll.
  z.object({
    type: z.literal('receipt_needs_review'),
    card_id: z.string(),
    conversation_id: z.string(),
  }),
])

type CrmEvent = z.infer<typeof crmEventSchema>

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1'

/** Busca el card.id cuya conversación coincide, recorriendo el cache del board. */
function findCardIdByConversation(
  queryClient: QueryClient,
  conversationId: string,
): string | null {
  const boards = queryClient.getQueryData<Boards>(boardKeys.all)
  if (!boards) return null
  for (const pipeline of boards.pipelines) {
    for (const stage of pipeline.stages) {
      const card = stage.cards.find((c) => c.conversation_id === conversationId)
      if (card) return card.id
    }
  }
  return null
}

/** Traduce cada evento del stream a invalidaciones puntuales de React Query. */
function handleEvent(event: CrmEvent, queryClient: QueryClient) {
  switch (event.type) {
    case 'card_moved':
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(event.card_id) })
      // El comprobante lo procesa un worker y el move a "Por validar pago" es el
      // momento exacto en que aparece (server#272): refrescarlo acá lo muestra en la
      // card abierta sin esperar el poll.
      queryClient.invalidateQueries({ queryKey: receiptKeys.detail(event.card_id) })
      // Un pago entra a la cola de conciliación en el mismo instante en que el sistema
      // lo aprueba y mueve la card (server#274): refrescar el contador acá lo muestra
      // sin esperar el poll.
      queryClient.invalidateQueries({ queryKey: paymentKeys.pending })
      break
    case 'card_attended':
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(event.card_id) })
      break
    case 'receipt_needs_review':
      // Board (aviso "revisar comprobante"), card (resumen IA con la nota) y panel
      // (semáforo) cambiaron sin que la card se mueva: refrescar los tres.
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(event.card_id) })
      queryClient.invalidateQueries({ queryKey: receiptKeys.detail(event.card_id) })
      break
    case 'handoff': {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      // El handoff apaga is_ai_active server-side; refrescar la card abierta para que el
      // toggle lo refleje sin reload (New#1a). El evento trae conversation_id.
      const cardId = findCardIdByConversation(queryClient, event.conversation_id)
      if (cardId) {
        queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      }
      break
    }
    case 'ai_active_changed': {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      // El evento trae conversation_id; cardKeys.detail se indexa por card.id.
      const cardId = findCardIdByConversation(queryClient, event.conversation_id)
      if (cardId) {
        queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      }
      break
    }
    case 'agent_error': {
      // Refrescar board + card abierta para que el chip de error aparezca sin esperar el poll.
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      const cardId = findCardIdByConversation(queryClient, event.conversation_id)
      if (cardId) {
        queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      }
      break
    }
  }
}

/**
 * Abre un EventSource al stream SSE del CRM y despacha invalidaciones de React
 * Query por tipo de evento. El browser reconecta solo ante cortes; el polling
 * de `use-board`/`use-card` queda como fallback (SPEC_B5 §3.5).
 */
export function useRealtimeEvents() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return

    // EventSource no admite headers custom → el JWT viaja en ?token=.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BASE_URL
    const url = `${baseUrl}/crm/events?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)

    es.onmessage = (e) => {
      let raw: unknown
      try {
        raw = JSON.parse(e.data)
      } catch {
        return // payload no-JSON → ignorar
      }
      const parsed = crmEventSchema.safeParse(raw)
      if (!parsed.success) return // tipo desconocido → ignorar
      handleEvent(parsed.data, queryClient)
    }

    es.onerror = () => {
      // El EventSource nativo reintenta solo; no cerrar acá.
    }

    return () => es.close()
  }, [token, queryClient])
}
