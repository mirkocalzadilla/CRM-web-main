'use client'

import {
  BadgeDollarSign,
  BotOff,
  CalendarOff,
  Clock,
  Layers,
  Link2Off,
  MessageSquareWarning,
  PackageX,
  ReceiptText,
  ScanEye,
  SearchX,
  TriangleAlert,
  UserPen,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface FlagConfig {
  /** Texto visible del pill: corto, para que dos o tres avisos entren en una card. */
  label: string
  /** Qué pasó y qué hacer, en el tooltip. */
  hint: string
  icon: LucideIcon
  /** Rosa para lo que dejó a alguien esperando una respuesta; ámbar (default) para lo
   *  que trabó la entrega. Mismo criterio de color que la card del tablero. */
  tone?: 'amber' | 'rose'
}

// Avisos operativos de la entrega automática (server#270). El backend manda códigos y
// el copy en español vive acá: agregar un aviso nuevo no toca la DB.
const FLAGS: Record<string, FlagConfig> = {
  needs_name: {
    label: 'Falta el nombre',
    hint: 'Se entregó, pero falta el nombre del lead para poder cerrar la oportunidad.',
    icon: UserPen,
  },
  delivery_pending: {
    label: 'Entrega pendiente',
    hint: 'La ventana de 24 h de WhatsApp está cerrada: la entrega se reintenta cuando el lead vuelva a escribir.',
    icon: Clock,
  },
  extra_receipt: {
    label: 'Comprobante extra',
    hint: 'Llegó otro comprobante con el pago ya procesado: revisá si hubo un pago doble.',
    icon: ReceiptText,
  },
  no_modality: {
    label: 'Sin modalidad',
    hint: 'El servicio no tiene modalidad cargada, así que no se sabe qué entregar.',
    icon: PackageX,
  },
  missing_link: {
    label: 'Falta un link',
    hint: 'Falta un link de entrega (por ejemplo, un curso virtual sin grupo ni reunión).',
    icon: Link2Off,
  },
  ambiguous_service: {
    label: 'Más de un servicio',
    hint: 'La oportunidad tiene más de un servicio aceptado: revisá cuál corresponde entregar.',
    icon: Layers,
  },
  // Validación del comprobante por visión (server#272).
  receipt_review: {
    label: 'Revisar comprobante',
    hint: 'El comprobante que mandó el lead no pasó las verificaciones automáticas: mirá el panel del comprobante en la card y decidí.',
    icon: ScanEye,
  },
  payment_unconfirmed: {
    label: 'Pago por confirmar',
    hint: 'El pago se aprobó solo y todavía falta confirmarlo contra el banco.',
    icon: BadgeDollarSign,
  },
  // Eventos y cupo (server#276 / server#290). El lead ya recibió la confirmación del pago;
  // lo que falta es la fecha a la que da acceso la entrada.
  no_event: {
    label: 'Sin evento en Agenda',
    hint: 'El servicio es presencial o híbrido pero no tiene ninguna fecha próxima cargada en Agenda. Creá el evento y la entrada sale sola.',
    icon: CalendarOff,
  },
  capacity_full: {
    label: 'Cupo lleno',
    hint: 'El evento llegó a su cupo, así que no se emitió la entrada. Ampliá el cupo o cargá otra fecha en Agenda y la entrega se reintenta sola.',
    icon: Users,
  },
  // Motivos que no viven en `flags` sino en el estado de la card (`alert`,
  // `awaiting_human`). El copy está acá para que la cola de atención los muestre con el
  // mismo pill que los avisos: para quien atiende, todos son lo mismo — algo que mirar.
  agent_error: {
    label: 'Error del agente',
    hint: 'El agente IA no pudo responder (proveedor caído o mal configurado) y derivó la conversación. Contestá vos y reactivá la IA cuando se recupere.',
    icon: BotOff,
    tone: 'rose',
  },
  unknown_service: {
    label: 'Servicio desconocido',
    hint: 'El lead pidió algo que no figura en el catálogo. Respondé vos o cargá el servicio si corresponde.',
    icon: SearchX,
    tone: 'rose',
  },
  awaiting_human: {
    label: 'Sin responder',
    hint: 'La IA está apagada y el lead escribió sin que nadie le contestara.',
    icon: MessageSquareWarning,
    tone: 'rose',
  },
}

/** Un código que el front todavía no conoce (backend más nuevo) se muestra crudo en vez
 *  de desaparecer: es un aviso real y esconderlo es peor que mostrarlo sin traducir. */
function flagConfig(code: string): FlagConfig {
  return (
    FLAGS[code] ?? {
      label: code,
      hint: 'Aviso nuevo del sistema: revisá la oportunidad a mano.',
      icon: TriangleAlert,
    }
  )
}

const PILL = 'inline-flex items-center gap-1 rounded-full border font-medium'

const TONE = {
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  rose: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
} as const

function FlagPill({ code, size }: { code: string; size: 'sm' | 'md' }) {
  const { label, hint, icon: Icon, tone } = flagConfig(code)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            PILL,
            TONE[tone ?? 'amber'],
            size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
          )}
        >
          <Icon className="size-3 shrink-0" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{hint}</TooltipContent>
    </Tooltip>
  )
}

/** Avisos de la card (`flags`, server#270): qué quedó a medias en la entrega automática.
 *  Devuelve los pills sueltos — el contenedor (y su wrap) lo pone quien los usa, así la
 *  card angosta y la fila del detalle los acomodan distinto sin romperse. */
export function FlagBadges({
  flags,
  size = 'sm',
}: {
  flags: string[]
  size?: 'sm' | 'md'
}) {
  return (
    <>
      {flags.map((code, idx) => (
        <FlagPill key={`${code}-${idx}`} code={code} size={size} />
      ))}
    </>
  )
}
