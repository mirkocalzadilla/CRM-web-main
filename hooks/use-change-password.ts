'use client'

import { isAxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'

import { changePassword, type ChangePasswordPayload } from '@/lib/api/auth'

interface FastApiError {
  detail?: string | { msg?: string }[]
}

/** Mensaje legible de un 4xx de FastAPI (string o lista de errores de validación). */
function apiErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  const detail = (error.response?.data as FastApiError | undefined)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) => item.msg)
      .filter((msg): msg is string => Boolean(msg))
      .join('; ')
    return joined || null
  }
  return null
}

/** Clasifica el error según el contrato: 400 → campo "contraseña actual"; 422 → validación. */
export type ChangePasswordError =
  | { kind: 'current_password'; message: string }
  | { kind: 'validation'; message: string }
  | { kind: 'unknown'; message: string }

export function classifyChangePasswordError(error: unknown): ChangePasswordError {
  const status = isAxiosError(error) ? error.response?.status : undefined
  const message = apiErrorMessage(error)
  if (status === 400) {
    return { kind: 'current_password', message: message ?? 'Contraseña actual incorrecta.' }
  }
  if (status === 422) {
    return { kind: 'validation', message: message ?? 'La nueva contraseña no es válida.' }
  }
  return { kind: 'unknown', message: message ?? 'No se pudo cambiar la contraseña.' }
}

/** POST /auth/change-password. 204 → éxito; el form maneja success/error con contexto del form. */
export function useChangePassword() {
  return useMutation<void, unknown, ChangePasswordPayload>({
    mutationFn: changePassword,
  })
}
