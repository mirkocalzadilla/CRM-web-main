'use client'

import { useState } from 'react'
import { CheckCheck } from 'lucide-react'

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAttention } from '@/hooks/use-attention'
import { CardDetailDialog } from '@/components/crm/card-detail-dialog'
import { AttentionTable } from '@/components/crm/attention/attention-table'

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 w-full bg-white/[0.04]" />
      ))}
    </div>
  )
}

/** El número que importa es el bloqueante: lo que no avanza hasta que alguien decida.
 *  `null` mientras no se sabe — no se pinta un cero verde de mentira. */
function BlockingCounter({ total }: { total: number | null }) {
  return (
    <div
      className={cn(
        'flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl border',
        total === null
          ? 'border-white/10 bg-white/[0.03] text-zinc-500'
          : total > 0
            ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_30px_-12px_rgba(244,63,94,0.6)]'
            : 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300',
      )}
    >
      <span className="text-2xl leading-none font-bold">{total ?? '—'}</span>
      <span className="text-[10px] font-medium tracking-wide uppercase">
        {total === 1 ? 'urgente' : 'urgentes'}
      </span>
    </div>
  )
}

function LoadError() {
  return (
    <Empty className="border border-dashed border-white/10">
      <EmptyHeader>
        <EmptyTitle className="text-white">No se pudo cargar la cola</EmptyTitle>
        <EmptyDescription className="text-zinc-500">
          Reintentá en unos segundos.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function NothingPending() {
  return (
    <Empty className="border border-dashed border-white/10">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-white/5 text-emerald-400">
          <CheckCheck />
        </EmptyMedia>
        <EmptyTitle className="text-white">No hay nada esperando</EmptyTitle>
        <EmptyDescription className="text-zinc-500">
          Todas las oportunidades siguieron su curso solas.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/** Requiere atención: las oportunidades de los dos embudos que esperan a una persona,
 *  en una sola lista. El tablero ya marca cada card con su aviso, pero eso solo se ve
 *  mirando la columna donde cayó; acá el trabajo pendiente se ve todo junto y ordenado
 *  por urgencia, sin tener que recorrer los embudos. */
export function AttentionScreen() {
  const { items, blocking, isLoading, isError } = useAttention()
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const hasItems = items.length > 0
  const waiting = items.length - blocking

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <BlockingCounter total={isLoading ? null : blocking} />
          <div>
            <h1 className="text-2xl font-bold text-white">Requiere atención</h1>
            <p className="max-w-2xl text-sm text-zinc-500">
              La IA lleva la venta sola de punta a punta. Acá quedan las oportunidades
              donde no pudo. Arriba, lo que no avanza sin una decisión tuya: un
              comprobante que no pasó las verificaciones, una entrega sin fecha o sin
              link. Debajo, lo que solo hay que revisar.
            </p>
            {waiting > 0 && (
              <p className="mt-1 max-w-2xl text-sm text-zinc-500">
                <span className="font-medium text-amber-300">{waiting}</span>{' '}
                {waiting === 1 ? 'espera revisión' : 'esperan revisión'}. Si ya no hay
                nada pendiente en una, marcala como <strong>atendida</strong> y sale de
                la lista.
              </p>
            )}
          </div>
        </div>
      </div>

      {isLoading && <TableSkeleton />}
      {/* El error solo reemplaza la lista si no hay nada que mostrar: si un refetch en
          segundo plano falla, lo que ya está en pantalla sigue sirviendo. */}
      {!isLoading && isError && !hasItems && <LoadError />}
      {!isLoading && !isError && !hasItems && <NothingPending />}
      {hasItems && <AttentionTable items={items} onOpenCard={setOpenCardId} />}

      <CardDetailDialog cardId={openCardId} onClose={() => setOpenCardId(null)} />
    </div>
  )
}
