import { formatMoney } from '@/lib/format'
import { MODALITY_NONE, MODALITY_SHORT } from '@/components/crm/catalog/labels'
import type { ServiceRead } from '@/lib/api/catalogo'

/** Resumen de la entrega post-pago en la fila del catálogo (#178). */
export function ServiceDeliveryBadge({ service }: { service: ServiceRead }) {
  const modality = MODALITY_SHORT[service.modality ?? MODALITY_NONE]
  const amount = service.price_amount

  return (
    <p className="text-[11px] text-zinc-500">
      {modality}
      {' · '}
      {amount === null ? (
        <span className="text-amber-300/80">sin monto (se valida a mano)</span>
      ) : (
        <span className="text-zinc-400">{formatMoney(amount, service.moneda)} a comparar</span>
      )}
    </p>
  )
}
