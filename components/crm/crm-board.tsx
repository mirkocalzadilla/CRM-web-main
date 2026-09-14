'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Plus, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { digitsOnly } from '@/lib/validation/fields'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useBoard } from '@/hooks/use-board'
import { attentionInPipeline } from '@/lib/crm/attention'
import { useMoveCard } from '@/hooks/use-card-mutations'
import { PipelineBoard } from '@/components/crm/pipeline-board'
import { BoardLegend } from '@/components/crm/board-legend'
import { BoardSkeleton, CenteredMessage } from '@/components/crm/board-states'
import { CardDetailDialog } from '@/components/crm/card-detail-dialog'
import { LeadsExportMenu } from '@/components/crm/leads-export-menu'
import { OpportunityCreateSheet } from '@/components/crm/opportunity-create'
import {
  WinNameDialog,
  pendingWinFor,
  type PendingWin,
} from '@/components/crm/win-name-dialog'
import {
  DisqualifyReasonDialog,
  pendingDisqualifyFor,
  type PendingDisqualify,
} from '@/components/crm/disqualify-reason-dialog'
import type { Card, Pipeline } from '@/lib/api/crm'

/** Una card matchea si el texto está en el nombre (title) o los dígitos en el teléfono
 *  (coincidencia parcial: tolera el prefijo de país del número guardado). */
function cardMatches(card: Card, q: string, qDigits: string): boolean {
  if (card.title.toLowerCase().includes(q)) return true
  return qDigits.length > 0 && digitsOnly(card.phone).includes(qDigits)
}

/** Pipeline con las cards de cada stage filtradas por la búsqueda. */
function filterPipeline(pipeline: Pipeline, q: string, qDigits: string): Pipeline {
  return {
    ...pipeline,
    stages: pipeline.stages.map((stage) => ({
      ...stage,
      cards: stage.cards.filter((card) => cardMatches(card, q, qDigits)),
    })),
  }
}

function cardCount(pipeline: Pipeline): number {
  return pipeline.stages.reduce((n, s) => n + s.cards.length, 0)
}

// Cards que esperan a una persona (avisos de entrega, error del agente, sin responder).
// El mismo criterio que la pantalla "Requiere atención": un solo lugar decide qué cuenta
// como trabajo humano, así el tab y el menú nunca muestran números distintos.

/** Tablero CRM real: tabs por pipeline (Gestión Venta + Gestión Postventa) + panel
 *  del hilo. Los nombres llegan del backend: acá no se compara por string. */
