'use client'

import { useState } from 'react'
import { BadgeCheck } from 'lucide-react'

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { PendingPayment } from '@/lib/api/payments'
import { usePendingPayments } from '@/hooks/use-payments'
import { CardDetailDialog } from '@/components/crm/card-detail-dialog'
import { PaymentRejectDialog } from '@/components/crm/payments/payment-reject-dialog'
import { PaymentsExportMenu } from '@/components/crm/payments/payments-export-menu'
import { PaymentsTable } from '@/components/crm/payments/payments-table'

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 w-full bg-white/[0.04]" />
      ))}
    </div>
  )
}

/** El número es la señal de que hay trabajo: grande, primero y en ámbar mientras la cola
 *  no esté vacía. `null` = todavía no se sabe (no se pinta un "0" verde de mentira). */
function PendingCounter({ total }: { total: number | null }) {
  return (
    <div
      className={cn(
        'flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl border',
        total === null
          ? 'border-white/10 bg-white/[0.03] text-zinc-500'
          : total > 0
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_30px_-12px_rgba(251,191,36,0.6)]'
            : 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300',
      )}
    >
      <span className="text-2xl leading-none font-bold">{total ?? '—'}</span>
      <span className="text-[10px] font-medium tracking-wide uppercase">
        {total === 1 ? 'pago' : 'pagos'}
      </span>
    </div>
  )
}

function LoadError() {
  return (
    <Empty className="border border-dashed border-white/10">
      <EmptyHeader>
        <EmptyTitle className="text-white">No se pudo cargar la cola de pagos</EmptyTitle>
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
          <BadgeCheck />
        </EmptyMedia>
        <EmptyTitle className="text-white">No hay pagos por confirmar</EmptyTitle>
        <EmptyDescription className="text-zinc-500">
          Todo lo que el sistema aprobó solo ya se cotejó contra el banco.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/** Conciliación de pagos (web#184 / server#274). El sistema valida el comprobante y
 *  entrega para que el lead no espere, pero un comprobante es una imagen: nadie puede
 *  afirmar que el dinero entró hasta que una persona lo coteja contra el extracto. Esta
 *  pantalla es ese cotejo — confirmar sella el registro, rechazar revoca la entrada. */
export function PaymentsScreen() {
  const { data, isLoading, isError } = usePendingPayments()
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<PendingPayment | null>(null)

  const items = data?.items ?? []
  const total = data?.total ?? null

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <PendingCounter total={total} />
          <div>
            <h1 className="text-2xl font-bold text-white">Pagos por confirmar</h1>
            <p className="max-w-2xl text-sm text-zinc-500">
              El sistema los aprobó y ya entregó. Falta cotejarlos contra el extracto del
              banco: hasta entonces nadie puede afirmar que el dinero entró.
            </p>
          </div>
        </div>
        <PaymentsExportMenu />
      </div>

      {isLoading && <TableSkeleton />}
      {/* El error solo reemplaza la cola si no hay nada que mostrar: si un refetch en
          segundo plano falla, la lista que ya está en pantalla sigue sirviendo. */}
      {!isLoading && isError && !data && <LoadError />}
      {!isLoading && !isError && items.length === 0 && <NothingPending />}
      {items.length > 0 && (
        <PaymentsTable
          payments={items}
          onOpenCard={setOpenCardId}
          onReject={setRejecting}
        />
      )}

      <PaymentRejectDialog payment={rejecting} onClose={() => setRejecting(null)} />
      <CardDetailDialog cardId={openCardId} onClose={() => setOpenCardId(null)} />
    </div>
  )
}
