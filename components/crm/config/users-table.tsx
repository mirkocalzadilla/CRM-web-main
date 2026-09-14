'use client'

import { UsersRound } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  PLATFORM_OPERATOR_META,
  ROLE_META,
  type RoleMeta,
} from '@/components/crm/config/role-meta'
import { UserCreateDialog } from '@/components/crm/config/user-create-dialog'
import { UserDeleteDialog } from '@/components/crm/config/user-delete-dialog'
import { UserRoleSelect } from '@/components/crm/config/user-role-select'
import { useAuth } from '@/hooks/use-auth'
import { useUsers } from '@/hooks/use-users'
import type { UserWithRole } from '@/lib/api/agent-config'

export function UsersTable() {
  const { data: users, isLoading, isError } = useUsers()
  const { session } = useAuth()
  const currentUserId = session?.user.id
  const viewerIsOperator = session?.is_platform_operator ?? false

  // ABM completo (#103 + #138) abierto a client_admin (#126, server #200): alta/baja +
  // cambio de rol in-place (client_admin ↔ staff). La fila del operador (is_superuser) no
  // expone selector — su rol es global — y un client_admin tampoco ve acciones sobre ella
  // (matriz RBAC de SPECS_MVP). La fila propia no permite cambiarse el rol (anti-bloqueo).
  // El ancho lo fija la página (max-w-3xl centrado, #140).
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <UserCreateDialog />
      </div>

      {isLoading ? (
        <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full bg-white/[0.04]" />
          ))}
        </div>
      ) : isError || !users ? (
        <Empty className="border border-dashed border-white/10">
          <EmptyHeader>
            <EmptyTitle className="text-white">No se pudieron cargar los usuarios</EmptyTitle>
            <EmptyDescription className="text-zinc-500">
              Reintentá en unos segundos.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : users.length === 0 ? (
        <Empty className="border border-dashed border-white/10">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-white/5 text-zinc-400">
              <UsersRound />
            </EmptyMedia>
            <EmptyTitle className="text-white">Sin usuarios en este tenant</EmptyTitle>
            <EmptyDescription className="text-zinc-500">
              Creá el primero con “Nuevo usuario”.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-xl border border-white/5 bg-white/[0.02]">
          <Table className="min-w-120">
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Nombre</TableHead>
                <TableHead className="text-zinc-400">Rol</TableHead>
                <TableHead className="w-16 text-right text-zinc-400">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === currentUserId}
                  viewerIsOperator={viewerIsOperator}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

interface UserRowProps {
  user: UserWithRole
  isSelf: boolean
  viewerIsOperator: boolean
}

function UserRow({ user, isSelf, viewerIsOperator }: UserRowProps) {
  return (
    <TableRow className="border-white/5 hover:bg-white/[0.02]">
      <TableCell className="text-sm text-white">{user.email}</TableCell>
      <TableCell className="text-sm text-zinc-400">{user.full_name ?? '—'}</TableCell>
      <TableCell>
        {user.is_superuser ? (
          <RoleBadge meta={PLATFORM_OPERATOR_META} />
        ) : isSelf ? (
          <RoleBadge
            meta={ROLE_META[user.role]}
            tooltip="No podés cambiar tu propio rol (anti-bloqueo)"
          />
        ) : (
          <UserRoleSelect
            userId={user.id}
            role={user.role}
            userLabel={user.full_name ?? user.email}
          />
        )}
      </TableCell>
      <TableCell className="text-right">
        {user.is_superuser && !viewerIsOperator ? null : (
          <UserDeleteDialog
            userId={user.id}
            userLabel={user.full_name ?? user.email}
            isSelf={isSelf}
          />
        )}
      </TableCell>
    </TableRow>
  )
}

function RoleBadge({ meta, tooltip }: { meta: RoleMeta; tooltip?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={cn('font-medium', meta.badgeClassName)}>{meta.label}</Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{tooltip ?? meta.description}</TooltipContent>
    </Tooltip>
  )
}
