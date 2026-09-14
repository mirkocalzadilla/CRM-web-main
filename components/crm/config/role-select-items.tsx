'use client'

import { SelectItem } from '@/components/ui/select'
import { ASSIGNABLE_ROLES, ROLE_META } from '@/components/crm/config/role-meta'

/** Items del dropdown de rol (label + qué puede hacer), compartidos entre el alta
 *  de usuario y el cambio de rol in-place (#138). */
export function RoleSelectItems() {
  return (
    <>
      {ASSIGNABLE_ROLES.map((value) => (
        <SelectItem key={value} value={value} className="text-sm">
          <span className="flex flex-col items-start gap-0.5">
            <span>{ROLE_META[value].label}</span>
            <span className="text-xs text-zinc-500">{ROLE_META[value].description}</span>
          </span>
        </SelectItem>
      ))}
    </>
  )
}
