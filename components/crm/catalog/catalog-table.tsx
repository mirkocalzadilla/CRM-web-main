'use client'

import { useMemo, useState } from 'react'
import { FileText, GripVertical, Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ServiceDeleteDialog } from '@/components/crm/catalog/service-delete-dialog'
import { ServiceDeliveryBadge } from '@/components/crm/catalog/service-delivery-badge'
import { ServiceEventsLink } from '@/components/crm/catalog/service-events-link'
import { useUpdateService } from '@/hooks/use-catalogo'
import type { ServiceRead } from '@/lib/api/catalogo'

interface CatalogTableProps {
  services: ServiceRead[]
  onEdit: (service: ServiceRead) => void
}

const NO_CATEGORY = '__none__'

export function CatalogTable({ services, onEdit }: CatalogTableProps) {
  const update = useUpdateService()
  const [dragId, setDragId] = useState<string | null>(null)

  // Agrupa por categoría dinámica (#106); los sin categoría van al final.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { label: string; orden: number; docs: number; items: ServiceRead[] }
    >()
    for (const service of services) {
      const key = service.category_id ?? NO_CATEGORY
      const existing = map.get(key)
      if (existing) {
        existing.items.push(service)
      } else {
        map.set(key, {
          label: service.category?.nombre ?? 'Sin categoría',
          orden: service.category?.orden ?? Number.MAX_SAFE_INTEGER,
          docs: service.category?.materials.length ?? 0, // documentos de la categoría (#235)
          items: [service],
        })
      }
    }
    for (const group of map.values()) {
      group.items.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
    }
    return [...map.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label))
  }, [services])

  function reorder(group: ServiceRead[], fromId: string, toId: string) {
    if (fromId === toId) return
    const ids = group.map((o) => o.id)
    const next = [...ids]
    next.splice(next.indexOf(fromId), 1)
    next.splice(next.indexOf(toId), 0, fromId)
    // Reasigna los slots de `orden` ya existentes del grupo a la nueva secuencia.
    const slots = group.map((o) => o.orden).sort((a, b) => a - b)
    next.forEach((id, i) => {
      const service = group.find((o) => o.id === id)
      if (service && service.orden !== slots[i]) {
        update.mutate({ serviceId: id, body: { orden: slots[i] } })
      }
    })
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            {group.label}
            {group.docs > 0 && (
              <span className="flex items-center gap-1 text-xs font-normal text-zinc-500">
                <FileText className="size-3.5 text-emerald-400/70" />
                {group.docs} {group.docs === 1 ? 'documento' : 'documentos'}
              </span>
            )}
          </h2>
          <div className="rounded-xl border border-white/5 bg-white/[0.02]">
            <Table className="min-w-170 table-fixed">
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-10" />
                  <TableHead className="text-zinc-400">Servicio</TableHead>
                  <TableHead className="w-44 text-zinc-400">Precio</TableHead>
                  <TableHead className="w-20 text-zinc-400">Activo</TableHead>
                  <TableHead className="w-24 text-right text-zinc-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.map((service) => (
                  <TableRow
                    key={service.id}
                    draggable
                    onDragStart={() => setDragId(service.id)}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dragId && reorder(group.items, dragId, service.id)}
                    className={cn(
                      'border-white/5 hover:bg-white/[0.02]',
                      dragId === service.id && 'opacity-50',
                      !service.is_active && 'opacity-50',
                    )}
                  >
                    <TableCell className="cursor-grab text-zinc-600">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span aria-label="Arrastrá para reordenar" className="inline-flex">
                            <GripVertical className="size-4" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Arrastrá para reordenar</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    {/* La celda del nombre abre el editor: el lápiz sigue como vía accesible. */}
                    <TableCell className="cursor-pointer" onClick={() => onEdit(service)}>
                      <p className="text-sm font-medium text-white">{service.nombre}</p>
                      <p className="line-clamp-1 text-xs text-zinc-500">{service.resumen}</p>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300">
                      {formatMoney(service.precio, service.moneda)}
                      <ServiceDeliveryBadge service={service} />
                      <ServiceEventsLink serviceId={service.id} modality={service.modality} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={(checked) =>
                          update.mutate({ serviceId: service.id, body: { is_active: checked } })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar servicio"
                            onClick={() => onEdit(service)}
                            className="text-zinc-400 hover:text-white"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar servicio</TooltipContent>
                      </Tooltip>
                      <ServiceDeleteDialog
                        serviceId={service.id}
                        serviceName={service.nombre}
                        disabled={!service.is_active}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
  )
}
