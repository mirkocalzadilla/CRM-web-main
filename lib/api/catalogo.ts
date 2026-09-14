import { z } from 'zod'

import { apiClient } from '@/lib/api/client'

// ---------- Enums de negocio (espejo de catalog_schemas.py) ----------

export const serviceCurrencies = ['BOB', 'USD'] as const
export const serviceClosings = ['pago_qr', 'handoff_consultivo'] as const
// Modalidad de entrega post-pago (#178). Ausente/null = el servicio no entrega nada.
// `hibrido` es presencial y virtual a la vez: entrada QR + links, en un solo mensaje.
export const serviceModalities = ['presencial', 'virtual', 'hibrido'] as const

export const currencySchema = z.enum(serviceCurrencies)
export const closingSchema = z.enum(serviceClosings)
export const modalitySchema = z.enum(serviceModalities)

// ---------- Schemas (espejo del contrato server) ----------

export const assetReadSchema = z.object({
  id: z.string(),
  kind: z.enum(['pdf', 'image']),
  filename: z.string(),
  public_url: z.string(),
  bytes: z.number(),
  created_at: z.string(),
})

export const serviceCategoryReadSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  nombre: z.string(),
  slug: z.string(),
  orden: z.number(),
  materials: z.array(assetReadSchema),
  created_at: z.string(),
  updated_at: z.string(),
})

// El backend serializa `price_amount` (Decimal) como string ("650.00"); se acepta
// number por tolerancia y se normaliza a string para comparar/mostrar siempre igual.
const priceAmountSchema = z
  .union([z.string(), z.number()])
  .nullable()
  .transform((value) => (value === null ? null : String(value)))

export const serviceReadSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  agent_id: z.string(),
  slug: z.string(),
  nombre: z.string(),
  category_id: z.string().nullable(),
  category: serviceCategoryReadSchema.nullable(),
  resumen: z.string(),
  detalle: z.string().nullable(),
  precio: z.string(),
  moneda: z.string(),
  flujo_cierre: z.string(),
  orden: z.number(),
  is_active: z.boolean(),
  // Un valor desconocido degrada a "sin entrega" en vez de romper el catálogo.
  modality: modalitySchema.nullable().catch(null),
  price_amount: priceAmountSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

// ---------- Tipos derivados ----------

export type AssetRead = z.infer<typeof assetReadSchema>
export type ServiceCategoryRead = z.infer<typeof serviceCategoryReadSchema>
export type ServiceRead = z.infer<typeof serviceReadSchema>
export type ServiceCurrency = (typeof serviceCurrencies)[number]
export type ServiceClosing = (typeof serviceClosings)[number]
export type ServiceModality = (typeof serviceModalities)[number]

export interface ServiceCreate {
  slug: string
  nombre: string
  category_id?: string | null
  resumen: string
  detalle?: string | null
  precio: string
  moneda: ServiceCurrency
  flujo_cierre?: ServiceClosing
  orden?: number
  modality?: ServiceModality | null
  price_amount?: string | null
}

// PUT parcial: omitir un campo lo deja intacto, mandar `null` explícito lo borra.
export interface ServiceUpdate {
  nombre?: string
  category_id?: string | null
  resumen?: string
  detalle?: string | null
  precio?: string
  moneda?: ServiceCurrency
  flujo_cierre?: ServiceClosing
  orden?: number
  is_active?: boolean
  modality?: ServiceModality | null
  price_amount?: string | null
}

export interface ServiceCategoryCreate {
  nombre: string
  orden?: number
  asset_ids?: string[]
}

export interface ServiceCategoryUpdate {
  nombre?: string
  orden?: number
  asset_ids?: string[]
}

// ---------- Llamadas tipadas: servicios ----------

// El catálogo es del tenant: el backend resuelve el agente por detrás (/catalog/*).
export async function listServices(): Promise<ServiceRead[]> {
  const { data } = await apiClient.get('/catalog/services')
  return z.array(serviceReadSchema).parse(data)
}

export async function createService(body: ServiceCreate): Promise<ServiceRead> {
  const { data } = await apiClient.post('/catalog/services', body)
  return serviceReadSchema.parse(data)
}

export async function updateService(serviceId: string, body: ServiceUpdate): Promise<ServiceRead> {
  const { data } = await apiClient.put(`/services/${serviceId}`, body)
  return serviceReadSchema.parse(data)
}

export async function deleteService(serviceId: string): Promise<void> {
  await apiClient.delete(`/services/${serviceId}`)
}

export async function uploadAsset(file: File): Promise<AssetRead> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post('/assets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return assetReadSchema.parse(data)
}

export async function deleteAsset(assetId: string): Promise<void> {
  await apiClient.delete(`/assets/${assetId}`)
}

// ---------- Llamadas tipadas: categorías (#106, org-scoped) ----------

export async function listServiceCategories(): Promise<ServiceCategoryRead[]> {
  const { data } = await apiClient.get('/service-categories')
  return z.array(serviceCategoryReadSchema).parse(data)
}

export async function createServiceCategory(
  body: ServiceCategoryCreate,
): Promise<ServiceCategoryRead> {
  const { data } = await apiClient.post('/service-categories', body)
  return serviceCategoryReadSchema.parse(data)
}

export async function updateServiceCategory(
  categoryId: string,
  body: ServiceCategoryUpdate,
): Promise<ServiceCategoryRead> {
  const { data } = await apiClient.put(`/service-categories/${categoryId}`, body)
  return serviceCategoryReadSchema.parse(data)
}

export async function deleteServiceCategory(categoryId: string): Promise<void> {
  await apiClient.delete(`/service-categories/${categoryId}`)
}
