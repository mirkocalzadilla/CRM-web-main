'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { me, type AuthenticatedUser } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth-store'

interface UseAuthResult {
  token: string | null
  session: AuthenticatedUser | null
  isLoading: boolean
  isAuthenticated: boolean
  hasHydrated: boolean
  signOut: () => void
}

/**
 * Lee el store y, si hay token, hidrata user/tenant/role llamando a `/auth/me`.
 * Mantiene la respuesta de `/auth/me` en sync con el store.
 */
export function useAuth(): UseAuthResult {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const role = useAuthStore((s) => s.role)
  const is_platform_operator = useAuthStore((s) => s.is_platform_operator)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clear)

  const enabled = hasHydrated && Boolean(token)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: me,
    enabled,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (data) {
      setSession(data)
    }
  }, [data, setSession])

  useEffect(() => {
    // El interceptor 401 ya limpia el store; este efecto cubre otros errores
    // de hidratación (network, 5xx) reintenta-ables sin perder sesión válida.
    if (isError && !token) {
      clear()
    }
  }, [isError, token, clear])

  const session: AuthenticatedUser | null =
    user && tenant && role ? { user, tenant, role, is_platform_operator } : null

  return {
    token,
    session,
    isLoading: enabled && isLoading && session === null,
    isAuthenticated: Boolean(token) && session !== null,
    hasHydrated,
    signOut: clear,
  }
}
