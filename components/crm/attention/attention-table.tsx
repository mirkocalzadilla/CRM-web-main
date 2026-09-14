'use client'

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AttentionItem } from '@/lib/crm/attention'
import { AttentionRow } from '@/components/crm/attention/attention-row'

const COLUMNS: readonly string[] = [
  'Lead',
  'Qué pasó',
  'Dónde quedó',
  'Última actividad',
]

interface AttentionTableProps {
  items: AttentionItem[]
  onOpenCard: (cardId: string) => void
}

/** Cola de atención. El orden viene de `collectAttention`: primero lo que no avanza sin
 *  una persona, y dentro de cada grupo lo que lleva más tiempo quieto. No se reordena acá. */
export function AttentionTable({ items, onOpenCard }: AttentionTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            {COLUMNS.map((column) => (
              <TableHead key={column} className="whitespace-nowrap text-zinc-400">
                {column}
              </TableHead>
            ))}
            <TableHead className="text-right text-zinc-400">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <AttentionRow key={item.card.id} item={item} onOpenCard={onOpenCard} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
