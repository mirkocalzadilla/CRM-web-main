'use client'

import { useState } from 'react'
import { Plus, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatMoney } from '@/lib/format'
import { useUpdateCardServices } from '@/hooks/use-card-mutations'
import { useServices } from '@/hooks/use-catalogo'
import type { CardService } from '@/lib/api/crm'
import { cn } from '@/lib/utils'

/** Asigna/quita servicios del catálogo a la oportunidad (#82). Los `assigned` (operador)
 *  se editan; los `captured` (bot, #133) se muestran read-only. */
export function ServicesSelector({ cardId, services }: { cardId: string; services: CardService[] }) {
  const { data: catalog } = useServices()
  const update = useUpdateCardServices(cardId)
  const [open, setOpen] = useState(false)

  const assignedIds = services.filter((s) => s.source === 'assigned').map((s) => s.service_id)
  const capturedIds = new Set(services.filter((s) => s.source === 'captured').map((s) => s.service_id))
  const active = (catalog ?? []).filter((s) => s.is_active)

  function toggle(serviceId: string, checked: boolean) {
    update.mutate(
      checked ? [...assignedIds, serviceId] : assignedIds.filter((id) => id !== serviceId),
    )
  }

  return (
    <div>
      {services.length === 0 ? (
        <p className="text-sm font-normal text-zinc-600">Sin servicios asignados todavía.</p>
      ) : (
        <ul className="space-y-1.5">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-200">{s.nombre}</p>
                <p className="text-xs text-zinc-500">{formatMoney(s.precio, s.moneda)}</p>
              </div>
              {s.source === 'captured' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                      <Sparkles className="size-3" /> bot
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Lo eligió el agente IA durante la conversación</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Quitar ${s.nombre}`}
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate(assignedIds.filter((id) => id !== s.service_id))
                      }
                      className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-rose-400"
                    >
                      <X className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Quitar servicio</TooltipContent>
                </Tooltip>
              )}
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={update.isPending}
            className="mt-2 gap-1.5 border-white/10 bg-white/[0.03] text-xs text-white"
          >
            <Plus className="size-3.5" /> Asignar servicio
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 border-white/10 bg-zinc-950 p-1.5">
          {active.length === 0 ? (
            <p className="px-2 py-3 text-xs text-zinc-500">
              No hay servicios activos en el catálogo.
            </p>
          ) : (
            <ul className="max-h-64 space-y-0.5 overflow-y-auto">
              {active.map((s) => {
                const isCaptured = capturedIds.has(s.id)
                return (
                  <li key={s.id}>
                    <label
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                        isCaptured ? 'opacity-60' : 'cursor-pointer hover:bg-white/5',
                      )}
                    >
                      <Checkbox
                        checked={isCaptured || assignedIds.includes(s.id)}
                        disabled={isCaptured || update.isPending}
                        onCheckedChange={(v) => toggle(s.id, v === true)}
                      />
                      <span className="min-w-0 flex-1 truncate text-zinc-200">{s.nombre}</span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {formatMoney(s.precio, s.moneda)}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
