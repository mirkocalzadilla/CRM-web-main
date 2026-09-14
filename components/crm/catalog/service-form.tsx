'use client'

import { Controller, type Control } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MODALITY_NONE, type ModalityChoice } from '@/components/crm/catalog/labels'
import type { ServiceClosing, ServiceCurrency, ServiceRead } from '@/lib/api/catalogo'

export interface FormValues {
  slug: string
  nombre: string
  category_id: string
  resumen: string
  detalle: string
  precio: string
  moneda: ServiceCurrency
  flujo_cierre: ServiceClosing
  is_active: boolean
  /** Modalidad de entrega post-pago; el centinela 'none' viaja como null (#178). */
  modality: ModalityChoice
  /** Monto comparable con el comprobante; '' viaja como null (#178). */
  price_amount: string
}

// Límites alineados con la validación server-side (#107).
export const LIMITS = { nombre: 50, slug: 40, resumen: 200, detalle: 300 } as const
const PRECIO_MAX = 100000

export const RULES = {
  slug: {
    required: 'Requerido.',
    maxLength: { value: LIMITS.slug, message: `Máx. ${LIMITS.slug} caracteres.` },
    pattern: {
      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      message: 'Minúsculas, números y guiones (ej. curso-edicion).',
    },
  },
  nombre: {
    required: 'Requerido.',
    maxLength: { value: LIMITS.nombre, message: `Máx. ${LIMITS.nombre} caracteres.` },
  },
  resumen: {
    required: 'Requerido.',
    maxLength: { value: LIMITS.resumen, message: `Máx. ${LIMITS.resumen} caracteres.` },
  },
  detalle: {
    maxLength: { value: LIMITS.detalle, message: `Máx. ${LIMITS.detalle} caracteres.` },
  },
  precio: {
    required: 'Requerido.',
    pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Solo números, hasta 2 decimales.' },
    validate: (v: string) => Number(v) <= PRECIO_MAX || `Máx. ${PRECIO_MAX}.`,
  },
  // Monto estructurado: opcional (vacío = validación manual del pago), > 0, 2 decimales.
  price_amount: {
    validate: (v: string) => {
      const cleaned = v.trim()
      if (cleaned === '') return true
      if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return 'Solo números, hasta 2 decimales.'
      const amount = Number(cleaned)
      if (amount <= 0) return 'El monto debe ser mayor a 0.'
      return amount <= PRECIO_MAX || `Máx. ${PRECIO_MAX}.`
    },
  },
} as const

export function serviceDefaults(service: ServiceRead | null): FormValues {
  return {
    slug: service?.slug ?? '',
    nombre: service?.nombre ?? '',
    category_id: service?.category_id ?? '',
    resumen: service?.resumen ?? '',
    detalle: service?.detalle ?? '',
    precio: service?.precio ?? '',
    moneda: (service?.moneda as ServiceCurrency) ?? 'BOB',
    flujo_cierre: (service?.flujo_cierre as ServiceClosing) ?? 'pago_qr',
    is_active: service?.is_active ?? true,
    modality: service?.modality ?? MODALITY_NONE,
    price_amount: service?.price_amount ?? '',
  }
}

/** Slug legible desde el nombre: sin tildes, minúsculas y guiones (mismo patrón que
 *  valida `RULES.slug`). Se corta en el límite sin dejar guión colgando. */
export function slugify(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITS.slug)
    .replace(/-+$/g, '')
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[11px] text-rose-400">{message}</p>
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-zinc-500">{children}</p>
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-zinc-400">
        {label}
      </Label>
      {children}
    </div>
  )
}

/** Cuántos caracteres van; en ámbar al llegar al tope, que el input ya no deja pasar. */
export function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span
      className={cn(
        'text-[11px] tabular-nums',
        value.length >= max ? 'text-amber-300/90' : 'text-zinc-600',
      )}
    >
      {value.length}/{max}
    </span>
  )
}

/** Campo con contador de caracteres en la línea del label. */
export function CountedField({
  label,
  htmlFor,
  value,
  max,
  children,
}: {
  label: string
  htmlFor: string
  value: string
  max: number
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-xs font-medium text-zinc-400">
          {label}
        </Label>
        <Counter value={value} max={max} />
      </div>
      {children}
    </div>
  )
}

/** Grupo visual del form: las ~10 preguntas en bloques con propósito, en vez de una
 *  columna corrida donde identidad, conversación y entrega se leían como lo mismo. */
export function FormSection({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        {hint && <Hint>{hint}</Hint>}
      </div>
      {children}
    </section>
  )
}

export const formInputClasses = 'border-white/10 bg-white/[0.03] text-sm text-white'

interface SelectFieldProps<T extends string> {
  name: 'moneda' | 'flujo_cierre' | 'modality'
  control: Control<FormValues>
  options: readonly T[]
  labels: Record<T, string>
}

export function SelectField<T extends string>({ name, control, options, labels }: SelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger className="w-full border-white/10 bg-white/[0.03] text-sm text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {labels[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}
