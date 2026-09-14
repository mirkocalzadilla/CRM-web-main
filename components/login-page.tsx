"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
  login as loginApi,
  loginRequestSchema,
  me,
  type LoginPayload,
} from "@/lib/api/auth"
import { useAuthStore } from "@/store/auth-store"

interface LoginPageProps {
  onLogin: () => void
  onBack?: () => void
}

interface FieldErrors {
  email?: string
  password?: string
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const setToken = useAuthStore((s) => s.setToken)
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const tokenRes = await loginApi(payload)
      setToken(tokenRes.access_token)
      const session = await me()
      setSession(session)
      return session
    },
    onSuccess: () => {
      onLogin()
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err) ?? "Credenciales inválidas"
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = loginRequestSchema.safeParse({ email, password })
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]
        if (path === "email" || path === "password") {
          fieldErrors[path] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    mutation.mutate(parsed.data)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Brand panel */}
      <div className="relative md:w-1/2 min-h-[40vh] md:min-h-screen flex items-end p-8 md:p-14 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-violet-900/40 to-black" />
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-600/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-fuchsia-700/20 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-blue-700/15 rounded-full blur-[100px]" />
        </div>

        <div className="absolute top-8 left-8 md:top-14 md:left-14 z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-white/80 font-bold text-xs tracking-[0.2em]">MIRKO • CRM</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.05] mb-5 text-balance">
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">CRM</span>{" "}
            que trabaja
            <br />
            contigo
          </h2>
          <p className="text-zinc-400 font-normal leading-relaxed text-sm md:text-base text-pretty">
            Tu agente IA atiende los leads de WhatsApp, los califica y los mueve por el pipeline.
            Tú intervienes solo cuando hace falta.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-14 bg-black relative">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-white font-bold text-xs tracking-[0.2em]">MIRKO • CRM</span>
          </div>

          <div className="hidden md:flex items-center gap-2 mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-white font-bold text-xs tracking-[0.2em]">MIRKO • CRM</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Bienvenido de vuelta</h1>
          <p className="text-zinc-500 font-normal text-sm mb-10">
            Ingresa para gestionar tus oportunidades y conversaciones.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-500 text-xs font-normal tracking-widest uppercase">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border border-zinc-800 rounded-lg px-3 h-11 text-white placeholder:text-zinc-700 focus:border-violet-500 focus-visible:ring-0 focus-visible:ring-offset-0 font-normal"
                placeholder="tu@email.com"
                autoComplete="email"
              />
              {errors.email ? <p className="text-xs text-fuchsia-400">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-500 text-xs font-normal tracking-widest uppercase">
                Contraseña
              </Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border border-zinc-800 rounded-lg px-3 h-11 text-white placeholder:text-zinc-700 focus:border-violet-500 focus-visible:ring-0 focus-visible:ring-offset-0 font-normal"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password ? <p className="text-xs text-fuchsia-400">{errors.password}</p> : null}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/register"
                className="text-zinc-500 hover:text-violet-400 text-sm font-normal transition-colors"
              >
                Crear cuenta
              </Link>
              <button
                type="button"
                className="text-zinc-500 hover:text-violet-400 text-sm font-normal transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full h-12 bg-gradient-to-b from-violet-500 to-violet-700 hover:from-violet-400 hover:to-violet-600 text-white font-bold rounded-full shadow-[0_0_30px_-8px_rgba(139,92,246,0.7)] transition-all disabled:opacity-60"
            >
              {mutation.isPending ? "Ingresando…" : "Iniciar sesión"}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-900" />
            <span className="text-zinc-700 text-xs font-normal">o</span>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white text-sm font-normal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la landing
          </button>
        </div>
      </div>
    </div>
  )
}

function extractErrorMessage(err: unknown): string | null {
  if (err instanceof AxiosError) {
    const data = err.response?.data
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail: unknown }).detail
      if (typeof detail === "string") return detail
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return null
}
