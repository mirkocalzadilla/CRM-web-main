import { z } from 'zod'

import { apiClient } from '@/lib/api/client'

// ---------- Schemas (espejo del backend `core/domain/schemas.py`) ----------

export const loginRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password requerido'),
})

export const registerRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
  full_name: z.string().max(255).optional(),
  tenant_name: z.string().min(2, 'Mínimo 2 caracteres').max(255),
  tenant_slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug inválido (a-z, 0-9, guiones)'),
})

export const changePasswordRequestSchema = z.object({
  current_password: z.string().min(1, 'Contraseña actual requerida'),
  new_password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
})

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
})

export const tenantUserRoleSchema = z.enum(['client_admin', 'staff'])

export const userReadSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const tenantReadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const authenticatedUserSchema = z.object({
  user: userReadSchema,
  tenant: tenantReadSchema,
  role: tenantUserRoleSchema,
  is_platform_operator: z.boolean().default(false),
})

// ---------- Tipos derivados ----------

export type LoginPayload = z.infer<typeof loginRequestSchema>
export type RegisterPayload = z.infer<typeof registerRequestSchema>
export type ChangePasswordPayload = z.infer<typeof changePasswordRequestSchema>
export type TokenResponse = z.infer<typeof tokenResponseSchema>
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>
export type UserRead = z.infer<typeof userReadSchema>
export type TenantRead = z.infer<typeof tenantReadSchema>
export type TenantUserRole = z.infer<typeof tenantUserRoleSchema>

// ---------- Llamadas tipadas ----------

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post('/auth/login', payload)
  return tokenResponseSchema.parse(data)
}

export async function register(payload: RegisterPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post('/auth/register', payload)
  return tokenResponseSchema.parse(data)
}

export async function me(): Promise<AuthenticatedUser> {
  const { data } = await apiClient.get('/auth/me')
  return authenticatedUserSchema.parse(data)
}

/** Cambia la contraseña del usuario autenticado. 204 sin body; el server resuelve el user del JWT. */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post('/auth/change-password', payload)
}
