import { z } from 'zod'

import { apiClient } from '@/lib/api/client'

// ---------- Enums de negocio (espejo de service_link_schemas.py) ----------

export const serviceLinkKinds = ['whatsapp_group', 'meeting', 'maps', 'other'] as const

export const serviceLinkKindSchema = z.enum(serviceLinkKinds)

/** Tope por servicio (espejo de MAX_LINKS_PER_SERVICE del backend). */
export const MAX_LINKS_PER_SERVICE = 5
export const LINK_LABEL_MAX = 60
export const LINK_URL_MAX = 500

// ---------- Schemas ----------

export const serviceLinkReadSchema = z.object({
  id: z.string(),
  service_id: z.string(),
  kind: z.string(),
  url: z.string(),
  label: z.string().nullable(),
  orden: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

// ---------- Tipos derivados ----------

export type ServiceLinkRead = z.infer<typeof serviceLinkReadSchema>
export type ServiceLinkKind = (typeof serviceLinkKinds)[number]

export interface ServiceLinkCreate {
  kind: ServiceLinkKind
  url: string
  label?: string | null
  orden?: number
}

export interface ServiceLinkUpdate {
  kind?: ServiceLinkKind
  url?: string
  label?: string | null
  orden?: number
}

// ---------- Llamadas tipadas ----------

export async function listServiceLinks(serviceId: string): Promise<ServiceLinkRead[]> {
  const { data } = await apiClient.get(`/services/${serviceId}/links`)
  return z.array(serviceLinkReadSchema).parse(data)
}

export async function createServiceLink(
  serviceId: string,
  body: ServiceLinkCreate,
): Promise<ServiceLinkRead> {
  const { data } = await apiClient.post(`/services/${serviceId}/links`, body)
  return serviceLinkReadSchema.parse(data)
}

export async function updateServiceLink(
  linkId: string,
  body: ServiceLinkUpdate,
): Promise<ServiceLinkRead> {
  const { data } = await apiClient.put(`/service-links/${linkId}`, body)
  return serviceLinkReadSchema.parse(data)
}

export async function deleteServiceLink(linkId: string): Promise<void> {
  await apiClient.delete(`/service-links/${linkId}`)
}
