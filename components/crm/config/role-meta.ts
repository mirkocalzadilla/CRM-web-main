import type { TenantUserRole } from '@/lib/api/auth'

// Etiquetas canónicas del RBAC de 3 niveles (FRONTEND_SPEC §RBAC, server SPECS_MVP §RBAC).
// Una sola fuente para tabla de usuarios y diálogo de alta (#138).

export interface RoleMeta {
  label: string
  /** Qué puede hacer — copy del tooltip/ayuda. */
  description: string
  badgeClassName: string
}

export const ROLE_META: Record<TenantUserRole, RoleMeta> = {
  client_admin: {
    label: 'Admin',
    description: 'Opera el CRM y el catálogo de su organización. Sin config del agente ni usuarios.',
    badgeClassName: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  },
  staff: {
    label: 'Staff',
    description: 'Opera el inbox y el pipeline (takeover incluido). Sin configuración.',
    badgeClassName: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
  },
}

/** Dimensión global `is_superuser` (no es rol de tenant): Natalia + equipo. */
export const PLATFORM_OPERATOR_META: RoleMeta = {
  label: 'Operador de plataforma',
  description:
    'Acceso total: config del agente, usuarios y roles, catálogo y CRM. El rol por tenant no le aplica.',
  badgeClassName: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
}

/** Roles asignables desde la UI (el flag de operador se gestiona fuera de este ABM). */
export const ASSIGNABLE_ROLES: TenantUserRole[] = ['client_admin', 'staff']
