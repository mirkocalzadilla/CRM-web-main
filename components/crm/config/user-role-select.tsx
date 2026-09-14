'use client'

import { toast } from 'sonner'

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_META } from '@/components/crm/config/role-meta'
import { RoleSelectItems } from '@/components/crm/config/role-select-items'
import { useChangeUserRole } from '@/hooks/use-users'
import type { TenantUserRole } from '@/lib/api/auth'

interface UserRoleSelectProps {
  userId: string
  role: TenantUserRole
  userLabel: string
}

/** Cambio de rol in-place (client_admin ↔ staff) sobre PUT /users/{id}/role (#138).
 *  Solo filas sin `is_superuser`: el operador de plataforma no se gestiona acá (#151).
 *  El hook aplica update optimista y hace rollback + toast ante error. */
export function UserRoleSelect({ userId, role, userLabel }: UserRoleSelectProps) {
  const change = useChangeUserRole()

  function handleChange(next: string) {
    const nextRole = next as TenantUserRole
    if (nextRole === role || change.isPending) return
    change.mutate(
      { userId, role: nextRole },
      {
        onSuccess: (user) =>
          toast.success(`${userLabel} ahora es ${ROLE_META[user.role].label}`),
      },
    )
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={change.isPending}>
      <SelectTrigger
        size="sm"
        aria-label={`Rol de ${userLabel}`}
        className="h-7 w-36 rounded-full border-white/10 bg-white/[0.03] px-2.5 text-xs text-zinc-200"
      >
        {/* Children fijos: sin esto el trigger renderizaría también la descripción del item. */}
        <SelectValue>{ROLE_META[role].label}</SelectValue>
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-zinc-950 text-white">
        <RoleSelectItems />
      </SelectContent>
    </Select>
  )
}
