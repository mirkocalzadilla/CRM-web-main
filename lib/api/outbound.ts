import { z } from 'zod'

import { apiClient } from '@/lib/api/client'

// M-Outbound: envíos iniciados por el negocio (plantillas de Meta). Espejo de
// server/modules/outbound/api/schemas.py.

export const OUTBOUND_PURPOSES = ['entry', 'event_reminder', 'reactivation', 'manual'] as const
export type OutboundPurpose = (typeof OUTBOUND_PURPOSES)[number]

export const OUTBOUND_STATUSES = ['sent', 'delivered', 'read', 'failed', 'skipped'] as const
export type OutboundStatus = (typeof OUTBOUND_STATUSES)[number]

export const NOVELTY_MAX = 300

export const outboundMessageSchema = z.object({
  id: z.string(),
  conversation_id: z.string().nullable(),
  card_id: z.string().nullable(),
  wa_id: z.string(),
  template_name: z.string(),
  purpose: z.string(),
  rendered_text: z.string(),
  status: z.string(),
  error_code: z.number().nullable(),
  error_detail: z.string().nullable(),
  sent_at: z.string().nullable(),
  status_at: z.string().nullable(),
  created_at: z.string(),
})
export type OutboundMessage = z.infer<typeof outboundMessageSchema>

const pageSchema = z.object({
  items: z.array(outboundMessageSchema),
  limit: z.number(),
  offset: z.number(),
})
export type OutboundMessagePage = z.infer<typeof pageSchema>

export const reactivationRuleSchema = z.object({
  stages: z.array(z.string()),
  days: z.number(),
})
export type ReactivationRule = z.infer<typeof reactivationRuleSchema>

export const outboundSettingsSchema = z.object({
  reactivation_enabled: z.boolean(),
  reactivation_daily_cap: z.number(),
  reactivation_recontact_days: z.number(),
  reactivation_rules: z.array(reactivationRuleSchema),
  novelty_text: z.string(),
  updated_at: z.string(),
})
export type OutboundSettings = z.infer<typeof outboundSettingsSchema>

export interface OutboundSettingsUpdate {
  reactivation_enabled?: boolean
  reactivation_daily_cap?: number
  reactivation_recontact_days?: number
  reactivation_rules?: ReactivationRule[]
  novelty_text?: string
}

export const optOutSchema = z.object({
  wa_id: z.string(),
  source: z.string(),
  created_at: z.string(),
})
export type OptOut = z.infer<typeof optOutSchema>

export const manualSendResultSchema = z.object({
  sent: z.boolean(),
  reason: z.string().nullable(),
})
export type ManualSendResult = z.infer<typeof manualSendResultSchema>

export interface OutboundMessageFilters {
  purpose?: OutboundPurpose | ''
  status?: OutboundStatus | ''
  limit?: number
  offset?: number
}

export async function listOutboundMessages(
  filters: OutboundMessageFilters = {},
): Promise<OutboundMessagePage> {
  const params: Record<string, string | number> = {
    limit: filters.limit ?? 100,
    offset: filters.offset ?? 0,
  }
  if (filters.purpose) params.purpose = filters.purpose
  if (filters.status) params.status = filters.status
  const { data } = await apiClient.get('/outbound/messages', { params })
  return pageSchema.parse(data)
}

export async function listCardOutbound(cardId: string): Promise<OutboundMessage[]> {
  const { data } = await apiClient.get(`/outbound/cards/${cardId}/messages`)
  return z.array(outboundMessageSchema).parse(data)
}

export async function getOutboundSettings(): Promise<OutboundSettings> {
  const { data } = await apiClient.get('/outbound/settings')
  return outboundSettingsSchema.parse(data)
}

export async function updateOutboundSettings(
  body: OutboundSettingsUpdate,
): Promise<OutboundSettings> {
  const { data } = await apiClient.put('/outbound/settings', body)
  return outboundSettingsSchema.parse(data)
}

export async function listOptOuts(): Promise<OptOut[]> {
  const { data } = await apiClient.get('/outbound/opt-outs')
  return z.array(optOutSchema).parse(data)
}

export async function addOptOut(waId: string): Promise<void> {
  await apiClient.post('/outbound/opt-outs', { wa_id: waId })
}

export async function remindCard(cardId: string): Promise<ManualSendResult> {
  const { data } = await apiClient.post(`/outbound/cards/${cardId}/remind`)
  return manualSendResultSchema.parse(data)
}

export async function reactivateCard(cardId: string): Promise<ManualSendResult> {
  const { data } = await apiClient.post(`/outbound/cards/${cardId}/reactivate`)
  return manualSendResultSchema.parse(data)
}

// ---- etiquetas ------------------------------------------------------------------

export const PURPOSE_LABELS: Record<string, string> = {
  entry: 'Entrada',
  event_reminder: 'Recordatorio',
  reactivation: 'Reactivación',
  manual: 'Manual',
}

export const STATUS_LABELS: Record<string, string> = {
  queued: 'En cola',
  sent: 'Enviado',
  delivered: 'Entregado',
  read: 'Leído',
  failed: 'Falló',
  skipped: 'Omitido',
}

export const MANUAL_REASON_LABELS: Record<string, string> = {
  sin_novedad: 'Primero cargá la novedad del mes en Ajustes → Seguimientos.',
  sin_entrada_vigente: 'Esta oportunidad no tiene una entrada vigente para recordar.',
  evento_pasado: 'El evento de la entrada ya pasó.',
  meta_rechazo_o_baja: 'No salió: el número pidió la baja o Meta rechazó el envío.',
}
