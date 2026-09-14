'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { usePermissions } from '@/hooks/use-permissions'
import { useAgentConfig } from '@/hooks/use-agent-config'
import { AgentConfigForm } from '@/components/crm/config/agent-config-form'

export default function AgentsPage() {
  const router = useRouter()
  const { canManageConfig } = usePermissions()
  const { data: agent, isLoading, isError } = useAgentConfig()

  useEffect(() => {
    if (!canManageConfig) {
      router.replace('/crm')
    }
  }, [canManageConfig, router])

  if (!canManageConfig) return null

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      {isLoading && <p className="text-sm text-zinc-500">Cargando configuración…</p>}
      {isError && <p className="text-sm text-zinc-500">No se pudo cargar el agente.</p>}
      {!isLoading && !isError && !agent && (
        <p className="text-sm text-zinc-500">No hay agente configurado para este tenant.</p>
      )}
      {agent && (
        <AgentConfigForm
          key={`${agent.id}:${agent.current_version?.version_number ?? 'none'}`}
          agent={agent}
        />
      )}
    </div>
  )
}
