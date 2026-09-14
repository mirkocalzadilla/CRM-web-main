'use client'

import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import {
  MODALITY_CHOICES,
  MODALITY_LABELS,
  type ModalityChoice,
} from '@/components/crm/catalog/labels'
import {
  Field,
  FieldError,
  Hint,
  RULES,
  SelectField,
  type FormValues,
} from '@/components/crm/catalog/service-form'
import { ServiceEventsLink } from '@/components/crm/catalog/service-events-link'
import { ServiceLinksManager } from '@/components/crm/catalog/service-links-manager'
import type { ServiceCurrency } from '@/lib/api/catalogo'

interface ServiceDeliverySectionProps {
  control: Control<FormValues>
  register: UseFormRegister<FormValues>
  errors: FieldErrors<FormValues>
  moneda: ServiceCurrency
  priceAmount: string
  /** La modalidad elegida en el form: decide qué explicación y qué avisos se muestran. */
  modality: ModalityChoice
  /** null mientras el servicio no existe: los links necesitan un id. */
  serviceId: string | null
}

/** Qué implica cada modalidad, dicho solo para la elegida — el párrafo con las cuatro
 *  juntas obligaba a leerlas todas para entender una.
 *
 *  Presencial e híbrido llevan **el encuadre completo de #192**, palabra por palabra: el
 *  servicio es lo que se cobra y el evento es la fecha, el lugar y el cupo. Es la
 *  explicación de por qué Catálogo y Agenda no son lo mismo, y las dos modalidades que
 *  emiten entrada la necesitan por igual — #192 existió justamente para poner a híbrido
 *  a la par de presencial. */
const MODALITY_HINTS: Record<ModalityChoice, string> = {
  presencial:
    'Al validarse el pago se emite la entrada con QR. El servicio es lo que se cobra; el evento es la fecha, el lugar y el cupo a los que da acceso la entrada, y se carga en la Agenda: sin una fecha próxima cargada, el pago se confirma pero la entrada no sale y la oportunidad queda con el aviso "Sin evento en Agenda".',
  virtual:
    'Al validarse el pago se envían los links de abajo (grupo, reunión). Sin links no se entrega nada y sigue el equipo a mano.',
  hibrido:
    'Entrega la entrada con QR y los links en un mismo mensaje, para un curso con módulos presenciales y por Zoom. El servicio es lo que se cobra; el evento es la fecha, el lugar y el cupo a los que da acceso la entrada, y se carga en la Agenda: sin una fecha próxima cargada, el pago se confirma pero la entrada no sale y la oportunidad queda con el aviso "Sin evento en Agenda".',
  none: 'Al lead solo se le confirma el pago; el bot no manda nada más y el equipo sigue a mano.',
}

/** Entrega post-pago (#178): modalidad, monto comparable y links. */
export function ServiceDeliverySection({
  control,
  register,
  errors,
  moneda,
  priceAmount,
  modality,
  serviceId,
}: ServiceDeliverySectionProps) {
  const manualReview = priceAmount.trim() === '' || moneda === 'USD'
  // Narrow explícito: `ModalityChoice` incluye el centinela 'none', que no viaja.
  const agendaModality = modality === 'presencial' || modality === 'hibrido' ? modality : null

  return (
    <section className="space-y-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
      <div>
        <p className="text-sm font-semibold text-white">Entrega y validación del pago</p>
        <Hint>
          Define qué recibe el lead cuando el comprobante queda validado. No cambia lo que el bot
          ofrece durante la conversación.
        </Hint>
      </div>

      <Field label="Modalidad" htmlFor="modality">
        <SelectField
          name="modality"
          control={control}
          options={MODALITY_CHOICES}
          labels={MODALITY_LABELS}
        />
        <Hint>{MODALITY_HINTS[modality]}</Hint>
        {agendaModality !== null &&
          (serviceId ? (
            <ServiceEventsLink serviceId={serviceId} modality={agendaModality} />
          ) : (
            <Link
              href="/agenda"
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200"
            >
              <CalendarDays className="size-3" /> Las fechas y sedes se cargan en la Agenda
            </Link>
          ))}
      </Field>

      <Field label="Monto a cobrar (para comparar con el comprobante)" htmlFor="price_amount">
        <Input
          id="price_amount"
          inputMode="decimal"
          placeholder="650.00"
          {...register('price_amount', RULES.price_amount)}
          className="border-white/10 bg-white/[0.03] text-sm text-white"
        />
        <FieldError message={errors.price_amount?.message} />
        <Hint>
          Es el número que se compara contra el monto del comprobante — distinto del{' '}
          <span className="text-zinc-300">Precio (display)</span>, que es el texto que lee el lead.
          Dejalo vacío si no querés comparación automática.
        </Hint>
        {manualReview && (
          <p className="text-[11px] text-amber-300/90">
            {moneda === 'USD'
              ? 'En USD el comprobante llega en Bs: el pago se valida a mano igual.'
              : 'Sin monto cargado, cada pago de este servicio se valida a mano.'}
          </p>
        )}
      </Field>

      {serviceId ? (
        <ServiceLinksManager serviceId={serviceId} />
      ) : (
        <Hint>
          Los links de entrega se cargan después de guardar: si el servicio tiene entrega, el
          editor queda abierto para hacerlo al toque.
        </Hint>
      )}
    </section>
  )
}
