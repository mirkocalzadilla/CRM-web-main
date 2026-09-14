"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="es">
      <body className="bg-black text-white">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-bold">Algo salió mal</h1>
          <p className="text-sm text-zinc-400">
            Ocurrió un error inesperado. Intentá recargar la página.
          </p>
        </div>
      </body>
    </html>
  )
}
