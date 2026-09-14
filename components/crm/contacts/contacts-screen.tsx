'use client'

import { useMemo, useState } from 'react'
import { Plus, Users } from 'lucide-react'

import { ContactCreateSheet } from '@/components/crm/contacts/contact-create'
import { ContactDetail } from '@/components/crm/contacts/contact-detail'
import { ContactsTable } from '@/components/crm/contacts/contacts-table'
import { ContactsExportButton } from '@/components/crm/leads-export-menu'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useContacts } from '@/hooks/use-contacts'
import { digitsOnly } from '@/lib/validation/fields'
import type { ContactRead } from '@/lib/api/contacts'

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 w-full bg-white/[0.04]" />
      ))}
    </div>
  )
}

export function ContactsScreen() {
  const { data: contacts, isLoading, isError } = useContacts()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const list = useMemo(() => contacts ?? [], [contacts])

  // El teléfono se muestra formateado (+591 …): la búsqueda compara solo dígitos
  // para que "+591 6900" y "69005037" encuentren lo mismo (#140).
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return list
    const termDigits = digitsOnly(term)
    return list.filter(
      (contact) =>
        (termDigits.length > 0 && digitsOnly(contact.phone).includes(termDigits)) ||
        (contact.full_name ?? '').toLowerCase().includes(term),
    )
  }, [list, query])

  // Keep selection valid if the contact was deleted or filtered out.
  const selected = selectedId ? (list.find((c) => c.id === selectedId) ?? null) : null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Contactos</h1>
          <p className="text-sm text-zinc-500">
            {list.length} contactos · se crean al ganar una oportunidad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ContactsExportButton />
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 bg-gradient-to-b from-violet-500 to-violet-700 text-white"
          >
            <Plus className="size-4" /> Nuevo contacto
          </Button>
        </div>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nombre o teléfono…"
        className="max-w-sm border-white/10 bg-white/[0.03] text-white"
      />

      {isLoading && <TableSkeleton />}
      {isError && (
        <Empty className="border border-dashed border-white/10">
          <EmptyHeader>
            <EmptyTitle className="text-white">No se pudieron cargar los contactos</EmptyTitle>
            <EmptyDescription className="text-zinc-500">
              Reintentá en unos segundos.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {!isLoading && !isError && list.length === 0 && (
        <Empty className="border border-dashed border-white/10">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-white/5 text-zinc-400">
              <Users />
            </EmptyMedia>
            <EmptyTitle className="text-white">Todavía no hay contactos</EmptyTitle>
            <EmptyDescription className="text-zinc-500">
              Se crean al ganar una oportunidad, o con “Nuevo contacto”.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {!isLoading && !isError && list.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-zinc-500">Sin resultados para “{query}”.</p>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <ContactsTable
              contacts={filtered}
              selectedId={selected?.id ?? null}
              onSelect={(contact: ContactRead) => setSelectedId(contact.id)}
            />
          </div>
          {selected && (
            <ContactDetail contact={selected} onClose={() => setSelectedId(null)} />
          )}
        </div>
      )}

      <ContactCreateSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
