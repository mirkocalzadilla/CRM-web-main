'use client'

import { Button } from '@/components/ui/button'
import { statusMeta, toneClasses } from '@/components/crm/entries/labels'
import { verdictTone, type RedeemResult } from '@/lib/api/entries'
import { cn } from '@/lib/utils'

interface Fact {
  label: string
  value: string
}

/** Lo que resuelve la conversación en la puerta: de quién es la entrada y qué compró.
 *
 *  `used_at` **no** se muestra acá a propósito: el `detail` del backend ya trae la hora
 *  del primer uso en la zona horaria del negocio, y volver a formatearla desde el reloj
 *  del teléfono podría contradecir en pantalla la frase que alguien está leyendo en voz
 *  alta. El monto tampoco se reformatea: es el precio de display del catálogo, tal como
 *  lo escribió el operador. */
function factsOf(result: RedeemResult): Fact[] {
  const facts: Fact[] = []
  if (result.lead_name) facts.push({ label: 'Nombre', value: result.lead_name })
  if (result.service_name) facts.push({ label: 'Curso', value: result.service_name })
  if (result.amount) facts.push({ label: 'Monto', value: result.amount })
  if (result.event_name) facts.push({ label: 'Evento', value: result.event_name })
  return facts
}

interface ScanVerdictProps {
  result: RedeemResult
  onDismiss: () => void
}

/** Veredicto de la puerta, pensado para leerse a un metro y con poca luz: el titular
 *  enorme decide, la frase del backend explica y los datos identifican a la persona. */
export function ScanVerdict({ result, onDismiss }: ScanVerdictProps) {
  const tone = toneClasses(verdictTone(result))
  const { headline, icon: Icon } = statusMeta(result)
  const facts = factsOf(result)

  return (
    <div
      role="status"
      aria-live="assertive"
      className={cn(
        'flex flex-col gap-4 rounded-2xl border p-5 shadow-2xl backdrop-blur-md',
        tone.panel,
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('size-14 shrink-0', tone.text)} strokeWidth={2.5} />
        <p className={cn('text-4xl leading-none font-bold tracking-tight', tone.text)}>
          {headline}
        </p>
      </div>

      <p className="text-lg leading-snug font-medium text-white">{result.detail}</p>

      {facts.length > 0 && (
        <dl className="grid gap-1.5 rounded-xl bg-black/40 px-4 py-3">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-xs text-zinc-400">{fact.label}</dt>
              <dd className="min-w-0 truncate text-right text-base font-medium text-white">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <Button
        onClick={onDismiss}
        className="h-16 w-full bg-white text-lg font-semibold text-black hover:bg-zinc-200"
      >
        Siguiente
      </Button>
    </div>
  )
}
