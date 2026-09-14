import {
  Ban,
  CalendarX,
  CircleCheck,
  CircleHelp,
  History,
  QrCode,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

import type { CameraProblem } from '@/hooks/use-qr-scanner'
import type { RedeemResult, VerdictTone } from '@/lib/api/entries'

// Copy del veredicto de la puerta (server#278).
//
// El backend manda el `detail` **ya redactado en español** y esta pantalla lo muestra tal
// cual. Acá vive sólo el titular: dos o tres palabras que se lean a un metro de distancia
// y con poca luz, para decidir antes de leer la frase completa.

interface StatusMeta {
  headline: string
  icon: LucideIcon
}

const STATUS_META: Record<string, StatusMeta> = {
  ok: { headline: 'Pasa', icon: CircleCheck },
  legacy: { headline: 'Pasa, verificá', icon: TriangleAlert },
  already_used: { headline: 'Ya se usó', icon: History },
  wrong_event: { headline: 'Otro evento', icon: CalendarX },
  revoked: { headline: 'Entrada anulada', icon: Ban },
  not_found: { headline: 'No existe', icon: CircleHelp },
  payment_qr: { headline: 'Es el QR de pago', icon: QrCode },
}

/** Un veredicto que el front todavía no conoce igual se muestra: el titular sale de
 *  `admitted`, que es lo único que hace falta para dejar pasar o no, y el `detail` del
 *  backend explica el resto. Esconderlo sería peor que mostrarlo sin titular propio. */
export function statusMeta(result: RedeemResult): StatusMeta {
  const known = STATUS_META[result.status]
  if (known) return known
  return result.admitted
    ? { headline: 'Pasa', icon: CircleCheck }
    : { headline: 'No pasa', icon: CircleHelp }
}

interface ToneClasses {
  /** Fondo del panel del veredicto. */
  panel: string
  /** Color del titular y del ícono. */
  text: string
  /** Borde del cuadro de la cámara mientras el veredicto está en pantalla. */
  ring: string
}

const TONE_CLASSES: Record<VerdictTone, ToneClasses> = {
  pass: {
    panel: 'border-emerald-500/40 bg-emerald-950/80',
    text: 'text-emerald-300',
    ring: 'ring-emerald-500/60',
  },
  warn: {
    panel: 'border-amber-500/40 bg-amber-950/80',
    text: 'text-amber-300',
    ring: 'ring-amber-500/60',
  },
  reject: {
    panel: 'border-rose-500/40 bg-rose-950/85',
    text: 'text-rose-300',
    ring: 'ring-rose-500/60',
  },
}

export function toneClasses(tone: VerdictTone): ToneClasses {
  return TONE_CLASSES[tone]
}

interface ProblemCopy {
  title: string
  hint: string
}

const PROBLEM_COPY: Record<CameraProblem, ProblemCopy> = {
  denied: {
    title: 'La cámara está bloqueada',
    hint: 'Tocá el candado de la barra de direcciones, habilitá la cámara para este sitio y volvé a intentar. Mientras tanto podés admitir por la lista de asistencia.',
  },
  missing: {
    title: 'No encontramos una cámara',
    hint: 'Este dispositivo no tiene cámara disponible. Usá la lista de asistencia para admitir por nombre.',
  },
  busy: {
    title: 'La cámara está ocupada',
    hint: 'Otra aplicación la está usando. Cerrala y volvé a intentar, o admití por la lista de asistencia.',
  },
  insecure: {
    title: 'La cámara necesita una conexión segura',
    hint: 'Abrí el CRM por https para poder escanear. Por ahora, admití por la lista de asistencia.',
  },
  unknown: {
    title: 'No pudimos abrir la cámara',
    hint: 'Volvé a intentar. Si sigue sin abrir, admití por la lista de asistencia — nadie que pagó se queda afuera por un problema técnico.',
  },
}

export function problemCopy(problem: CameraProblem): ProblemCopy {
  return PROBLEM_COPY[problem]
}
