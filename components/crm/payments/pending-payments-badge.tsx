'use client'

import { cn } from '@/lib/utils'
import { usePendingPayments } from '@/hooks/use-payments'

/** Contador de la cola en el menú: el número es la señal de que hay trabajo pendiente,
 *  así que se ve desde cualquier pantalla. Con la cola vacía no se muestra nada — un
 *  cero permanente deja de ser información. */
export function PendingPaymentsBadge({ collapsed = false }: { collapsed?: boolean }) {
  const { data } = usePendingPayments()
  const total = data?.total ?? 0
  if (total === 0) return null

  return (
    <span
      aria-label={`${total} pagos por confirmar`}
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 font-semibold text-amber-300',
        collapsed
          ? 'absolute top-1 right-1 min-w-4 px-1 text-[9px] leading-4'
          : 'ml-auto min-w-5 px-1.5 py-0.5 text-[10px] leading-4',
      )}
    >
      {total}
    </span>
  )
}
