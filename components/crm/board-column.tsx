'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'
import type { Stage } from '@/lib/api/crm'
import { BoardCard } from '@/components/crm/board-card'

interface BoardColumnProps {
  stage: Stage
  selectedCardId: string | null
  draggedCardId: string | null
  onSelectCard: (cardId: string) => void
  onDragStart: (cardId: string) => void
  onDragEnd: () => void
  onDropCard: (stageId: string) => void
}

/** Columna = stage del pipeline; drop target para mover cards. */
export function BoardColumn({
  stage,
  selectedCardId,
  draggedCardId,
  onSelectCard,
  onDragStart,
  onDragEnd,
  onDropCard,
}: BoardColumnProps) {
  const [isOver, setIsOver] = useState(false)

  const handleDrop = () => {
    setIsOver(false)
    if (draggedCardId) onDropCard(stage.id)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-white/[0.03] to-white/0 transition-colors',
        isOver ? 'border-violet-500/50' : 'border-white/5',
      )}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-violet-400" />
          <h3 className="truncate text-sm font-bold text-white">{stage.name}</h3>
        </div>
        <span className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-xs font-normal text-zinc-400">
          {stage.cards.length}
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {stage.cards.map((card) => (
          <BoardCard
            key={card.id}
            card={card}
            selected={selectedCardId === card.id}
            dragging={draggedCardId === card.id}
            onSelect={onSelectCard}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {stage.cards.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-xs font-normal text-zinc-500">Sin leads</p>
          </div>
        )}
      </div>
    </div>
  )
}
