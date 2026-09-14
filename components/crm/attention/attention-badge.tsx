'use client'

import { cn } from '@/lib/utils'
import { useAttention } from '@/hooks/use-attention'

/** Contador de la cola en el menú: se ve desde cualquier pantalla, que es el punto —
 *  el aviso sobre la card solo sirve si alguien está mirando ese embudo. Cuenta lo
 *  bloqueante; con la cola vacía no muestra nada, porque un cero fijo no informa. */
export function AttentionBadge({ collapsed = false }: { collapsed?: boolean }) {
  const { blocking } = useAttention()
  if (blocking === 0) return null

  return (
    <span
      aria-label={`${blocking} oportunidades requieren atención`}
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/15 font-semibold text-rose-300',
        collapsed
          ? 'absolute top-1 right-1 min-w-4 px-1 text-[9px] leading-4'
          : 'ml-auto min-w-5 px-1.5 py-0.5 text-[10px] leading-4',
      )}
    >
      {blocking}
    </span>
  )
}
