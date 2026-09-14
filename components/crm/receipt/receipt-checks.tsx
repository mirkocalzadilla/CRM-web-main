'use client'

import { Check, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ReceiptCheck } from '@/lib/api/receipt'
import { checkMeta } from '@/components/crm/receipt/labels'

/** Lo que falló primero: el operador necesita ver el problema antes que lo que ya cerró. */
function failedFirst(checks: ReceiptCheck[]): ReceiptCheck[] {
  return [...checks].sort((a, b) => Number(a.passed) - Number(b.passed))
}

function CheckRow({ check }: { check: ReceiptCheck }) {
  const { label, icon: Icon } = checkMeta(check.code)
  return (
    <li className="flex items-start gap-2">
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
          check.passed
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-rose-500/15 text-rose-400',
        )}
        aria-hidden
      >
        {check.passed ? <Check className="size-3" /> : <X className="size-3" />}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
          <Icon className="size-3 shrink-0 text-zinc-500" />
          {label}
          <span className="sr-only">{check.passed ? ': pasó' : ': no pasó'}</span>
        </p>
        {check.detail && (
          <p
            className={cn(
              'text-xs font-normal break-words',
              check.passed ? 'text-zinc-500' : 'text-rose-300/90',
            )}
          >
            {check.detail}
          </p>
        )}
      </div>
    </li>
  )
}

/** Semáforo de los checks determinísticos del comprobante (server#272). El `detail` de
 *  cada uno viene del backend ya en español: no se re-genera acá. */
export function ReceiptChecks({ checks }: { checks: ReceiptCheck[] }) {
  if (checks.length === 0) {
    return (
      <p className="text-xs font-normal text-zinc-600">
        El sistema no dejó verificaciones para este comprobante: revisalo a mano.
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {failedFirst(checks).map((check, idx) => (
        <CheckRow key={`${check.code}-${idx}`} check={check} />
      ))}
    </ul>
  )
}
