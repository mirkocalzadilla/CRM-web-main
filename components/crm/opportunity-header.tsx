'use client'

import { Pencil, Phone, User, UserCheck, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPhone, isUnnamedLead, leadTitle } from '@/lib/format'
import type { CardDetail } from '@/lib/api/crm'

interface OpportunityHeaderProps {
  card: CardDetail
  editing: boolean
  onEdit: () => void
  onConvertContact: () => void
}

/** Cabecera del detalle: avatar + identidad del lead + acción de editar (#134).
 *  Sin nombre propio, el título cae al nombre del contacto vinculado antes que al
 *  teléfono (server#222 lo resuelve en la API; esto cubre respuestas previas).
 *  Sin nombre en ningún lado: ícono de persona en vez de inicial (#140). */
export function OpportunityHeader({
  card,
  editing,
  onEdit,
  onConvertContact,
}: OpportunityHeaderProps) {
  const contactName = card.contact?.full_name ?? null
  const untitled = isUnnamedLead(card.title, card.phone)
  const displayTitle =
    untitled && contactName ? contactName : leadTitle(card.title, card.phone)
  const unnamed = untitled && !contactName

  return (
    <div className="flex items-start gap-3">
      <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base font-bold text-white">
        {unnamed ? <User className="size-5" /> : displayTitle.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-white">{displayTitle}</p>
        {card.phone && !unnamed && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-zinc-500">
            <Phone className="size-3 flex-shrink-0" />
            {formatPhone(card.phone)}
          </p>
        )}
        {card.phone &&
          (card.contact ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <UserCheck className="size-3 flex-shrink-0" />
              Ya es contacto
              {card.contact.full_name ? ` · ${card.contact.full_name}` : ''}
            </p>
          ) : (
            <button
              type="button"
              onClick={onConvertContact}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
            >
              <UserPlus className="size-3 flex-shrink-0" />
              Convertir en contacto
            </button>
          ))}
      </div>
      {!editing && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar nombre y notas"
              onClick={onEdit}
              className="size-8 flex-shrink-0 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white"
            >
              <Pencil className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar nombre y notas</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
