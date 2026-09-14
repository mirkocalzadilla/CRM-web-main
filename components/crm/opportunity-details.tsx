'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { leadTitle } from '@/lib/format'
import { useCard, cardKeys } from '@/hooks/use-card'
import { useBoard } from '@/hooks/use-board'
import type { Boards } from '@/lib/api/crm'
import { OpportunityHeader } from '@/components/crm/opportunity-header'
import { OpportunityHistory } from '@/components/crm/opportunity-history'
import { OpportunityEditForm } from '@/components/crm/opportunity-edit-form'
import { OpportunityDeleteDialog } from '@/components/crm/opportunity-delete-dialog'
import { ContactCreateSheet } from '@/components/crm/contacts/contact-create'
import { RatingBadge } from '@/components/crm/rating-badge'
import { AlertBadge } from '@/components/crm/alert-badge'
import { FlagBadges } from '@/components/crm/flag-badges'
import { SectionTitle } from '@/components/crm/section-title'
import { ServicesSelector } from '@/components/crm/services-selector'
import { ReceiptPanel } from '@/components/crm/receipt/receipt-panel'

function StateMessage({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-sm font-normal text-zinc-500">{text}</p>
    </div>
  )
}

/** Pipeline + stage donde vive la card, resueltos del board por `stage_id`. */
function locateStage(boards: Boards | undefined, stageId: string) {
  for (const pipeline of boards?.pipelines ?? []) {
    const stage = pipeline.stages.find((s) => s.id === stageId)
    if (stage) return { pipelineName: pipeline.name, stageName: stage.name }
  }
  return null
}

function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300">
      {children}
    </span>
  )
}

/** Columna izquierda del popup: datos + notas + historial, con edición (nombre/notas)
 *  y baja (doble confirmación) de la oportunidad (#54). */
export function OpportunityDetails({
  cardId,
  onDeleted,
}: {
  cardId: string | null
  onDeleted: () => void
}) {
  const { data: card, isLoading, isError } = useCard(cardId)
  const { data: boards } = useBoard()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)

  if (!cardId) return null
  if (isLoading) return <StateMessage text="Cargando oportunidad…" />
  if (isError || !card) return <StateMessage text="No se pudo cargar la oportunidad" />

  const location = locateStage(boards, card.stage_id)

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <OpportunityHeader
        card={card}
        editing={editing}
        onEdit={() => setEditing(true)}
        onConvertContact={() => setContactSheetOpen(true)}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RatingBadge rating={card.rating} showLabel className="px-2.5 py-0.5 text-xs" />
        <AlertBadge alert={card.alert} showLabel className="px-2.5 py-0.5 text-xs" />
        {/* Avisos de la entrega automática (server#270); el detalle está en su tooltip. */}
        <FlagBadges flags={card.flags} size="md" />
        {location && (
          <>
            <Badge>{location.pipelineName}</Badge>
            <Badge>{location.stageName}</Badge>
          </>
        )}
      </div>

      {editing ? (
        <div className="mt-5 border-t border-white/5 pt-5">
          <OpportunityEditForm
            cardId={card.id}
            initialName={card.full_name ?? ''}
            initialNotes={card.notes ?? ''}
            onDone={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <div className="mt-5 border-t border-white/5 pt-5">
            <SectionTitle>Resumen IA</SectionTitle>
            {card.ai_summary ? (
              <p className="text-sm font-normal whitespace-pre-wrap text-zinc-300">
                {card.ai_summary}
              </p>
            ) : (
              <p className="text-sm font-normal text-zinc-600">
                Sin resumen todavía. Se genera a medida que el lead avanza.
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-white/5 pt-5">
            <SectionTitle>Notas</SectionTitle>
            {card.notes ? (
              <p className="text-sm font-normal whitespace-pre-wrap text-zinc-300">{card.notes}</p>
            ) : (
              <p className="text-sm font-normal text-zinc-600">Sin notas todavía.</p>
            )}
          </div>

          <div className="mt-5 border-t border-white/5 pt-5">
            <SectionTitle>Servicios</SectionTitle>
            <ServicesSelector cardId={card.id} services={card.services} />
          </div>

          {/* Comprobante (server#272): va debajo de Servicios porque se decide
              comparando contra el precio del servicio que está justo arriba. */}
          <ReceiptPanel cardId={card.id} />

          <div className="mt-5 border-t border-white/5 pt-5">
            <SectionTitle>Historial de movimientos</SectionTitle>
            <OpportunityHistory moves={card.moves} />
          </div>

          <div className="mt-auto border-t border-white/5 pt-4">
            <OpportunityDeleteDialog
              cardId={card.id}
              cardTitle={leadTitle(card.title, card.phone)}
              onDeleted={onDeleted}
            />
          </div>
        </>
      )}

      <ContactCreateSheet
        open={contactSheetOpen}
        onOpenChange={setContactSheetOpen}
        defaultPhone={card.phone}
        defaultName={card.full_name ?? ''}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: cardKeys.detail(card.id) })
        }
      />
    </div>
  )
}
