'use client'

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { CategorySelect } from '@/components/crm/catalog/category-select'
import {
  CountedField,
  Field,
  FieldError,
  FormSection,
  Hint,
  LIMITS,
  RULES,
  formInputClasses,
  type FormValues,
} from '@/components/crm/catalog/service-form'
import { cn } from '@/lib/utils'

interface ServiceIdentitySectionProps {
  control: Control<FormValues>
  register: UseFormRegister<FormValues>
  errors: FieldErrors<FormValues>
  nombre: string
  isEdit: boolean
  /** Slug persistido; solo en edición, donde se muestra como meta y no se toca. */
  slug: string | null
  /** El operador escribió el slug a mano: se corta la autogeneración desde el nombre. */
  onSlugInput: () => void
}

/** Qué es el servicio: nombre, identificador, categoría y el switch de activo. */
export function ServiceIdentitySection({
  control,
  register,
  errors,
  nombre,
  isEdit,
  slug,
  onSlugInput,
}: ServiceIdentitySectionProps) {
  return (
    <FormSection title="Identidad">
      <CountedField label="Nombre" htmlFor="nombre" value={nombre} max={LIMITS.nombre}>
        <Input
          id="nombre"
          maxLength={LIMITS.nombre}
          placeholder="Curso de edición"
          autoFocus={!isEdit}
          {...register('nombre', RULES.nombre)}
          className={formInputClasses}
        />
        <FieldError message={errors.nombre?.message} />
      </CountedField>

      {isEdit ? (
        <Hint>
          Identificador: <span className="font-mono text-zinc-400">{slug}</span> (no se edita: el
          bot y las entradas emitidas lo referencian).
        </Hint>
      ) : (
        <Field label="Identificador (se genera del nombre)" htmlFor="slug">
          <Input
            id="slug"
            maxLength={LIMITS.slug}
            placeholder="curso-edicion"
            {...register('slug', { ...RULES.slug, onChange: onSlugInput })}
            className={cn(formInputClasses, 'font-mono')}
          />
          {errors.slug ? (
            <FieldError message={errors.slug.message} />
          ) : (
            <Hint>Podés ajustarlo: minúsculas, números y guiones. Después no se cambia.</Hint>
          )}
        </Field>
      )}

      <Field label="Categoría" htmlFor="category_id">
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => <CategorySelect value={field.value} onChange={field.onChange} />}
        />
        <Hint>Agrupa el catálogo y aporta los materiales (PDF) que manda el bot.</Hint>
      </Field>

      {isEdit && (
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <div>
                <p className="text-sm text-zinc-300">Servicio activo</p>
                <Hint>Apagado, el bot deja de ofrecerlo al instante.</Hint>
              </div>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      )}
    </FormSection>
  )
}
