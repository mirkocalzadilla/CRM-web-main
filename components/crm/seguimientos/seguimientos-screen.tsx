'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOptOuts, useOutboundMessages } from '@/hooks/use-outbound'
import {
  OUTBOUND_PURPOSES,
  OUTBOUND_STATUSES,
  PURPOSE_LABELS,
  STATUS_LABELS,
  type OutboundMessage,
  type OutboundPurpose,
  type OutboundStatus,
} from '@/lib/api/outbound'
import { cn } from '@/lib/utils'

const STATUS_CLASSES: Record<string, string> = {
  sent: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
  delivered: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  read: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  failed: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  skipped: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  queued: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusPill({ message }: { message: OutboundMessage }) {
  const detail =
    message.status === 'failed'
      ? `${message.error_code ?? ''} ${message.error_detail ?? ''}`.trim()
      : message.status === 'skipped'
        ? message.error_detail ?? ''
        : ''
  return (
    <span
      title={detail || undefined}
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium',
        STATUS_CLASSES[message.status] ?? STATUS_CLASSES.queued,
      )}
    >
      {STATUS_LABELS[message.status] ?? message.status}
    </span>
  )
}

const selectClass =
  'h-9 rounded-md border border-white/10 bg-white/[0.03] px-2 text-sm text-white outline-none'

export function SeguimientosScreen() {
  const [purpose, setPurpose] = useState<OutboundPurpose | ''>('')
  const [status, setStatus] = useState<OutboundStatus | ''>('')
  const messages = useOutboundMessages({ purpose, status, limit: 200 })
  const optOuts = useOptOuts()
  const items = messages.data?.items ?? []

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Seguimientos</h1>
          <p className="text-sm text-zinc-500">
            Mensajes que el sistema inició por WhatsApp: entradas, recordatorios de eventos y
            reactivación de leads. El estado lo informa Meta.
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {items.length} {items.length === 1 ? 'envío' : 'envíos'} en la vista ·{' '}
            {optOuts.data?.length ?? 0} números dados de baja · las reglas se configuran en{' '}
            <Link href="/settings" className="text-violet-300 underline-offset-2 hover:underline">
              Ajustes
            </Link>
            .
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => messages.refetch()}
          disabled={messages.isFetching}
          className="gap-2 border-white/10 bg-white/[0.03] text-white"
        >
          <RefreshCw className={cn('size-4', messages.isFetching && 'animate-spin')} /> Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Tipo de envío"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as OutboundPurpose | '')}
          className={selectClass}
        >
          <option value="">Todos los tipos</option>
          {OUTBOUND_PURPOSES.map((p) => (
            <option key={p} value={p}>
              {PURPOSE_LABELS[p]}
            </option>
          ))}
        </select>
        <select
          aria-label="Estado"
          value={status}
          onChange={(e) => setStatus(e.target.value as OutboundStatus | '')}
          className={selectClass}
        >
          <option value="">Todos los estados</option>
          {OUTBOUND_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {messages.isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full bg-white/[0.04]" />
          <Skeleton className="h-10 w-full bg-white/[0.04]" />
        </div>
      )}
      {messages.isError && (
        <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">
          No se pudieron cargar los envíos. Reintentá en unos segundos.
        </p>
      )}
      {messages.isSuccess && items.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
          Todavía no hay envíos con estos filtros.
        </p>
      )}
      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500">Cuándo</TableHead>
                <TableHead className="text-zinc-500">Tipo</TableHead>
                <TableHead className="text-zinc-500">Para</TableHead>
                <TableHead className="text-zinc-500">Mensaje</TableHead>
                <TableHead className="text-zinc-500">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id} className="border-white/5">
                  <TableCell className="whitespace-nowrap text-zinc-300">
                    {formatWhen(m.sent_at ?? m.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-300">
                    {PURPOSE_LABELS[m.purpose] ?? m.purpose}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-zinc-400">
                    {m.card_id ? (
                      <Link href={`/?card=${m.card_id}`} className="hover:text-white">
                        +{m.wa_id}
                      </Link>
                    ) : (
                      `+${m.wa_id}`
                    )}
                  </TableCell>
                  <TableCell className="max-w-md text-zinc-400">
                    <span className="line-clamp-2">{m.rendered_text}</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill message={m} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
