'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { PaymentSettingsForm } from '@/components/crm/settings/payment-settings-form'
import { usePaymentSettings } from '@/hooks/use-payment-settings'

/** Config de pagos de la organización: carga el estado vigente y monta el form. */
export function PaymentSettingsCard() {
  const { data: settings, isLoading, isError } = usePaymentSettings()

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <Skeleton className="h-9 w-full bg-white/[0.04]" />
        <Skeleton className="h-9 w-full bg-white/[0.04]" />
      </div>
    )
  }

  if (isError || !settings) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">
        No se pudo cargar la config de pagos. Reintentá en unos segundos.
      </p>
    )
  }

  // key: los defaults del form se toman al montar; un refetch con datos nuevos remonta.
  // Solo el beneficiario entra: el QR es un archivo con estado propio y remontar por
  // cada subida le borraría al operador lo que estuviera tipeando.
  return <PaymentSettingsForm key={settings.expected_beneficiary ?? ''} settings={settings} />
}
