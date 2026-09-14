'use client'

import { TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Etiqueta de alerta de la oportunidad, derivada del motivo de handoff (#94):
// 'unknown_service' (el lead pidió un servicio fuera del catálogo) y 'agent_error' (el
// agente no pudo responder y derivó, server#288). Cualquier otro valor (o null) no
// renderiza nada.
const ALERTS: Record<string, string> = {
  unknown_service: 'Solicitud desconocida',
  agent_error: 'Error del agente IA',
}

/** Badge de alerta de la card. `showLabel` muestra el texto (detalle); en la cara de la
 *  card va solo el ícono, con tooltip accesible (#140). Null cuando no hay alerta conocida. */
export function AlertBadge({
  alert,
  showLabel = false,
  className,
}: {
  alert?: string | null
  showLabel?: boolean
  className?: string
}) {
  const label = alert ? ALERTS[alert] : undefined
  if (!label) return null
  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400',
        className,
      )}
      aria-label={showLabel ? undefined : label}
    >
      <TriangleAlert className="size-3 shrink-0" />
      {showLabel && label}
    </span>
  )
  if (showLabel) return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
