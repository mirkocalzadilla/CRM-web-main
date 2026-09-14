'use client'

import { useForm } from 'react-hook-form'

import { PaymentQrField } from '@/components/crm/settings/payment-qr-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdatePaymentSettings } from '@/hooks/use-payment-settings'
import {
  BENEFICIARY_MAX,
  type PaymentSettingsRead,
  type PaymentSettingsUpdate,
} from '@/lib/api/payment-settings'

interface FormValues {
  expected_beneficiary: string
}

/** Beneficiario esperado + QR de pago de la organización (#178).
 *
 *  El QR queda fuera del `<form>` a propósito: es un archivo que se sube y se borra
 *  con su propia llamada, y meterlo adentro haría que "Guardar cambios" pareciera
 *  aplicarle algo. */
export function PaymentSettingsForm({ settings }: { settings: PaymentSettingsRead }) {
  const update = useUpdatePaymentSettings()
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<FormValues>({
    defaultValues: { expected_beneficiary: settings.expected_beneficiary ?? '' },
  })

  const onSubmit = handleSubmit((form) => {
    if (!dirtyFields.expected_beneficiary) return
    const body: PaymentSettingsUpdate = {
      expected_beneficiary: form.expected_beneficiary.trim() || null,
    }
    update.mutate(body)
  })

  return (
    <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="expected_beneficiary" className="text-xs font-medium text-zinc-400">
            Beneficiario esperado
          </Label>
          <Input
            id="expected_beneficiary"
            maxLength={BENEFICIARY_MAX}
            placeholder="Mirko Calzadilla"
            {...register('expected_beneficiary', {
              maxLength: { value: BENEFICIARY_MAX, message: `Máx. ${BENEFICIARY_MAX} caracteres.` },
            })}
            className="border-white/10 bg-white/[0.03] text-sm text-white"
          />
          {errors.expected_beneficiary ? (
            <p className="text-[11px] text-rose-400">{errors.expected_beneficiary.message}</p>
          ) : (
            <p className="text-[11px] text-zinc-500">
              Nombre que debería figurar como destinatario en el comprobante. El matching es
              tolerante y, si no coincide, el pago{' '}
              <span className="text-zinc-300">no se rechaza</span>: queda para revisión humana.
              Vacío = no se compara el destinatario.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={update.isPending || !isDirty}
          className="bg-gradient-to-b from-violet-500 to-violet-700 text-white"
        >
          {update.isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>

      <div className="border-t border-white/5 pt-5">
        <PaymentQrField settings={settings} />
      </div>
    </div>
  )
}
