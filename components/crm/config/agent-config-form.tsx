'use client'

import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AgentFormHeader } from '@/components/crm/config/agent-form-header'
import { useAgentModels, useUpdateAgentConfig } from '@/hooks/use-agent-config'
import type { AgentRead, AgentUpdate } from '@/lib/api/agent-config'

interface FormValues {
  display_name: string
  system_prompt: string
  model: string
  temperature: number
  emojis: boolean
}

/** Editor del agente. Modelo = dropdown del catálogo (#60); temperatura = slider 0–1;
 *  emojis = switch on/off (#61). Servicios/FAQ/Resumen salen del Catálogo (#62), no del form.
 *  `config` se reemplaza completo en el server: lo reconstruimos desde el `config` cargado
 *  para preservar las keys que el form no maneja (p. ej. `services`, server-owned). */
export function AgentConfigForm({ agent }: { agent: AgentRead }) {
  const mutation = useUpdateAgentConfig(agent.id)
  const { data: models } = useAgentModels()
  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      display_name: agent.display_name,
      system_prompt: agent.system_prompt,
      model: agent.model,
      temperature: typeof agent.config.temperature === 'number' ? agent.config.temperature : 0.7,
      emojis: agent.config.emojis === true,
    },
  })
  const { dirtyFields, isDirty } = formState
  // Contador del prompt: re-renderiza solo por este campo (no watch() global).
  const promptValue = useWatch({ control, name: 'system_prompt' })
  // El modelo elegido puede no aceptar `temperature` (server#288): se anota, el backend la omite.
  const modelValue = useWatch({ control, name: 'model' })
  const temperatureUnsupported =
    (models ?? []).find((m) => m.id === modelValue)?.supports_temperature === false

  // Red de seguridad ante cerrar/recargar la pestaña con cambios sin guardar (#136).
  // La navegación interna (App Router) no dispara beforeunload: el chip visible cubre eso.
  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // El modelo guardado podría no estar en el catálogo (valor viejo): lo agregamos
  // para que el dropdown lo muestre en vez de quedar vacío.
  const options = models ?? []
  const modelOptions = options.some((m) => m.id === agent.model)
    ? options
    : [{ id: agent.model, label: agent.model }, ...options]

  const onSubmit = (values: FormValues) => {
    const body: AgentUpdate = {}
    if (dirtyFields.display_name) body.display_name = values.display_name.trim()
    if (dirtyFields.system_prompt) body.system_prompt = values.system_prompt
    if (dirtyFields.model) body.model = values.model

    if (dirtyFields.temperature || dirtyFields.emojis) {
      // Spread preserves keys the form doesn't expose (e.g. services, server-owned);
      // los nodos manuales viejos se quitan del payload (el server igual los descarta).
      const config: Record<string, unknown> = { ...agent.config }
      delete config.ofertas
      delete config.faq
      delete config.resumen
      if (dirtyFields.temperature) config.temperature = values.temperature
      if (dirtyFields.emojis) config.emojis = values.emojis
      body.config = config
    }

    if (Object.keys(body).length === 0) return toast.info('No hay cambios para guardar.')
    mutation.mutate(body)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <AgentFormHeader
        title={agent.display_name}
        version={agent.current_version?.version_number ?? null}
        isDirty={isDirty}
        isSaving={mutation.isPending}
      />

      <Field label="Nombre del agente" htmlFor="display_name">
        <Input
          id="display_name"
          {...register('display_name')}
          className="border-white/10 bg-white/[0.03] text-sm text-white"
        />
      </Field>

      <Field label="System prompt" htmlFor="system_prompt">
        {/* Alto generoso + resize manual: editar un prompt largo sin pelear con el scroll (#136). */}
        <Textarea
          id="system_prompt"
          rows={18}
          {...register('system_prompt')}
          className="min-h-72 resize-y border-white/10 bg-white/[0.03] font-mono text-sm text-white"
        />
        <p className="text-right text-xs text-zinc-500">
          {promptValue.length.toLocaleString('es-BO')} caracteres
        </p>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Modelo" htmlFor="model">
          <Controller
            control={control}
            name="model"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="model"
                  className="w-full border-white/10 bg-white/[0.03] text-sm text-white"
                >
                  <SelectValue placeholder="Elegí un modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Controller
          control={control}
          name="temperature"
          render={({ field }) => (
            <Field label={`Temperatura: ${field.value.toFixed(2)}`} htmlFor="temperature">
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.01}
                value={[field.value]}
                onValueChange={(v) => field.onChange(v[0])}
                className="py-3"
              />
              {temperatureUnsupported && (
                <p className="text-xs text-amber-400">
                  Este modelo no acepta temperatura: el valor se guarda pero no se envía al
                  proveedor.
                </p>
              )}
            </Field>
          )}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="space-y-1">
          <Label htmlFor="emojis" className="text-sm font-medium text-white">
            Emojis
          </Label>
          <p className="text-xs text-zinc-500">El agente usa emojis en sus respuestas.</p>
        </div>
        <Controller
          control={control}
          name="emojis"
          render={({ field }) => (
            <Switch id="emojis" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-zinc-400">
        {label}
      </Label>
      {children}
    </div>
  )
}
