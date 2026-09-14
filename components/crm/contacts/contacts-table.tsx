'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatPhone } from '@/lib/format'
import type { ContactRead } from '@/lib/api/contacts'

interface ContactsTableProps {
  contacts: ContactRead[]
  selectedId: string | null
  onSelect: (contact: ContactRead) => void
}

type SortField = 'name' | 'created'
type SortDir = 'asc' | 'desc'

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}

function compare(a: ContactRead, b: ContactRead, field: SortField): number {
  if (field === 'created') return a.created_at.localeCompare(b.created_at)
  // Nombre: los "sin nombre" van al final sin importar la dirección.
  if (!a.full_name && !b.full_name) return 0
  if (!a.full_name) return 1
  if (!b.full_name) return -1
  return a.full_name.localeCompare(b.full_name, 'es')
}

function SortableHead({
  label,
  active,
  dir,
  onToggle,
}: {
  label: string
  active: boolean
  dir: SortDir
  onToggle: () => void
}) {
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TableHead className="text-zinc-400">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'inline-flex items-center gap-1.5 rounded px-1 py-0.5 -mx-1 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:outline-none',
          active && 'text-white',
        )}
      >
        {label}
        <Icon className={cn('size-3.5', active ? 'opacity-100' : 'opacity-40')} />
      </button>
    </TableHead>
  )
}

/** Tabla de contactos con orden client-side (Nombre/Alta) y affordance de apertura (#135). */
export function ContactsTable({ contacts, selectedId, onSelect }: ContactsTableProps) {
  const [sortField, setSortField] = useState<SortField>('created')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir(field === 'created' ? 'desc' : 'asc')
    }
  }

  const sorted = useMemo(() => {
    const list = [...contacts].sort((a, b) => compare(a, b, sortField))
    return sortDir === 'desc' ? list.reverse() : list
  }, [contacts, sortField, sortDir])

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02]">
      <Table className="min-w-120">
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <SortableHead
              label="Nombre"
              active={sortField === 'name'}
              dir={sortDir}
              onToggle={() => toggleSort('name')}
            />
            <TableHead className="text-zinc-400">Teléfono</TableHead>
            <SortableHead
              label="Alta"
              active={sortField === 'created'}
              dir={sortDir}
              onToggle={() => toggleSort('created')}
            />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((contact) => (
            <TableRow
              key={contact.id}
              tabIndex={0}
              onClick={() => onSelect(contact)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(contact)
                }
              }}
              className={cn(
                'group cursor-pointer border-white/5 hover:bg-white/[0.02] focus-visible:bg-white/[0.04] focus-visible:outline-none',
                selectedId === contact.id && 'bg-white/[0.04]',
              )}
            >
              <TableCell className="text-sm font-medium text-white">
                {contact.full_name ?? <span className="text-zinc-500">Sin nombre</span>}
              </TableCell>
              <TableCell className="text-sm text-zinc-300">
                {formatPhone(contact.phone)}
              </TableCell>
              <TableCell className="text-sm text-zinc-500">
                {formatDate(contact.created_at)}
              </TableCell>
              {/* Affordance: la fila abre la ficha; visible al pasar o seleccionar (#135). */}
              <TableCell className="w-10 text-right">
                <ChevronRight
                  className={cn(
                    'ml-auto size-4 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
                    selectedId === contact.id && 'opacity-100 text-violet-400',
                  )}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
