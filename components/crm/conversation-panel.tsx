'use client'

import { Fragment, useState, type DragEvent } from 'react'
import { Bot, MessageSquare, QrCode, User, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { formatThreadDay, isUnnamedLead, leadTitle, sameCalendarDay } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCard } from '@/hooks/use-card'
import { useBoard } from '@/hooks/use-board'
import { useGenerateEntry, useSetAiActive } from '@/hooks/use-card-mutations'
import { usePermissions } from '@/hooks/use-permissions'
import { ConversationMessage } from '@/components/crm/conversation-message'
import {
  composerFileError,
  ConversationComposer,
} from '@/components/crm/conversation-composer'

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="px-6 text-center">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
          <MessageSquare className="size-6 text-zinc-700" />
        </div>
        <p className="text-sm font-normal text-zinc-500">{text}</p>
      </div>
    </div>
  )
}

/** Panel derecho: hilo espejo + toggle IA + input humano (takeover). */
export function ConversationPanel({
  cardId,
  onClose,
}: {
  cardId: string | null
  onClose?: () => void
}) {
  const { data: card, isLoading, isError } = useCard(cardId)
  const { data: boards } = useBoard()
  const { canOperateCrm } = usePermissions()
  const setAiActive = useSetAiActive(cardId ?? '')
  const generateEntryMutation = useGenerateEntry(cardId ?? '')
  // Keyed por card: un adjunto pendiente de otra conversación no se arrastra a esta.
  const [attachment, setAttachment] = useState<{ cardId: string; file: File } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  if (!cardId) return <EmptyState text="Seleccioná un lead para ver la conversación" />
  if (isLoading) return <EmptyState text="Cargando conversación…" />
  if (isError || !card) return <EmptyState text="No se pudo cargar la conversación" />

  const stageName =
    boards?.pipelines.flatMap((p) => p.stages).find((s) => s.id === card.stage_id)?.name ?? ''
  const showGenerateEntry = stageName === 'Pago validado' && !card.is_ai_active
  // Composer humano: solo en takeover (is_ai_active=false) y con permiso (#169).
  const canReply = !card.is_ai_active && canOperateCrm

  const handleToggle = (next: boolean) => {
    setAiActive.mutate({ conversationId: card.conversation_id, isAiActive: next })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    const error = composerFileError(dropped)
    if (error) {
      toast.error(error)
      return
    }
    setAttachment({ cardId, file: dropped })
  }

  return (
    <>
      <div className="border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
            {isUnnamedLead(card.title, card.phone) ? (
              <User className="size-4" />
            ) : (
              card.title.charAt(0).toUpperCase()
            )}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">
            {leadTitle(card.title, card.phone)}
          </p>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar conversación"
              onClick={onClose}
              className="size-8 flex-shrink-0 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Drop zone (#169): arrastrar un archivo sobre el hilo lo carga en el composer. */}
      <div
        className={cn(
          'flex-1 space-y-3 overflow-y-auto p-4',
          dragOver && 'bg-violet-500/5 outline-2 -outline-offset-2 outline-dashed outline-violet-500/60',
        )}
        onDragOver={canReply ? (e) => { e.preventDefault(); setDragOver(true) } : undefined}
        onDragLeave={
          canReply
            ? (e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false)
              }
            : undefined
        }
        onDrop={canReply ? handleDrop : undefined}
      >
        {card.thread.length === 0 ? (
          <p className="pt-8 text-center text-xs font-normal text-zinc-600">
            Sin mensajes todavía
          </p>
        ) : (
          card.thread.map((message, idx) => {
            const prev = idx > 0 ? card.thread[idx - 1] : null
            // Separador "Hoy / Ayer / 1 jul" al cambiar de día (#134).
            const newDay = !prev || !sameCalendarDay(prev.at, message.at)
            return (
              <Fragment key={`${message.at}-${idx}`}>
                {newDay && (
                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-white/5" />
                    <span className="rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium text-zinc-500">
                      {formatThreadDay(message.at)}
                    </span>
                    <span className="h-px flex-1 bg-white/5" />
                  </div>
                )}
                <ConversationMessage message={message} />
              </Fragment>
            )
          })
        )}
      </div>

      <div className="space-y-3 border-t border-white/5 p-4">
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Bot
              className={cn(
                'size-4 flex-shrink-0',
                card.is_ai_active ? 'text-violet-400' : 'text-zinc-600',
              )}
            />
            <Label
              htmlFor="ai-active"
              className="cursor-pointer truncate text-xs font-normal text-zinc-300"
            >
              {/* Label según estado: qué está pasando ahora, no solo el nombre del switch (#134). */}
              {card.is_ai_active ? (
                <>
                  Agente IA <span className="text-zinc-500">(responde por vos)</span>
                </>
              ) : (
                <>
                  Agente IA apagado <span className="text-zinc-500">(respondés vos)</span>
                </>
              )}
            </Label>
          </div>
          <Switch
            id="ai-active"
            checked={card.is_ai_active}
            onCheckedChange={handleToggle}
            disabled={!canOperateCrm || setAiActive.isPending}
            className="data-[state=checked]:bg-violet-600"
          />
        </div>

        {showGenerateEntry && (
          <Button
            onClick={() => generateEntryMutation.mutate()}
            disabled={generateEntryMutation.isPending}
            className="h-10 w-full gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-sm font-medium text-white hover:from-violet-400 hover:to-violet-600 disabled:opacity-60"
          >
            <QrCode className="size-4 flex-shrink-0" />
            {generateEntryMutation.isPending ? 'Generando…' : 'Generar entrada'}
          </Button>
        )}

        {canReply && (
          <ConversationComposer
            key={cardId} // resetea el texto al cambiar de conversación
            cardId={cardId}
            file={attachment?.cardId === cardId ? attachment.file : null}
            onFileChange={(file) => setAttachment(file ? { cardId, file } : null)}
          />
        )}
      </div>
    </>
  )
}
