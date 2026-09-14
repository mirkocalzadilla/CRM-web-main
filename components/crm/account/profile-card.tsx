'use client'

import { Building2, Mail } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PLATFORM_OPERATOR_META, ROLE_META } from '@/components/crm/config/role-meta'
import { useAuth } from '@/hooks/use-auth'

/** Ficha de la cuenta activa en Ajustes (#139): quién sos, en qué organización y con
 *  qué rol — solo lectura (el rol lo gestiona el operador en /users). */
export function ProfileCard() {
  const { session, isLoading } = useAuth()

  if (!session) {
    return isLoading ? <Skeleton className="h-32 w-full max-w-md bg-white/[0.04]" /> : null
  }

  const { user, tenant } = session
  const meta = session.is_platform_operator
    ? PLATFORM_OPERATOR_META
    : ROLE_META[session.role]
  const initial = (user.full_name ?? user.email).charAt(0).toUpperCase()

  return (
    <div className="max-w-md space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {user.full_name ?? 'Sin nombre'}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Mail className="size-3 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/5 pt-4 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <Building2 className="size-3" /> Organización
          </span>
          <span className="truncate text-zinc-300">{tenant.name}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-500">Rol</span>
          <Badge className={cn('font-medium', meta.badgeClassName)}>{meta.label}</Badge>
        </div>
        <p className="pt-1 text-zinc-600">{meta.description}</p>
      </div>
    </div>
  )
}
