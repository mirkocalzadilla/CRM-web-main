'use client'

import { useAuth } from '@/hooks/use-auth'

interface Capabilities {
  /** Ver el tablero/inbox CRM. */
  canViewCrm: boolean
  /** Operar el CRM: mover cards, toggle IA, responder. */
  canOperateCrm: boolean
  /** Config de plataforma (pantalla agents, settings). Solo platform_operator. */
  canManageConfig: boolean
  /** Gestionar usuarios/roles del tenant (pantalla users). client_admin + platform_operator (#126). */
  canManageUsers: boolean
  /** Administrar el catálogo (servicios/materiales). client_admin + platform_operator. */
  canManageCatalog: boolean
  /** Exportar la base de leads (CSV, #113). client_admin + platform_operator. */
  canExportContacts: boolean
  /** Config de pagos de la organización (#178). client_admin + platform_operator. */
  canManagePayments: boolean
}

/** Mapea la sesión a capacidades; default sin permisos si no hay sesión. */
export function usePermissions(): Capabilities {
  const { session } = useAuth()
  const isPlatformOperator = session?.is_platform_operator ?? false
  return {
    canViewCrm: session !== null,
    canOperateCrm: session !== null,
    canManageConfig: isPlatformOperator,
    canManageUsers: isPlatformOperator || session?.role === 'client_admin',
    canManageCatalog: isPlatformOperator || session?.role === 'client_admin',
    canExportContacts: isPlatformOperator || session?.role === 'client_admin',
    canManagePayments: isPlatformOperator || session?.role === 'client_admin',
  }
}
