import { z } from 'zod'

import { apiClient } from '@/lib/api/client'

// ---------- Schemas (espejo del contrato backend M-CRM-api slice 2) ----------
// Los ids llegan como strings opacos; el contrato (SPEC_CRM_FRONT §3) no fija
// formato, así que no asumimos uuid para no romper el parse.

// 'system' = evento de error del agente (server#288): no es una burbuja de chat.
export const threadSenderSchema = z.enum(['lead', 'agent', 'human', 'system'])

// type: 'text' | 'image' | 'document' | 'error' — plain string so unknown types
// degrade to the text fallback instead of failing the parse.
export const threadMessageSchema = z.object({
  sender: threadSenderSchema,
  text: z.string(),
  at: z.string(),
  type: z.string().default('text'),
  media_url: z.string().nullable().optional(),
  // Código de la falla del agente cuando type='error' (server#288): 'auth' | 'rate_limit' |
  // 'bad_request' | 'provider' | 'network' | 'internal' | 'delivery'. El copy vive en el front.
  category: z.string().nullable().optional(),
})

export const cardSchema = z.object({
  id: z.string(),
  title: z.string(),
  conversation_id: z.string(),
  stage_id: z.string(),
  phone: z.string(), // external_id (wa_id) de la conversación; habilita búsqueda por número
  rating: z.string(), // 'hot' | 'medium' | 'cold' — calificación del lead (badge)
  // Etiqueta de alerta derivada del motivo de handoff (#94): 'unknown_service' cuando
  // el lead pidió un servicio fuera del catálogo; 'agent_error' cuando el agente no pudo
  // responder y derivó (server#288); null/ausente si no hay alerta.
  alert: z.string().nullable().optional(),
  // Takeover: la IA responde por vos (true) o está apagada y atendés vos (false).
  is_ai_active: z.boolean().default(true),
  // IA apagada + último mensaje del lead sin respuesta humana/agente posterior: hay
  // alguien esperando y nadie contestó. Enciende el badge "Responder" en la card.
  awaiting_human: z.boolean().default(false),
  // Avisos operativos de la entrega automática (server#270): por qué algo no se
  // completó solo (falta el nombre, ventana de 24 h cerrada, comprobante extra…). Son
  // códigos y el copy vive en `components/crm/flag-badges.tsx`. `z.string()` a
  // propósito: un código de una versión más nueva del backend no debe romper el parse.
  flags: z.array(z.string()).default([]),
  // Lo último que pasó en la conversación (mensaje del lead o respuesta). `null` si no
  // hubo ninguno (alta manual de oportunidad). Ordena la cola de atención por cuánto
  // lleva esperando — no por cuándo se creó la card, que no es lo mismo.
  last_activity_at: z.string().nullable().optional(),
  // Cuándo una persona la marcó como atendida (server 0036); `null` si nadie lo hizo.
  attended_at: z.string().nullable().optional(),
  created_at: z.string(),
})

// Un paso del historial de movimientos de la card (traceability del detalle #75/#55).
// stage_from_* es null en el alta de la card (primer move sin origen).
export const cardMoveSchema = z.object({
  stage_from_name: z.string().nullable(),
  stage_from_color: z.string().nullable(),
  stage_to_name: z.string(),
  stage_to_color: z.string().nullable(),
  moved_by: z.string(), // 'agent' | 'system' | user_id
  // Motivo del move manual (#253/server#253); null en filas viejas y syncs del bot.
  reason: z.string().nullable(),
  moved_at: z.string(),
})

// Contacto vinculado a la card vía la FK `card.contact_id` (server #139); null si el
// número todavía no es contacto.
export const cardContactSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
})

// Servicio del catálogo asignado a la oportunidad (server #132). `source`:
// 'assigned' = el operador lo asignó a mano; 'captured' = lo eligió el bot (#133).
export const cardServiceSchema = z.object({
  id: z.string(), // id del card_service (para quitarlo)
  service_id: z.string(),
  nombre: z.string(),
  precio: z.string(),
  moneda: z.string(),
  source: z.string(),
})

export const cardDetailSchema = cardSchema.extend({
  is_ai_active: z.boolean(),
  full_name: z.string().nullable(), // nombre del lead (prefill de edición)
  notes: z.string().nullable(), // notas libres de la oportunidad
  ai_summary: z.string().nullable(), // resumen del caso por IA
  thread: z.array(threadMessageSchema),
  moves: z.array(cardMoveSchema), // historial cronológico (asc por moved_at)
  contact: cardContactSchema.nullable(), // contacto vinculado (FK) o null
  services: z.array(cardServiceSchema), // servicios asignados/capturados (#132)
})

export const qrEntrySchema = z.object({
  card_id: z.string(),
  token: z.string(),
  qr_ref: z.string(),
})

export const stageSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number(),
  status_code: z.string(),
  cards: z.array(cardSchema),
})

export const pipelineSchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string(),
  position: z.number(),
  stages: z.array(stageSchema),
})

export const boardsSchema = z.object({
  pipelines: z.array(pipelineSchema),
})

