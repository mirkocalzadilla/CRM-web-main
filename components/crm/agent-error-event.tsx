'use client'

import { TriangleAlert } from 'lucide-react'

import type { ThreadMessage } from '@/lib/api/crm'

// Copy de los códigos de falla del agente (server#288). Un código desconocido se
// muestra crudo: nunca rompe el hilo.
const ERROR_CATEGORY_LABELS: Record<string, string> = {
  auth: 'credenciales del proveedor de IA inválidas',
  rate_limit: 'límite de uso del proveedor de IA',
  bad_request: 'solicitud rechazada por el proveedor de IA (configuración)',
  provider: 'proveedor de IA caído',
  network: 'sin conexión con el proveedor de IA',
  internal: 'error interno del sistema',
  delivery: 'falló el envío por WhatsApp',
}

function formatTime(at: string): string {
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

/** Evento de error del agente en el hilo: chip centrado (no es una burbuja de chat).
 *  El texto viene del backend; el motivo se traduce acá desde el código `category`. */
export function AgentErrorEvent({ message }: { message: ThreadMessage }) {
  const reason = message.category
    ? (ERROR_CATEGORY_LABELS[message.category] ?? message.category)
    : null
  const time = formatTime(message.at)

  return (
    <div className="flex justify-center" role="status">
      <div className="max-w-[min(85%,26rem)] rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-amber-300">
          <TriangleAlert className="size-3.5 shrink-0" />
          <span>{message.text}</span>
        </p>
        {reason && (
          <p className="mt-0.5 text-[11px] font-normal text-amber-400/80">Motivo: {reason}</p>
        )}
        {time && <p className="mt-1 text-[10px] font-normal text-zinc-600">{time}</p>}
      </div>
    </div>
  )
}
