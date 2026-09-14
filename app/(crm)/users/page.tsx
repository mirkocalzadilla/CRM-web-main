'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { usePermissions } from '@/hooks/use-permissions'
import { UsersTable } from '@/components/crm/config/users-table'

export default function UsersPage() {
  const router = useRouter()
  const { canManageUsers } = usePermissions()

  // platform_operator + client_admin (split #126, server #200). staff se redirige;
  // el backend además devuelve 403 en GET /users.
  useEffect(() => {
    if (!canManageUsers) {
      router.replace('/crm')
    }
  }, [canManageUsers, router])

  if (!canManageUsers) return null

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Usuarios y roles</h1>
        <p className="mt-1 text-sm text-zinc-500">Usuarios y roles de este tenant.</p>
      </div>
      <UsersTable />
    </div>
  )
}
