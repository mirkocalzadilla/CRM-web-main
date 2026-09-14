'use client'

import { BotOff, GripVertical, MessageSquare } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatPhone, formatTicketTime, isUnnamedLead, leadTitle } from '@/lib/format'
import type { Card } from '@/lib/api/crm'
import { RatingBadge } from '@/components/crm/rating-badge'
import { AlertBadge } from '@/components/crm/alert-badge'
import { FlagBadges } from '@/components/crm/flag-badges'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface BoardCardProps {
  card: Card
  selected: boolean
  dragging: boolean
  onSelect: (cardId: string) => void
  onDragStart: (cardId: string) => void
  onDragEnd: () => void
}

/** Tarjeta de lead arrastrable; click/Enter abre el detalle. Muestra nombre real o
 *  teléfono formateado (#140) — nunca el wa_id crudo. */
export function BoardCard({
  card,
  selected,
  dragging,
  onSelect,
  onDragStart,
  onDragEnd,
}: BoardCardProps) {
  const unnamed = isUnnamedLead(card.title, card.phone)
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={() => onDragStart(card.id)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(card.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(card.id)
        }
      }}
      className={cn(
        'group cursor-pointer rounded-xl border bg-zinc-950/80 p-3.5 transition-all focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:outline-none',
        selected
          ? 'border-violet-500/60 bg-violet-950/20 shadow-[0_0_25px_-10px_rgba(139,92,246,0.6)]'
          : card.awaiting_human
            ? // Sin responder: anillo rosa para que salte a la vista aunque no esté seleccionada.
              'border-rose-500/50 bg-rose-950/10 hover:border-rose-500/70'
            : 'border-white/5 hover:border-violet-500/30 hover:bg-white/[0.03]',
        dragging && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-3.5 cursor-grab text-zinc-700 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <p className="truncate text-sm font-bold text-white">
              {leadTitle(card.title, card.phone)}
            </p>
            <div className="flex flex-shrink-0 items-center gap-1">
              {/* IA apagada (takeover): la card la atiende un humano, no el agente. */}
              {!card.is_ai_active && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      aria-label="Agente IA apagado — atendés vos"
                      className="inline-flex items-center rounded-full border border-zinc-600/40 bg-zinc-500/10 p-0.5 text-zinc-400"
                    >
                      <BotOff className="size-3 shrink-0" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Agente IA apagado — atendés vos</TooltipContent>
                </Tooltip>
              )}
              <AlertBadge alert={card.alert} />
              <RatingBadge rating={card.rating} />
            </div>
          </div>
          {/* Con nombre real, el teléfono va de línea secundaria; sin nombre ya es el título. */}
          {card.phone && !unnamed && (
            <p className="mb-1.5 truncate text-xs font-normal text-zinc-500">
              {formatPhone(card.phone)}
            </p>
          )}
          {/* Avisos de la entrega en fila propia con wrap: varios a la vez bajan de línea
              en vez de apretar el título (server#270). */}
          {card.flags.length > 0 && (
            <div className="mb-1.5 flex flex-wrap items-center gap-1">
              <FlagBadges flags={card.flags} />
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            {card.awaiting_human ? (
              // Señal fuerte: hay un mensaje del lead sin responder y la IA está apagada.
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-400">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                </span>
                <span>Sin responder · te esperan</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <MessageSquare className="size-2.5" />
                <span className="font-normal">Ver conversación</span>
              </div>
            )}
            <span className="text-[10px] font-medium text-zinc-500/70">{formatTicketTime(card.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
