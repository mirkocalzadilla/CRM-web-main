'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { usePermissions } from '@/hooks/use-permissions'
import { CatalogScreen } from '@/components/crm/catalog/catalog-screen'

export default function CatalogoPage() {
  const router = useRouter()
  const { canManageCatalog } = usePermissions()

  useEffect(() => {
    if (!canManageCatalog) {
      router.replace('/')
    }
  }, [canManageCatalog, router])

  if (!canManageCatalog) return null

  return <CatalogScreen />
}