export function CrmBoard() {
  const { data, isLoading, isError } = useBoard()
  const moveCard = useMoveCard()
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingWin, setPendingWin] = useState<PendingWin | null>(null)
  const [pendingDisqualify, setPendingDisqualify] = useState<PendingDisqualify | null>(null)
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const q = query.trim().toLowerCase()
  const qDigits = digitsOnly(query)
  const pipelines = useMemo(() => {
    const sorted = [...(data?.pipelines ?? [])].sort((a, b) => a.position - b.position)
    return sorted.map((p) => {
      const filtered = q ? filterPipeline(p, q, qDigits) : p
      return {
        ...filtered,
        stages: filtered.stages.map((stage) => {
          const sortedCards = [...stage.cards].sort((a, b) => {
            const timeA = new Date(a.created_at).getTime()
            const timeB = new Date(b.created_at).getTime()
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
          })
          return { ...stage, cards: sortedCards }
        }),
      }
    })
  }, [data, q, qDigits, sortOrder])
  const activeId = activePipelineId ?? pipelines[0]?.id ?? ''

  const handleMove = (cardId: string, stageId: string) => {
    // Ganar exige nombre (#162): sin nombre se abre el dialog en vez de mover.
    const pending = pendingWinFor(data, cardId, stageId)
    if (pending) {
      setPendingWin(pending)
      return
    }
    // Descalificar exige motivo (web#173): al soltar en un stage 'lost' se pide el motivo.
    const disqualify = pendingDisqualifyFor(data, cardId, stageId)
    if (disqualify) {
      setPendingDisqualify(disqualify)
      return
    }
    moveCard.mutate({ cardId, stageId })
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="flex h-full w-full flex-col overflow-hidden p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Oportunidades activas</h2>
            <p className="mt-0.5 text-xs font-normal text-zinc-500">
              Arrastrá las tarjetas entre columnas para actualizar el estado.
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <BoardLegend />
            {/* w-72: que el placeholder entre completo sin truncarse (#133). */}
            <div className="relative w-72">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-600" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nombre o número…"
                className="h-10 rounded-full border-white/10 bg-white/[0.03] pl-9 text-sm font-normal text-white placeholder:text-zinc-500"
              />
            </div>
            <LeadsExportMenu className="h-10 flex-shrink-0 rounded-full px-4 text-sm font-medium" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 flex-shrink-0 gap-1.5 rounded-full border-white/10 px-4 text-sm font-medium hover:bg-white/10",
                    sortOrder === 'asc'
                      ? "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border-violet-500/50"
                      : "bg-white/[0.03] text-white"
                  )}
                >
                  <ArrowUpDown className="size-4" />
                  Ordenar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-white/10 text-zinc-300">
                <DropdownMenuLabel>Ordenar mensajes</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuRadioGroup value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                  <DropdownMenuRadioItem value="desc" className="focus:bg-white/5 focus:text-white">
                    Más recientes primero
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="asc" className="focus:bg-white/5 focus:text-white">
                    Más antiguos primero
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-10 flex-shrink-0 gap-1.5 rounded-full bg-gradient-to-b from-violet-500 to-violet-700 px-4 text-sm font-medium text-white hover:from-violet-400 hover:to-violet-600"
            >
              <Plus className="size-4" />
              Nueva oportunidad
            </Button>
          </div>
        </div>

        {isLoading ? (
          <BoardSkeleton />
        ) : isError ? (
          <CenteredMessage text="No se pudo cargar el tablero. Reintentá en unos segundos." />
        ) : pipelines.length === 0 ? (
          <CenteredMessage text="Todavía no hay pipelines configurados." />
        ) : (
          <Tabs
            value={activeId}
            onValueChange={setActivePipelineId}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="w-fit border border-white/5 bg-white/[0.03]">
              {pipelines.map((pipeline) => {
                const count = cardCount(pipeline)
                const attention = attentionInPipeline(pipeline)
                // El pipeline humano con leads = derivados sin atender → señal de alerta.
                const alert = pipeline.kind === 'human' && count > 0
                return (
                  <TabsTrigger
                    key={pipeline.id}
                    value={pipeline.id}
                    className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                  >
                    {pipeline.name}
                    {count > 0 && (
                      <span
                        className={cn(
                          'ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                          alert ? 'bg-fuchsia-500 text-white' : 'bg-white/10 text-zinc-400',
                        )}
                      >
                        {count}
                      </span>
                    )}
                    {attention > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            aria-label={`${attention} requieren atención`}
                            className="ml-1 inline-flex h-5 min-w-5 items-center justify-center gap-1 rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white"
                          >
                            <span className="size-1.5 rounded-full bg-white" />
                            {attention}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {attention} {attention === 1 ? 'requiere' : 'requieren'} atención
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {pipelines.map((pipeline) => (
              <TabsContent
                key={pipeline.id}
                value={pipeline.id}
                className="mt-4 min-h-0 flex-1"
              >
                {q && cardCount(pipeline) === 0 ? (
                  <CenteredMessage text="Sin resultados para tu búsqueda." />
                ) : (
                  <PipelineBoard
                    pipeline={pipeline}
                    selectedCardId={selectedCardId}
                    onSelectCard={setSelectedCardId}
                    onMoveCard={handleMove}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      <CardDetailDialog
        cardId={selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />
      <OpportunityCreateSheet open={createOpen} onOpenChange={setCreateOpen} />
      <WinNameDialog pending={pendingWin} onClose={() => setPendingWin(null)} />
      <DisqualifyReasonDialog
        pending={pendingDisqualify}
        onClose={() => setPendingDisqualify(null)}
      />
    </div>
  )
}
