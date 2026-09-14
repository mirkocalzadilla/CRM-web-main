'use client'

import { useState } from 'react'

import type { Pipeline } from '@/lib/api/crm'
import { BoardColumn } from '@/components/crm/board-column'

interface PipelineBoardProps {
  pipeline: Pipeline
  selectedCardId: string | null
  onSelectCard: (cardId: string) => void
  onMoveCard: (cardId: string, stageId: string) => void
}

function stageOfCard(pipeline: Pipeline, cardId: string): string | null {
  for (const stage of pipeline.stages) {
    if (stage.cards.some((c) => c.id === cardId)) return stage.id
  }
  return null
}

/** Columnas (stages) de un pipeline; gestiona el drag local y delega el move. */
export function PipelineBoard({
  pipeline,
  selectedCardId,
  onSelectCard,
  onMoveCard,
}: PipelineBoardProps) {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)

  const stages = [...pipeline.stages].sort((a, b) => a.position - b.position)

  const handleDrop = (stageId: string) => {
    if (draggedCardId && stageOfCard(pipeline, draggedCardId) !== stageId) {
      onMoveCard(draggedCardId, stageId)
    }
    setDraggedCardId(null)
  }

  return (
    <div className="flex h-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:snap-none">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className="flex w-[80vw] max-w-xs flex-shrink-0 snap-start flex-col sm:w-72 lg:w-auto lg:min-w-68 lg:flex-1"
        >
          <BoardColumn
            stage={stage}
            selectedCardId={selectedCardId}
            draggedCardId={draggedCardId}
            onSelectCard={onSelectCard}
            onDragStart={setDraggedCardId}
            onDragEnd={() => setDraggedCardId(null)}
            onDropCard={handleDrop}
          />
        </div>
      ))}
    </div>
  )
}
