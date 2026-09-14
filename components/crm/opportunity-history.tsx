'use client'

import { ArrowRight } from 'lucide-react'

import type { CardMove } from '@/lib/api/crm'

const FALLBACK_COLOR = '#a1a1aa' // zinc-400: stage sin color en stage_status

function formatWhen(at: string): string {
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Actores no humanos de `card_move.moved_by`: 'agent' = reconcile del bot en su pipeline;
// 'system' = entrega y cierre automáticos post-pago (server#270). Cualquier otro valor es
// el id de un operador.
const ACTORS: Record<string, string> = {
  agent: 'Agente IA',
  system: 'Sistema',
}

function movedByLabel(movedBy: string): string {
  return ACTORS[movedBy] ?? 'Operador'
}

function MoveRow({ move }: { move: CardMove }) {
  const color = move.stage_to_color ?? FALLBACK_COLOR
  const isCreation = move.stage_from_name === null
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span
        className="mt-1 size-2.5 flex-shrink-0 rounded-full ring-2 ring-black"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-white">
          {isCreation ? (
            <span>{move.stage_to_name}</span>
          ) : (
            <>
              <span className="text-zinc-400">{move.stage_from_name}</span>
              <ArrowRight className="size-3 flex-shrink-0 text-zinc-600" />
              <span>{move.stage_to_name}</span>
            </>
          )}
        </div>
        <p className="mt-0.5 text-xs font-normal text-zinc-500">
          {isCreation ? 'Creada' : movedByLabel(move.moved_by)} · {formatWhen(move.moved_at)}
        </p>
        {/* Motivo del move (server#253); ausente en moves viejos y syncs del bot. */}
        {move.reason && (
          <p className="mt-1 text-xs font-normal text-zinc-400">{move.reason}</p>
        )}
      </div>
    </li>
  )
}

/** Traceability del lead: pasos cronológicos entre stages (de → a, quién, cuándo). */
export function OpportunityHistory({ moves }: { moves: CardMove[] }) {
  if (moves.length === 0) {
    return (
      <p className="text-sm font-normal text-zinc-600">
        Todavía no hay movimientos registrados.
      </p>
    )
  }

  return (
    <ol className="relative ml-1 border-l border-white/5 pl-4">
      {moves.map((move, idx) => (
        <MoveRow key={`${move.moved_at}-${idx}`} move={move} />
      ))}
    </ol>
  )
}
