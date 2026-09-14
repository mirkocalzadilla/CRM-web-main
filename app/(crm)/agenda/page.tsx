'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { AgendaScreen } from '@/components/crm/agenda/agenda-screen'
import { usePermissions } from '@/hooks/use-permissions'

/** El ABM de eventos exige `client_admin` server-side (`event_router.EventManager`);
 *  `canManageCatalog` es la capacidad equivalente en el front. */
export default function AgendaPage() {
  const router = useRouter()
  const { canManageCatalog } = usePermissions()

  useEffect(() => {
    if (!canManageCatalog) {
      router.replace('/')
    }
  }, [canManageCatalog, router])

  if (!canManageCatalog) return null

  // La pantalla lee `?service=` con useSearchParams, que exige un boundary de Suspense.
  return (
    <Suspense fallback={null}>
      <AgendaScreen />
    </Suspense>
  )
}
