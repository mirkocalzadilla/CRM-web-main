'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Hint } from '@/components/crm/catalog/service-form'
import { ServiceLinkForm, type LinkDraft } from '@/components/crm/catalog/service-link-form'
import { ServiceLinkRow } from '@/components/crm/catalog/service-link-row'
import { useCreateServiceLink, useServiceLinks } from '@/hooks/use-service-links'
import { MAX_LINKS_PER_SERVICE } from '@/lib/api/service-links'

/** ABM de los links que el agente envía después de validar el pago (#178). */
export function ServiceLinksManager({ serviceId }: { serviceId: string }) {
  const { data: links, isLoading, isError } = useServiceLinks(serviceId)
  const create = useCreateServiceLink(serviceId)
  const [adding, setAdding] = useState(false)

  const list = links ?? []
  const atLimit = list.length >= MAX_LINKS_PER_SERVICE

  function add(draft: LinkDraft) {
    create.mutate(
      { kind: draft.kind, url: draft.url, label: draft.label || null, orden: list.length },
      { onSuccess: () => setAdding(false) },
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-zinc-300">Links de entrega</p>
          <Hint>
            {list.length} de {MAX_LINKS_PER_SERVICE} · se envían al lead recién cuando el pago
            queda validado. Se guardan al instante, aparte del servicio.
          </Hint>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setAdding(true)}
          disabled={adding || atLimit}
          className="h-8 gap-1.5 border-white/10 bg-white/[0.03] text-xs text-white"
        >
          <Plus className="size-3.5" /> Agregar link
        </Button>
      </div>

      {atLimit && !adding && (
        <Hint>Llegaste al tope de {MAX_LINKS_PER_SERVICE} links. Borrá uno para agregar otro.</Hint>
      )}

      {isLoading && <Skeleton className="h-9 w-full bg-white/[0.04]" />}
      {isError && (
        <p className="text-[11px] text-rose-400">
          No se pudieron cargar los links. Cerrá y volvé a abrir el servicio.
        </p>
      )}
      {!isLoading && !isError && list.length === 0 && !adding && (
        <Hint>
          Todavía no hay links. Sin links, un servicio virtual no entrega nada y lo hace el equipo
          a mano; uno híbrido entrega la entrada igual y avisa que falta el link.
        </Hint>
      )}

      {list.map((link) => (
        <ServiceLinkRow key={link.id} link={link} serviceId={serviceId} />
      ))}

      {adding && (
        <ServiceLinkForm
          saving={create.isPending}
          submitLabel="Agregar link"
          onSubmit={add}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}
