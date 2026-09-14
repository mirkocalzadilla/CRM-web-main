'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { EventDeleteDialog } from '@/components/crm/agenda/event-delete-dialog'
import { EventEditor } from '@/components/crm/agenda/event-editor'
import { EventTable } from '@/components/crm/agenda/event-table'
import { hasPassed } from '@/components/crm/agenda/labels'
import { useEvents } from '@/hooks/use-agenda'
import { useServices } from '@/hooks/use-catalogo'
import type { EventRead } from '@/lib/api/agenda'

/** Agenda de eventos (web#189 / server#276).
 *
 *  El backend ya tenía el ABM completo pero no había pantalla: sin un evento cargado,
 *  un servicio presencial no entrega la entrada sola y el selector del escáner queda
 *  vacío. Esto es esa pantalla. */
export function AgendaScreen() {
  const { data: events, isLoading, isError } = useEvents()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<EventRead | null>(null)
  const [deleting, setDeleting] = useState<EventRead | null>(null)

  // `?service=<id>`: llega desde el catálogo ("N eventos próximos") ya filtrado por
  // ese servicio; el alta preselecciona el mismo servicio para no elegirlo dos veces.
  const router = useRouter()
  const requestedService = useSearchParams().get('service')
  const { data: services } = useServices()
  // El filtro se aplica **solo contra un servicio que existe**. Un `?service=` que no
  // resuelve (link viejo, servicio borrado del catálogo) dejaría la pantalla diciendo
  // "0 eventos" sobre una agenda que sí los tiene: se ignora y se lista todo.
  const filtered = services?.find((s) => s.id === requestedService) ?? null
  const serviceFilter = filtered?.id ?? null
  const filterName = filtered?.nombre ?? null

  const all = events ?? []
  const list = serviceFilter ? all.filter((e) => e.service_id === serviceFilter) : all
  const proximos = list.filter((event) => !hasPassed(event)).length

  function openNew() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(event: EventRead) {
    setEditing(event)
    setEditorOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Agenda</h1>
          <p className="text-sm text-zinc-500">
            Fechas y sedes de los servicios presenciales. Sin un evento cargado, el bot no entrega
            la entrada.
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {proximos} {proximos === 1 ? 'evento próximo' : 'eventos próximos'} de {list.length} en
            total{filterName ? ' para este servicio' : ''}.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={openNew}
          className="gap-2 border-white/10 bg-white/[0.03] text-white"
        >
          <Plus className="size-4" /> Nuevo evento
        </Button>
      </div>

      {filterName && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/[0.08] px-2.5 py-1 text-xs text-violet-300">
            Filtrado por servicio: {filterName}
            <button
              type="button"
              aria-label="Quitar filtro"
              onClick={() => router.replace('/agenda')}
              className="rounded-full p-0.5 hover:bg-white/10"
            >
              <X className="size-3" />
            </button>
          </span>
        </div>
      )}

      <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-zinc-400">
        Cada evento es <span className="text-zinc-300">una fecha concreta</span> de un servicio
        presencial o híbrido. El servicio (nombre, precio, modalidad) se carga en{' '}
        <Link href="/catalogo" className="text-violet-300 underline-offset-2 hover:underline">
          Catálogo
        </Link>
        ; acá va la edición: cuándo, dónde y para cuántos. Sin un evento próximo cargado, al
        validarse el pago se le confirma al lead pero la entrada{' '}
        <span className="text-zinc-300">no sale sola</span> y la oportunidad queda con el aviso
        &quot;Sin evento en Agenda&quot;; en cuanto lo cargás acá, esas entradas salen solas. La
        fecha y el lugar viajan en el mensaje que recibe quien compra, y en la puerta el escáner
        rechaza las entradas de otra fecha.
      </p>

      {isLoading && (
        <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full bg-white/[0.04]" />
          ))}
        </div>
      )}

      {isError && (
        <Empty className="border border-dashed border-white/10">
          <EmptyHeader>
            <EmptyTitle className="text-white">No se pudo cargar la agenda</EmptyTitle>
            <EmptyDescription className="text-zinc-500">Reintentá en unos segundos.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <Empty className="border border-dashed border-white/10">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-white/5 text-zinc-400">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle className="text-white">
              {filterName ? `"${filterName}" no tiene eventos` : 'Todavía no hay eventos'}
            </EmptyTitle>
            <EmptyDescription className="text-zinc-500">
              {filterName
                ? 'Creá la primera fecha con “Nuevo evento”: hasta entonces este servicio no entrega la entrada solo.'
                : 'Creá el primero con “Nuevo evento”: hasta entonces, los cursos presenciales no entregan la entrada solos.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {list.length > 0 && <EventTable events={list} onEdit={openEdit} onDelete={setDeleting} />}

      {editorOpen && (
        <EventEditor
          key={editing?.id ?? 'new'}
          event={editing}
          // Solo se preselecciona un servicio que el Select del alta puede mostrar: la
          // lista de opciones filtra por `is_active`, y preseleccionar uno inactivo
          // dejaría el campo requerido vacío a la vista pero el form válido.
          defaultServiceId={filtered?.is_active ? filtered.id : null}
          open={editorOpen}
          onOpenChange={setEditorOpen}
        />
      )}
      <EventDeleteDialog event={deleting} onOpenChange={() => setDeleting(null)} />
    </div>
  )
}
