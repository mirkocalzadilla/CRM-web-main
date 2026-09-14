import { isAxiosError } from 'axios'

interface FastApiError {
  detail?: string | { msg?: string }[]
}

/** Mensaje legible de un 4xx de FastAPI (string o lista de errores de validación). */
export function apiErrorMessage(error: unknown): string | null {
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

/** True si el backend contestó 403. Sirve para no reintentar ni mostrar "reintentá" en
 *  una pantalla que el rol simplemente no puede ver. */
export function isForbidden(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403
}
