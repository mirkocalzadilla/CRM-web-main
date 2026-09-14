// Puente realtime (SPEC_CRM_FRONT §4.6 / §8).
//
// El SSE ya aterrizó: `useRealtimeEvents` (hooks/use-realtime-events.ts) abre un
// EventSource a `/crm/events?token=…` y llama a `invalidateQueries` por tipo de
// evento. Estos `refetchInterval` quedan como fallback conservador (SPEC_B5 §3.5):
// si el stream se cae, el polling sigue refrescando. Si genera ruido, basta poner
// `refetchInterval: false` en `use-board`/`use-card`.

export const POLL_BOARD_MS = 10_000
export const POLL_CARD_MS = 5_000
