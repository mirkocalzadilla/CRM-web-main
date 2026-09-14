// Cola de atención: qué oportunidades necesitan que una persona haga algo.
//
// El tablero ya muestra el aviso sobre la card, pero eso solo sirve mirando la columna
// donde cayó. Esto lo da vuelta: una sola lista, los dos pipelines juntos, ordenada por
// urgencia. Se deriva del board que el CRM ya tiene en memoria — sin endpoint nuevo, y
// se actualiza con el mismo realtime que el tablero.

import type { Boards, Card, Pipeline } from '@/lib/api/crm'

/** `blocking`: nada avanza hasta que alguien decida (el lead está esperando).
 *  `pending`: el sistema puede resolverlo solo o ya entregó; la persona solo revisa. */
export type AttentionSeverity = 'blocking' | 'pending'

/** El aviso "pago por confirmar" tiene su propia cola (`/pagos`, web#184): contarlo acá
 *  también duplicaría el mismo trabajo en dos lugares y ninguno de los dos números
 *  sería el total real. Queda fuera a propósito. */
export const EXCLUDED_FLAGS: readonly string[] = ['payment_unconfirmed']

/** Severidad por código de aviso. Un código que el front todavía no conoce (backend más
 *  nuevo) no se pierde: cae en `blocking`, porque un aviso sin clasificar es justamente
 *  el que nadie sabe si puede esperar. */
const FLAG_SEVERITY: Record<string, AttentionSeverity> = {
  // Bloqueantes: el lead ya pagó y no tiene lo que compró, y el sistema no puede
  // resolverlo solo — falta una decisión o falta configuración.
  receipt_review: 'blocking',
  no_modality: 'blocking',
  missing_link: 'blocking',
  no_event: 'blocking',
  capacity_full: 'blocking',
  ambiguous_service: 'blocking',
  // No bloqueantes: ya se entregó, o el sistema reintenta solo.
  delivery_pending: 'pending',
  needs_name: 'pending',
  extra_receipt: 'pending',
}

// `awaiting_human` no es bloqueante, aunque lo parezca. Que los checks fallen es un
// hecho; que el lead haya hablado último es una conjetura — y así termina casi toda
// conversación exitosa ("gracias", y no hay nada que contestar). Ponerlo al nivel de un
// comprobante en revisión llenaba el contador de urgencias con conversaciones cerradas.
const STATE_SEVERITY: Record<string, AttentionSeverity> = {
  agent_error: 'blocking',
  unknown_service: 'blocking',
  awaiting_human: 'pending',
}

/** Motivos que no son `flags` de la card sino estado propio: la IA derivó con error, o
 *  hay un mensaje del lead sin responder. Se listan como un motivo más para que la fila
 *  explique por qué está en la cola sin que el operador tenga que abrirla. */
export const REASON_AGENT_ERROR = 'agent_error'
export const REASON_UNKNOWN_SERVICE = 'unknown_service'
export const REASON_AWAITING_HUMAN = 'awaiting_human'

export function flagSeverity(code: string): AttentionSeverity {
  return STATE_SEVERITY[code] ?? FLAG_SEVERITY[code] ?? 'blocking'
}

export interface AttentionItem {
  card: Card
  pipelineName: string
  stageName: string
  /** Códigos que pusieron la card en la cola: `flags` + los motivos de estado. */
  reasons: string[]
  severity: AttentionSeverity
}

/** Motivos de una card, ya sin los avisos que tienen cola propia. */
function reasonsOf(card: Card): string[] {
  const reasons = card.flags.filter((code) => !EXCLUDED_FLAGS.includes(code))
  // `alert` (agent_error / unknown_service) y `awaiting_human` viven fuera de `flags`
  // pero son trabajo humano igual: la conversación se cortó y nadie contestó.
  if (card.alert === REASON_AGENT_ERROR || card.alert === REASON_UNKNOWN_SERVICE) {
    reasons.push(card.alert)
  }
  if (card.awaiting_human) reasons.push(REASON_AWAITING_HUMAN)
  return reasons
}

/** `blocking` si cualquiera de sus motivos lo es: la card se ordena por lo más urgente
 *  que tenga encima, no por el promedio. */
function severityOf(reasons: string[]): AttentionSeverity {
  return reasons.some((r) => flagSeverity(r) === 'blocking') ? 'blocking' : 'pending'
}

/** Cuándo pasó algo por última vez en esta oportunidad. Sin actividad en el hilo cae al
 *  alta de la card: es lo último que pasó igual. */
export function waitingSince(card: Card): string {
  return card.last_activity_at ?? card.created_at
}

const SEVERITY_RANK: Record<AttentionSeverity, number> = { blocking: 0, pending: 1 }

/** Las oportunidades que esperan a una persona, de los dos pipelines, en un solo orden:
 *  primero lo bloqueante, y dentro de cada grupo lo más viejo — el que lleva más tiempo
 *  esperando se atiende antes. */
export function collectAttention(board: Boards | undefined): AttentionItem[] {
  const items: AttentionItem[] = []
  for (const pipeline of board?.pipelines ?? []) {
    for (const stage of pipeline.stages) {
      for (const card of stage.cards) {
        const reasons = reasonsOf(card)
        if (reasons.length === 0) continue
        items.push({
          card,
          pipelineName: pipeline.name,
          stageName: stage.name,
          reasons,
          severity: severityOf(reasons),
        })
      }
    }
  }
  return items.sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    if (bySeverity !== 0) return bySeverity
    // Dentro de cada grupo, lo que lleva más tiempo sin moverse va primero.
    return new Date(waitingSince(a.card)).getTime() - new Date(waitingSince(b.card)).getTime()
  })
}

export function countBlocking(items: AttentionItem[]): number {
  return items.filter((item) => item.severity === 'blocking').length
}

/** Cuántas cards de un pipeline están en la cola: alimenta el contador del tab del
 *  tablero, para que la señal también se vea donde se trabaja. */
export function attentionInPipeline(pipeline: Pipeline): number {
  return pipeline.stages.reduce(
    (n, stage) => n + stage.cards.filter((card) => reasonsOf(card).length > 0).length,
    0,
  )
}