export const aiActiveSchema = z.object({
  is_ai_active: z.boolean(),
})

// ---------- Tipos derivados ----------

export type ThreadSender = z.infer<typeof threadSenderSchema>
export type ThreadMessage = z.infer<typeof threadMessageSchema>
export type Card = z.infer<typeof cardSchema>
export type CardContact = z.infer<typeof cardContactSchema>
export type CardMove = z.infer<typeof cardMoveSchema>
export type CardService = z.infer<typeof cardServiceSchema>
export type CardDetail = z.infer<typeof cardDetailSchema>
export type Stage = z.infer<typeof stageSchema>
export type Pipeline = z.infer<typeof pipelineSchema>
export type Boards = z.infer<typeof boardsSchema>
export type AiActive = z.infer<typeof aiActiveSchema>
export type QrEntryOut = z.infer<typeof qrEntrySchema>

// ---------- Llamadas tipadas ----------

export async function getBoards(): Promise<Boards> {
  const { data } = await apiClient.get('/crm/boards')
  return boardsSchema.parse(data)
}

export async function getCard(cardId: string): Promise<CardDetail> {
  const { data } = await apiClient.get(`/crm/cards/${cardId}`)
  return cardDetailSchema.parse(data)
}

// Asigna manualmente el set de servicios a la oportunidad (#132). Devuelve la lista
// resultante (incluye los capturados por el bot).
export async function updateCardServices(
  cardId: string,
  serviceIds: string[],
): Promise<CardService[]> {
  const { data } = await apiClient.put(`/crm/cards/${cardId}/services`, {
    service_ids: serviceIds,
  })
  return z.array(cardServiceSchema).parse(data)
}

/** Mueve la card a `stageId`. `reason` (opcional, ≤2000) queda en el audit del move
 *  (#253); la UI lo exige solo al descalificar. Se omite del body si no viene. */
export async function moveCard(
  cardId: string,
  stageId: string,
  reason?: string,
): Promise<Card> {
  const { data } = await apiClient.post(`/crm/cards/${cardId}/move`, {
    stage_id: stageId,
    reason,
  })
  return cardSchema.parse(data)
}

export interface CardCreateInput {
  phone: string
  full_name?: string | null
  notes?: string | null
}

export interface CardUpdateInput {
  full_name?: string | null
  notes?: string | null
}

/** Alta manual de oportunidad (#54): crea conversación + card en el primer stage. */
export async function createCard(input: CardCreateInput): Promise<Card> {
  const { data } = await apiClient.post('/crm/cards', input)
  return cardSchema.parse(data)
}

/** Edita nombre y/o notas de la oportunidad. */
export async function updateCard(cardId: string, input: CardUpdateInput): Promise<Card> {
  const { data } = await apiClient.patch(`/crm/cards/${cardId}`, input)
  return cardSchema.parse(data)
}

/** Baja de oportunidad (borrado duro en el backend). */
export async function deleteCard(cardId: string): Promise<void> {
  await apiClient.delete(`/crm/cards/${cardId}`)
}

export async function generateEntry(cardId: string): Promise<QrEntryOut> {
  const { data } = await apiClient.post(`/crm/cards/${cardId}/generate-entry`)
  return qrEntrySchema.parse(data)
}

export async function setAiActive(
  conversationId: string,
  isAiActive: boolean,
): Promise<AiActive> {
  const { data } = await apiClient.put(
    `/crm/conversations/${conversationId}/ai-active`,
    { is_ai_active: isAiActive },
  )
  return aiActiveSchema.parse(data)
}

export async function sendHumanReply(
  cardId: string,
  text: string,
): Promise<ThreadMessage> {
  const { data } = await apiClient.post(`/crm/cards/${cardId}/send`, { text })
  return threadMessageSchema.parse(data)
}

/** Adjunto del takeover (#169): JPG/PNG/PDF ≤5 MB con caption opcional. */
export async function sendHumanMedia(
  cardId: string,
  file: File,
  caption: string,
): Promise<ThreadMessage> {
  const form = new FormData()
  form.append('file', file)
  if (caption) form.append('caption', caption)
  // Override del 'application/json' por defecto del cliente: con FormData, Axios
  // reemplaza este header por multipart/form-data con el boundary correcto.
  const { data } = await apiClient.post(`/crm/cards/${cardId}/send-media`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return threadMessageSchema.parse(data)
}

/** Marca la oportunidad como atendida: sale de la cola de "Requiere atención" hasta
 *  que el lead vuelva a escribir. No la cierra ni limpia sus avisos de entrega. */
export async function markCardAttended(cardId: string): Promise<void> {
  await apiClient.post(`/crm/cards/${cardId}/attended`)
}

/** Envía el QR de pago configurado en el sistema (misma imagen que usa el agente). */
export async function sendPaymentQr(cardId: string): Promise<ThreadMessage> {
  const { data } = await apiClient.post(`/crm/cards/${cardId}/send-qr`)
  return threadMessageSchema.parse(data)
}
