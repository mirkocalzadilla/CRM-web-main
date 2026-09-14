import { z } from 'zod'

import { apiClient } from '@/lib/api/client'
import { tenantUserRoleSchema, type TenantUserRole } from '@/lib/api/auth'

// ---------- Schemas (espejo del contrato M-Config server, PR #36 + GET /agents) ----------
// `config` es un JSON abierto (temperature, services, faq, emojis, …); lo tratamos
// como record opaco y resolvemos cada clave en la UI.

export const agentVersionReadSchema = z.object({
  id: z.string(),
  version_number: z.number(),
  system_prompt: z.string(),
  model: z.string(),
  config: z.record(z.unknown()),
  change_summary: z.string().nullable(),
  created_at: z.string(),
})

export const agentReadSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  system_prompt: z.string(),
  model: z.string(),
  config: z.record(z.unknown()),
  is_active: z.boolean(),
  current_version: agentVersionReadSchema.nullable(),
})

export const modelPricingReadSchema = z.object({
  input: z.number(),
  cached_input: z.number(),
  output: z.number(),
})

export const modelReadSchema = z.object({
  id: z.string(),
  label: z.string(),
  provider: z.string(),
  reasoning: z.boolean(),
  reasoning_effort: z.string().nullable(),
  pricing: modelPricingReadSchema.nullable(),
  // False cuando el API del modelo no acepta `temperature` (server#288): el form lo anota,
  // el backend la omite solo. Default true para tolerar un backend previo al campo.
  supports_temperature: z.boolean().default(true),
})

export const userWithRoleSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string().nullable(),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  role: tenantUserRoleSchema,
})

// ---------- Tipos derivados ----------

export type AgentVersionRead = z.infer<typeof agentVersionReadSchema>
export type AgentRead = z.infer<typeof agentReadSchema>
export type ModelRead = z.infer<typeof modelReadSchema>
export type UserWithRole = z.infer<typeof userWithRoleSchema>

/** Alta de usuario en el tenant activo (espejo de `UserCreateInTenant`, server). */
export interface UserCreatePayload {
  email: string
  password: string
  full_name?: string
  role: TenantUserRole
}

/** Cambios a aplicar; `config` reemplaza el JSON completo (no merge parcial). */
export interface AgentUpdate {
  display_name?: string
  system_prompt?: string
  model?: string
  config?: Record<string, unknown>
  change_summary?: string
}

// ---------- Llamadas tipadas ----------

export async function listAgents(): Promise<AgentRead[]> {
  const { data } = await apiClient.get('/agents')
  return z.array(agentReadSchema).parse(data)
}

export async function getAgent(id: string): Promise<AgentRead> {
  const { data } = await apiClient.get(`/agents/${id}`)
  return agentReadSchema.parse(data)
}

/** Catálogo de modelos permitidos (pobla el dropdown de modelo, #103/#60). */
export async function listModels(): Promise<ModelRead[]> {
  const { data } = await apiClient.get('/agents/models')
  return z.array(modelReadSchema).parse(data)
}

export async function updateAgent(
  id: string,
  body: AgentUpdate,
): Promise<AgentVersionRead> {
  const { data } = await apiClient.put(`/agents/${id}`, body)
  return agentVersionReadSchema.parse(data)
}

export async function listUsers(): Promise<UserWithRole[]> {
  const { data } = await apiClient.get('/users')
  return z.array(userWithRoleSchema).parse(data)
}

export async function changeUserRole(
  userId: string,
  role: TenantUserRole,
): Promise<UserWithRole> {
  const { data } = await apiClient.put(`/users/${userId}/role`, { role })
  return userWithRoleSchema.parse(data)
}

/** Alta en el tenant activo (platform_operator o client_admin, #126). Email duplicado → 422. */
export async function createUser(payload: UserCreatePayload): Promise<UserWithRole> {
  const { data } = await apiClient.post('/users', payload)
  return userWithRoleSchema.parse(data)
}

/** Baja de usuario. Anti-self-lockout y último-operator los enforcea el backend → 400. */
export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}`)
}
