'use client'

import { CLOSING_LABELS } from '@/components/crm/catalog/labels'
import type { ServiceClosing } from '@/lib/api/catalogo'

interface PreviewService {
  nombre: string
  resumen: string
  detalle?: string | null
  precio: string
  moneda: string
  flujo_cierre: string
}

/** Cómo el bot le presenta este servicio al lead: resumen breve + precio. */
export function ServicePreview({ service }: { service: PreviewService }) {
  const isUsd = service.moneda === 'USD'
  const closing = CLOSING_LABELS[service.flujo_cierre as ServiceClosing] ?? service.flujo_cierre

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Vista previa (cómo lo ve el lead)
      </p>
      <p className="text-sm font-semibold text-white">{service.nombre || 'Sin nombre'}</p>
      <p className="whitespace-pre-line text-sm text-zinc-300">
        {service.resumen || 'Sin resumen.'}
      </p>
      <p className="text-sm text-violet-300">
        {service.precio || '—'}
        {service.precio && <span className="ml-1 text-xs text-zinc-400">{service.moneda}</span>}
        {isUsd && (
          <span className="ml-1 text-xs text-zinc-500">
            (referencia; el equipo confirma el monto en Bs)
          </span>
        )}
      </p>
      {service.detalle && (
        <p className="whitespace-pre-line text-xs text-zinc-400">{service.detalle}</p>
      )}
      <p className="text-xs text-zinc-500">Cierre: {closing}</p>
    </div>
  )
}

export type { PreviewService }
