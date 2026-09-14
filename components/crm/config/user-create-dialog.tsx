'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_META } from '@/components/crm/config/role-meta'
import { RoleSelectItems } from '@/components/crm/config/role-select-items'
import { useCreateUser } from '@/hooks/use-users'
import { apiErrorMessage } from '@/lib/api/errors'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().max(255).optional(),
  role: z.enum(['client_admin', 'staff']),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
})

type FormValues = z.infer<typeof formSchema>

const DEFAULTS: FormValues = { email: '', full_name: '', role: 'staff', password: '' }

/** Alta de usuario en el tenant activo (platform_operator o client_admin, #126). Email duplicado (422) → error inline. */
export function UserCreateDialog() {
  const mutation = useCreateUser()
  const [open, setOpen] = useState(false)
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: DEFAULTS })

  function close(next: boolean) {
    setOpen(next)
    if (!next) reset(DEFAULTS)
  }

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      {
        email: values.email,
        password: values.password,
        full_name: values.full_name?.trim() || undefined,
        role: values.role,
      },
      {
        onSuccess: (user) => {
          toast.success(`Usuario ${user.email} creado`)
          close(false)
        },
        onError: (error) => {
          if (isAxiosError(error) && error.response?.status === 422) {
            setError('email', {
              message: apiErrorMessage(error) ?? 'Ya existe un usuario con ese email.',
            })
            return
          }
          toast.error(apiErrorMessage(error) ?? 'No se pudo crear el usuario.')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button className="h-9 gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-sm font-medium text-white hover:from-violet-400 hover:to-violet-600">
          <UserPlus className="size-4" />
          Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Nuevo usuario</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Se crea en este tenant con el rol elegido. Podrá ingresar con el email y la contraseña
            inicial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              {...register('email')}
              className="border-white/10 bg-white/[0.03] text-sm text-white"
            />
          </Field>

          <Field label="Nombre (opcional)" htmlFor="full_name" error={errors.full_name?.message}>
            <Input
              id="full_name"
              {...register('full_name')}
              className="border-white/10 bg-white/[0.03] text-sm text-white"
            />
          </Field>

          <Field label="Rol" htmlFor="role" error={errors.role?.message}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="role"
                    className="border-white/10 bg-white/[0.03] text-sm text-white"
                  >
                    {/* Children fijos: sin esto el trigger renderizaría también la descripción. */}
                    <SelectValue>{ROLE_META[field.value].label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-zinc-950 text-white">
                    <RoleSelectItems />
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Contraseña inicial" htmlFor="password" error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              {...register('password')}
              className="border-white/10 bg-white/[0.03] text-sm text-white"
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => close(false)}
              className="text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-gradient-to-b from-violet-500 to-violet-700 text-white hover:from-violet-400 hover:to-violet-600 disabled:opacity-50"
            >
              {mutation.isPending ? 'Creando…' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
      {error ? <p className="text-xs text-fuchsia-400">{error}</p> : null}
    </div>
  )
}
