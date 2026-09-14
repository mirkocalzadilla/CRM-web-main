'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { classifyChangePasswordError, useChangePassword } from '@/hooks/use-change-password'

const formSchema = z
  .object({
    current_password: z.string().min(1, 'Contraseña actual requerida'),
    new_password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
    confirm_password: z.string().min(1, 'Confirmá la nueva contraseña'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof formSchema>

const DEFAULTS: FormValues = { current_password: '', new_password: '', confirm_password: '' }

/** "Mi cuenta" → cambiar la propia contraseña. Disponible para cualquier usuario logueado. */
export function ChangePasswordForm() {
  const mutation = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: DEFAULTS })

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      { current_password: values.current_password, new_password: values.new_password },
      {
        onSuccess: () => {
          toast.success('Contraseña actualizada.')
          reset(DEFAULTS)
        },
        onError: (error) => {
          const classified = classifyChangePasswordError(error)
          if (classified.kind === 'current_password') {
            setError('current_password', { message: classified.message })
            return
          }
          toast.error(classified.message)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5">
      <Field label="Contraseña actual" htmlFor="current_password" error={errors.current_password?.message}>
        <PasswordInput
          id="current_password"
          autoComplete="current-password"
          {...register('current_password')}
          className="border-white/10 bg-white/[0.03] text-sm text-white"
        />
      </Field>

      <Field label="Nueva contraseña" htmlFor="new_password" error={errors.new_password?.message}>
        <PasswordInput
          id="new_password"
          autoComplete="new-password"
          {...register('new_password')}
          className="border-white/10 bg-white/[0.03] text-sm text-white"
        />
        {/* Requisito visible antes del primer error (#139). */}
        <p className="text-xs text-zinc-600">Mínimo 8 caracteres.</p>
      </Field>

      <Field
        label="Confirmar nueva contraseña"
        htmlFor="confirm_password"
        error={errors.confirm_password?.message}
      >
        <PasswordInput
          id="confirm_password"
          autoComplete="new-password"
          {...register('confirm_password')}
          className="border-white/10 bg-white/[0.03] text-sm text-white"
        />
      </Field>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="h-10 gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 px-5 text-sm font-medium text-white hover:from-violet-400 hover:to-violet-600 disabled:opacity-50"
      >
        {mutation.isPending ? 'Guardando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-zinc-400">
        {label}
      </Label>
      {children}
      {error ? <p className={cn('text-xs text-fuchsia-400')}>{error}</p> : null}
    </div>
  )
}
