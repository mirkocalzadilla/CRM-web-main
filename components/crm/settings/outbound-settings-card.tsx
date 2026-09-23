'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { OutboundSettingsForm } from '@/components/crm/settings/outbound-settings-form'
import { useOutboundSettings } from '@/hooks/use-outbound'

/** Config de seguimientos automáticos: carga el estado vigente y monta el form. */
export function OutboundSettingsCard() {
  const { data: settings, isLoading, isError } = useOutboundSettings()

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <Skeleton className="h-9 w-full bg-white/[0.04]" />
        <Skeleton className="h-20 w-full bg-white/[0.04]" />
      </div>
    )
  }

  if (isError || !settings) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">
        No se pudo cargar la configuración de seguimientos. Reintentá en unos segundos.
      </p>
    )
  }

  // key: los defaults del form se toman al montar; un guardado exitoso remonta con lo nuevo.
  return <OutboundSettingsForm key={settings.updated_at} settings={settings} />
}
