'use client'

import { useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateOutboundSettings } from '@/hooks/use-outbound'
import {
  NOVELTY_MAX,
  type OutboundSettings,
  type OutboundSettingsUpdate,
  type ReactivationRule,
} from '@/lib/api/outbound'

interface FormValues {
  reactivation_enabled: boolean
  novelty_text: string
  reactivation_daily_cap: number
  reactivation_recontact_days: number
  warm_days: number
  cold_days: number
}

const WARM_STAGES = ['engaging', 'qualified']
const COLD_STAGES = ['new']

function ruleDays(rules: ReactivationRule[], stages: string[], fallback: number): number {
  const rule = rules.find((r) => stages.every((s) => r.stages.includes(s)))
  return rule?.days ?? fallback
}

const inputClass = 'border-white/10 bg-white/[0.03] text-sm text-white'
const labelClass = 'text-xs font-medium text-zinc-400'

/** Reglas de reactivación de leads fríos (M-Outbound D). La novedad del mes es el
 *  texto variable de la plantilla `reactivacion_leads`: sin ella no sale nada. */
export function OutboundSettingsForm({ settings }: { settings: OutboundSettings }) {
  const update = useUpdateOutboundSettings()
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      reactivation_enabled: settings.reactivation_enabled,
      novelty_text: settings.novelty_text,
      reactivation_daily_cap: settings.reactivation_daily_cap,
      reactivation_recontact_days: settings.reactivation_recontact_days,
      warm_days: ruleDays(settings.reactivation_rules, WARM_STAGES, 7),
      cold_days: ruleDays(settings.reactivation_rules, COLD_STAGES, 14),
    },
  })
  const enabled = useWatch({ control, name: 'reactivation_enabled' })
  const novelty = useWatch({ control, name: 'novelty_text' })

  const onSubmit = handleSubmit((form) => {
    const body: OutboundSettingsUpdate = {
      reactivation_enabled: form.reactivation_enabled,
      novelty_text: form.novelty_text.trim(),
      reactivation_daily_cap: Number(form.reactivation_daily_cap),
      reactivation_recontact_days: Number(form.reactivation_recontact_days),
      reactivation_rules: [
        { stages: WARM_STAGES, days: Number(form.warm_days) },
        { stages: COLD_STAGES, days: Number(form.cold_days) },
      ],
    }
    update.mutate(body)
  })

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="reactivation_enabled" className="text-sm text-white">
            Reactivación automática de leads
          </Label>
          <p className="text-[11px] text-zinc-500">
            Cada día, dentro del horario permitido, se escribe a los leads que dejaron de responder.
            Meta cobra cada mensaje de este tipo.
          </p>
        </div>
        <Switch
          id="reactivation_enabled"
          checked={enabled}
          onCheckedChange={(v) => setValue('reactivation_enabled', v, { shouldDirty: true })}
          className="data-[state=checked]:bg-violet-600"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="novelty_text" className={labelClass}>
          Novedad del mes
        </Label>
        <Textarea
          id="novelty_text"
          rows={3}
          maxLength={NOVELTY_MAX}
          placeholder="abrimos nuevas fechas del taller de CapCut en octubre"
          {...register('novelty_text', {
            validate: (v) => !enabled || v.trim().length > 0 || 'Con la reactivación activa hace falta la novedad.',
          })}
          className={inputClass}
        />
        {errors.novelty_text ? (
          <p className="text-[11px] text-rose-400">{errors.novelty_text.message}</p>
        ) : (
          <p className="text-[11px] text-zinc-500">
            Va dentro del mensaje: &quot;…quería contarte que{' '}
            <span className="text-zinc-300">{novelty.trim() || '[novedad]'}</span>. Si te interesa,
            respondé este mensaje…&quot;. {novelty.length}/{NOVELTY_MAX}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="warm_days" className={labelClass}>
            Leads en Enganchando o Calificado: días sin responder
          </Label>
          <Input id="warm_days" type="number" min={1} max={365} {...register('warm_days')} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cold_days" className={labelClass}>
            Leads en Nuevo: días sin responder
          </Label>
          <Input id="cold_days" type="number" min={1} max={365} {...register('cold_days')} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reactivation_daily_cap" className={labelClass}>
            Tope de mensajes por día
          </Label>
          <Input
            id="reactivation_daily_cap"
            type="number"
            min={1}
            max={2000}
            {...register('reactivation_daily_cap')}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reactivation_recontact_days" className={labelClass}>
            No volver a escribir al mismo lead por (días)
          </Label>
          <Input
            id="reactivation_recontact_days"
            type="number"
            min={1}
            max={365}
            {...register('reactivation_recontact_days')}
            className={inputClass}
          />
        </div>
      </div>

      <p className="text-[11px] text-zinc-500">
        Nunca se escribe a quien pidió la baja, a oportunidades cerradas ni a conversaciones que
        está atendiendo una persona. Horario de envío: 07:00 a 22:00, hora de Bolivia.
      </p>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || update.isPending}
          className="bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {update.isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
