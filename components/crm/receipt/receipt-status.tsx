'use client'

import Link from 'next/link'
import {
  BadgeCheck,
  CircleCheck,
  Landmark,
  TicketX,
  TriangleAlert,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatTicketTime } from '@/lib/format'
import {
  approvedBySystem,
  receiptState,
  type Receipt,
  type ReceiptState,
} from '@/lib/api/receipt'

type Tone = 'emerald' | 'amber' | 'sky' | 'violet' | 'red'

const TONE_CLASS: Record<Tone, string> = {
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  sky: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  red: 'border-red-500/30 bg-red-500/10 text-red-300',
}

interface StatusMeta {
  label: string
  icon: LucideIcon
  tone: Tone
  /** Sello con la hora del estado (además de "Recibido"); null si no aplica. */
  stamp: { label: string; at: string } | null
}

/** Copy del estado (web#194). `approved` se abre en dos: lo aprobó el sistema o lo
 *  validó una persona — al operador le cambia qué hacer después. */
function statusMeta(state: ReceiptState, receipt: Receipt): StatusMeta {
  switch (state) {
    case 'rejected':
      return {
        label: 'Rechazado: el pago no entró',
        icon: TicketX,
        tone: 'red',
        stamp: receipt.human_rejected_at
          ? { label: 'Rechazado', at: receipt.human_rejected_at }
          : null,
      }
    case 'confirmed':
      return {
        label: 'Confirmado contra el banco',
        icon: Landmark,
        tone: 'emerald',
        stamp: receipt.human_confirmed_at
          ? { label: 'Confirmado', at: receipt.human_confirmed_at }
          : null,
      }
    case 'approved':
      return approvedBySystem(receipt)
        ? {
            label: 'Aprobado por el sistema',
            icon: BadgeCheck,
            tone: 'sky',
            stamp: receipt.approved_at ? { label: 'Aprobado', at: receipt.approved_at } : null,
          }
        : {
            label: 'Validado a mano',
            icon: UserCheck,
            tone: 'violet',
            stamp: receipt.approved_at ? { label: 'Validado', at: receipt.approved_at } : null,
          }
    case 'pending':
      return { label: 'Las verificaciones cerraron', icon: CircleCheck, tone: 'emerald', stamp: null }
    case 'review':
      return { label: 'Necesita tu revisión', icon: TriangleAlert, tone: 'amber', stamp: null }
  }
}

function PaymentsLink() {
  return (
    <Link href="/pagos" className="text-violet-300 underline-offset-2 hover:underline">
      Pagos por confirmar
    </Link>
  )
}

function Hint({ state, receipt }: { state: ReceiptState; receipt: Receipt }) {
  switch (state) {
    case 'rejected':
      return (
        <>
          El pago no se pudo confirmar con el banco: la entrada quedó anulada y la oportunidad,
          como perdida. El motivo está más abajo.
        </>
      )
    case 'confirmed':
      return <>El pago figura en el extracto del banco: no queda nada por hacer con este comprobante.</>
    case 'approved':
      return approvedBySystem(receipt) ? (
        <>
          Todas las verificaciones cerraron, así que el sistema validó el pago solo y disparó la
          entrega. Falta cotejarlo contra el extracto del banco: eso se hace desde{' '}
          <PaymentsLink />.
        </>
      ) : (
        <>
          Una persona validó este pago y la entrega se disparó en el acto. Si la card quedó con
          un aviso, ahí dice qué falta para completarla.
        </>
      )
    case 'pending':
      return (
        <>
          El monto, el destinatario y la fecha coinciden con lo esperado: podés validar el pago
          con un click y la entrega sale sola.
        </>
      )
    case 'review':
      return (
        <>
          El sistema no lo aprobó solo. Mirá abajo qué no cerró y, si igual corresponde
          cobrarlo, validalo dejando escrito por qué.
        </>
      )
  }
}

function Stamp({ label, at }: { label: string; at: string }) {
  return (
    <span className="text-[11px] font-normal text-zinc-500">
      {label} {formatTicketTime(at)}
    </span>
  )
}

/** Cabecera del panel: badge del estado, sellos de tiempo y la explicación de qué
 *  significa y qué sigue. Es la parte que le dice al operador si tiene algo que hacer. */
export function ReceiptStatus({ receipt }: { receipt: Receipt }) {
  const state = receiptState(receipt)
  const meta = statusMeta(state, receipt)
  const Icon = meta.icon

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
            TONE_CLASS[meta.tone],
          )}
        >
          <Icon className="size-3 shrink-0" />
          {meta.label}
        </span>
        <Stamp label="Recibido" at={receipt.created_at} />
        {meta.stamp && <Stamp label={meta.stamp.label} at={meta.stamp.at} />}
      </div>
      <p className="text-xs font-normal text-zinc-400">
        <Hint state={state} receipt={receipt} />
      </p>
    </div>
  )
}
