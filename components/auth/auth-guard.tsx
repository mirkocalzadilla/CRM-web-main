'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/hooks/use-auth'

interface AuthGuardProps {
  children: ReactNode
  /** Ruta a la que redirigir si no hay sesión válida. */
  redirectTo?: string
}

/**
 * Bloquea el render de rutas privadas hasta confirmar la sesión.
 *
 * - Si todavía no hidrató el store, muestra placeholder (sin redirect).
 * - Si no hay token tras hidratar, redirige a `redirectTo`.
 * - Si hay token pero `/auth/me` falla con 401, el interceptor Axios
 *   limpia el store y redirige; este componente reacciona al cambio.
 */
export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const router = useRouter()
  const { token, isAuthenticated, isLoading, hasHydrated } = useAuth()

  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace(redirectTo)
    }
  }, [hasHydrated, token, redirectTo, router])

  if (!hasHydrated || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
