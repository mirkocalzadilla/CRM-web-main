'use client'

import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CatalogTable } from '@/components/crm/catalog/catalog-table'
import { CategoryManager } from '@/components/crm/catalog/category-manager'
import { ServiceEditor } from '@/components/crm/catalog/service-editor'
import { useServices } from '@/hooks/use-catalogo'
import type { ServiceRead } from '@/lib/api/catalogo'

export function CatalogScreen() {
  const { data: services, isLoading, isError } = useServices()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceRead | null>(null)

  const list = services ?? []
  const activos = list.filter((s) => s.is_active).length
  const nextOrden = list.reduce((max, o) => Math.max(max, o.orden), -1) + 1

  function openNew() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(service: ServiceRead) {
    setEditing(service)
    setEditorOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Catálogo</h1>
          <p className="text-sm text-zinc-500">
            {activos} de {list.length} servicios activos · el bot los ofrece al instante.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1 text-xs text-emerald-300/90">
                <span className="size-1.5 rounded-full bg-emerald-400" /> En línea
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              El catálogo está conectado al bot: cada servicio con el switch Activo encendido se
              ofrece ahora mismo, sin publicar nada.
            </TooltipContent>
          </Tooltip>
          <CategoryManager />
          <Button
            variant="outline"
            onClick={openNew}
            className="gap-2 border-white/10 bg-white/[0.03] text-white"
          >
            <Plus className="size-4" /> Nuevo servicio
          </Button>
        </div>
      </div>

      <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-zinc-400">
        Los servicios <span className="text-emerald-300/90">activos</span> se ofrecen al agente
        automáticamente apenas los guardás; los <span className="text-zinc-300">inactivos</span> no.
        Usá el switch <span className="text-zinc-300">Activo</span> de cada fila para controlar qué
        está en línea — no hace falta publicar.
      </p>

      {isLoading && (
        <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full bg-white/[0.04]" />
          ))}
        </div>
      )}
      {isError && (
        <Empty className="border border-dashed border-white/10">
          <EmptyHeader>
            <EmptyTitle className="text-white">No se pudo cargar el catálogo</EmptyTitle>
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
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle className="text-white">Todavía no hay servicios</EmptyTitle>
            <EmptyDescription className="text-zinc-500">
              Creá el primero con “Nuevo servicio”; el bot lo ofrece apenas lo guardás.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {list.length > 0 && <CatalogTable services={list} onEdit={openEdit} />}

      {editorOpen && (
        <ServiceEditor
          key={editing?.id ?? 'new'}
          service={editing}
          defaultOrden={nextOrden}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          // Un alta con entrega sigue en modo edición (la key remonta el form con el
          // id nuevo) para cargar los links sin cerrar y volver a abrir.
          onCreated={setEditing}
        />
      )}
    </div>
  )
}
