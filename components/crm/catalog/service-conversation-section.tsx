'use client'

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CLOSING_LABELS, CURRENCY_LABELS } from '@/components/crm/catalog/labels'
import {
  CountedField,
  Field,
  FieldError,
  FormSection,
  Hint,
  LIMITS,
  RULES,
  SelectField,
  formInputClasses,
  type FormValues,
} from '@/components/crm/catalog/service-form'
import { serviceClosings, serviceCurrencies } from '@/lib/api/catalogo'

interface ServiceConversationSectionProps {
  control: Control<FormValues>
  register: UseFormRegister<FormValues>
  errors: FieldErrors<FormValues>
  resumen: string
  detalle: string
}

/** Con qué vende el bot: resumen, detalle, precio display, moneda y cierre. */
export function ServiceConversationSection({
  control,
  register,
  errors,
  resumen,
  detalle,
}: ServiceConversationSectionProps) {
  return (
    <FormSection
      title="Conversación de venta"
      hint="Con esto el bot ofrece el servicio; la vista previa muestra cómo lo lee el lead."
    >
      <CountedField
        label="Resumen (1–2 líneas, lo que dice el bot)"
        htmlFor="resumen"
        value={resumen}
        max={LIMITS.resumen}
      >
        <Textarea
          id="resumen"
          rows={3}
          maxLength={LIMITS.resumen}
          {...register('resumen', RULES.resumen)}
          className={formInputClasses}
        />
        <FieldError message={errors.resumen?.message} />
      </CountedField>

      <CountedField
        label="Detalle (opcional, para despejar dudas)"
        htmlFor="detalle"
        value={detalle}
        max={LIMITS.detalle}
      >
        <Textarea
          id="detalle"
          rows={3}
          maxLength={LIMITS.detalle}
          {...register('detalle', RULES.detalle)}
          className={formInputClasses}
        />
        <FieldError message={errors.detalle?.message} />
      </CountedField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Precio (display, lo que lee el lead)" htmlFor="precio">
          <Input
            id="precio"
            inputMode="decimal"
            placeholder="650"
            {...register('precio', RULES.precio)}
            className={formInputClasses}
          />
          {errors.precio ? (
            <FieldError message={errors.precio.message} />
          ) : (
            <Hint>Texto que el bot le dice al lead.</Hint>
          )}
        </Field>
        <Field label="Moneda" htmlFor="moneda">
          <SelectField
            name="moneda"
            control={control}
            options={serviceCurrencies}
            labels={CURRENCY_LABELS}
          />
        </Field>
      </div>

      <Field label="Cierre de la venta" htmlFor="flujo_cierre">
        <SelectField
          name="flujo_cierre"
          control={control}
          options={serviceClosings}
          labels={CLOSING_LABELS}
        />
        <Hint>
          Pago con QR: el bot cobra y entrega solo · Derivar a humano: el bot junta el interés y lo
          pasa al equipo.
        </Hint>
      </Field>
    </FormSection>
  )
}
