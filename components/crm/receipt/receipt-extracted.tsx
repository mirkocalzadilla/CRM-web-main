'use client'

import { cn } from '@/lib/utils'
import { extractedRows } from '@/components/crm/receipt/labels'

/** Lo que el modelo de visión leyó del comprobante, tal cual quedó guardado.
 *  Los valores van **sin reformatear** a propósito: el operador los compara contra la
 *  imagen que tiene al lado, y "arreglar" un monto o una fecha rompería esa comparación. */
export function ReceiptExtracted({
  extracted,
}: {
  extracted: Record<string, string | null>
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
      {extractedRows(extracted).map(({ key, label, value, icon: Icon }) => (
        <div key={key} className="min-w-0">
          <dt className="flex items-center gap-1 text-[11px] font-normal text-zinc-500">
            <Icon className="size-3 shrink-0" />
            {label}
          </dt>
          <dd
            title={value ?? undefined}
            className={cn(
              'truncate text-sm font-normal',
              value ? 'text-zinc-200' : 'text-zinc-600 italic',
            )}
          >
            {value ?? 'no se pudo leer'}
          </dd>
        </div>
      ))}
    </dl>
  )
}
