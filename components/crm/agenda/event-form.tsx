'use client'

import { Controller, type Control } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { eventStatuses } from '@/components/crm/agenda/labels'
import { useServices } from '@/hooks/use-catalogo'

export interface FormValues {
  service_id: string
  nombre: string
  /** `datetime-local`: `YYYY-MM-DDTHH:mm` en hora del navegador. */
  starts_at: string
  location: string
  maps_url: string
  /** Vacío = sin límite de cupo. */
  capacity: string
  status: string
}

const NOMBRE_MAX = 120
const LOCATION_MAX = 300
const CAPACITY_MAX = 100000

const inputClasses = 'border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-600'

function Error({ message }: { message?: string }) {
  return message ? <p className="text-xs text-rose-400">{message}</p> : null
}

interface EventFieldsProps {
  control: Control<FormValues>
  /** El servicio no se cambia al editar: las entradas emitidas ya apuntan a él. */
  lockService: boolean
}

export function EventFields({ control, lockService }: EventFieldsProps) {
  const { data: services } = useServices()
  const options = (services ?? []).filter((s) => s.is_active)

  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name="service_id"
        rules={{ required: 'Elegí a qué servicio pertenece.' }}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Servicio</Label>
            <Select value={field.value} onValueChange={field.onChange} disabled={lockService}>
              <SelectTrigger className={inputClasses}>
                <SelectValue placeholder="Elegí el servicio" />
              </SelectTrigger>
              <SelectContent>
                {options.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lockService && (
              <p className="text-xs text-zinc-500">
                No se cambia: las entradas ya emitidas apuntan a este servicio.
              </p>
            )}
            <Error message={fieldState.error?.message} />
          </div>
        )}
      />

      <Controller
        control={control}
        name="nombre"
        rules={{
          required: 'Requerido.',
          maxLength: { value: NOMBRE_MAX, message: `Máx. ${NOMBRE_MAX} caracteres.` },
        }}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Nombre del evento</Label>
            <Input {...field} placeholder="Curso CapCut Pro · edición septiembre" className={inputClasses} />
            <Error message={fieldState.error?.message} />
          </div>
        )}
      />

      <Controller
        control={control}
        name="starts_at"
        rules={{ required: 'Requerido.' }}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Fecha y hora de inicio</Label>
            <Input {...field} type="datetime-local" className={inputClasses} />
            <p className="text-xs text-zinc-500">Se le manda tal cual a quien compra la entrada.</p>
            <Error message={fieldState.error?.message} />
          </div>
        )}
      />

      <Controller
        control={control}
        name="location"
        rules={{ maxLength: { value: LOCATION_MAX, message: `Máx. ${LOCATION_MAX} caracteres.` } }}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Lugar</Label>
            <Input {...field} placeholder="Av. Banzer 3er anillo, Santa Cruz" className={inputClasses} />
            <Error message={fieldState.error?.message} />
          </div>
        )}
      />

      <Controller
        control={control}
        name="maps_url"
        rules={{
          validate: (value: string) =>
            value.trim() === '' ||
            value.startsWith('http://') ||
            value.startsWith('https://') ||
            'Tiene que empezar con http:// o https://',
        }}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Link de ubicación (opcional)</Label>
            <Input {...field} placeholder="https://maps.app.goo.gl/…" className={inputClasses} />
            <p className="text-xs text-zinc-500">Si lo cargás, pisa el del servicio.</p>
            <Error message={fieldState.error?.message} />
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="capacity"
          rules={{
            validate: (value: string) => {
              if (value.trim() === '') return true
              const n = Number(value)
              if (!Number.isInteger(n) || n <= 0) return 'Un número entero mayor a 0.'
              return n <= CAPACITY_MAX || `Máx. ${CAPACITY_MAX}.`
            },
          }}
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Cupo</Label>
              <Input {...field} inputMode="numeric" placeholder="Sin límite" className={inputClasses} />
              <p className="text-xs text-zinc-500">Vacío = sin tope.</p>
              <Error message={fieldState.error?.message} />
            </div>
          )}
        />

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Estado</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={inputClasses}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500">“En curso” es el que se entrega ahora.</p>
            </div>
          )}
        />
      </div>
    </div>
  )
}
