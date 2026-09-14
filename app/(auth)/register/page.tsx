'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import {
  register as registerApi,
  registerRequestSchema,
  type RegisterPayload,
} from '@/lib/api/auth'
import { me } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth-store'

interface FieldErrors {
  email?: string
  password?: string
  full_name?: string
  tenant_name?: string
  tenant_slug?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const setToken = useAuthStore((s) => s.setToken)
  const setSession = useAuthStore((s) => s.setSession)

  const [form, setForm] = useState<RegisterPayload>({
    email: '',
    password: '',
    full_name: '',
    tenant_name: '',
    tenant_slug: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const tokenRes = await registerApi(payload)
      setToken(tokenRes.access_token)
      const session = await me()
      setSession(session)
      return session
    },
    onSuccess: () => {
      toast.success('Cuenta creada. ¡Bienvenido!')
      router.push('/')
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err) ?? 'No se pudo crear la cuenta'
      toast.error(message)
    },
  })

  const handleChange = (key: keyof RegisterPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: RegisterPayload = {
      ...form,
      full_name: form.full_name?.trim() ? form.full_name : undefined,
    }
    const parsed = registerRequestSchema.safeParse(payload)
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]
        if (typeof path === 'string') {
          fieldErrors[path as keyof FieldErrors] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    mutation.mutate(parsed.data)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al login
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Crear cuenta</h1>
        <p className="text-zinc-500 text-sm mb-10">
          Serás el administrador de tu workspace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormField
            id="full_name"
            label="Nombre completo (opcional)"
            value={form.full_name ?? ''}
            onChange={(v) => handleChange('full_name', v)}
            error={errors.full_name}
            placeholder="Mirko Calzadilla"
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => handleChange('email', v)}
            error={errors.email}
            placeholder="tu@email.com"
          />
          <FormField
            id="password"
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(v) => handleChange('password', v)}
            error={errors.password}
            placeholder="Mínimo 8 caracteres"
          />
          <FormField
            id="tenant_name"
            label="Nombre del workspace"
            value={form.tenant_name}
            onChange={(v) => handleChange('tenant_name', v)}
            error={errors.tenant_name}
            placeholder="Mirko Studio"
          />
          <FormField
            id="tenant_slug"
            label="Slug del workspace"
            value={form.tenant_slug}
            onChange={(v) => handleChange('tenant_slug', v.toLowerCase())}
            error={errors.tenant_slug}
            placeholder="mirko-studio"
          />

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-12 bg-gradient-to-b from-violet-500 to-violet-700 hover:from-violet-400 hover:to-violet-600 text-white font-bold rounded-full shadow-[0_0_30px_-8px_rgba(139,92,246,0.7)] transition-all disabled:opacity-60"
          >
            {mutation.isPending ? 'Creando…' : 'Crear cuenta'}
          </Button>
        </form>
      </div>
    </div>
  )
}

interface FormFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  error?: string
  placeholder?: string
}

function FormField({ id, label, value, onChange, type = 'text', error, placeholder }: FormFieldProps) {
  const fieldClassName =
    'bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 h-11 text-white placeholder:text-zinc-700 focus:border-violet-500 focus-visible:ring-0 focus-visible:ring-offset-0 font-normal'
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-zinc-500 text-xs font-normal tracking-widest uppercase">
        {label}
      </Label>
      {type === 'password' ? (
        <PasswordInput
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className={fieldClassName}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldClassName}
        />
      )}
      {error ? <p className="text-xs text-fuchsia-400">{error}</p> : null}
    </div>
  )
}

function extractErrorMessage(err: unknown): string | null {
  if (err instanceof AxiosError) {
    const data = err.response?.data
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return null
}
