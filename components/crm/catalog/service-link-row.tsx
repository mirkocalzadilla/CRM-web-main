'use client'

import { useState } from 'react'
import { Link2, Pencil, Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { linkKindLabel } from '@/components/crm/catalog/labels'
import { ServiceLinkForm, type LinkDraft } from '@/components/crm/catalog/service-link-form'
import { useDeleteServiceLink, useUpdateServiceLink } from '@/hooks/use-service-links'
import type { ServiceLinkRead } from '@/lib/api/service-links'

interface ServiceLinkRowProps {
  link: ServiceLinkRead
  serviceId: string
}

export function ServiceLinkRow({ link, serviceId }: ServiceLinkRowProps) {
  const update = useUpdateServiceLink(serviceId)
  const remove = useDeleteServiceLink(serviceId)
  const [editing, setEditing] = useState(false)

  function save(draft: LinkDraft) {
    update.mutate(
      {
        linkId: link.id,
        body: { kind: draft.kind, url: draft.url, label: draft.label || null },
      },
      { onSuccess: () => setEditing(false) },
    )
  }

  if (editing) {
    return (
      <ServiceLinkForm
        initial={{ kind: toDraftKind(link.kind), url: link.url, label: link.label ?? '' }}
        saving={update.isPending}
        submitLabel="Guardar link"
        onSubmit={save}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
      <Link2 className="size-3.5 shrink-0 text-violet-300/70" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-zinc-300">
          {linkKindLabel(link.kind)}
          {link.label && <span className="text-zinc-500"> · {link.label}</span>}
        </p>
        <p className="truncate text-[11px] text-zinc-500">{link.url}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Editar link"
        onClick={() => setEditing(true)}
        className="size-8 shrink-0 text-zinc-400 hover:text-white"
      >
        <Pencil className="size-3.5" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Eliminar link"
            className="size-8 shrink-0 text-zinc-400 hover:text-red-400"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-zinc-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar este link?</AlertDialogTitle>
            <AlertDialogDescription>
              Dejará de enviarse tras el pago. {linkKindLabel(link.kind)}: {link.url}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/[0.03] text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate(link.id)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// `kind` llega como string libre del backend; un valor desconocido cae en "other".
function toDraftKind(kind: string): LinkDraft['kind'] {
  switch (kind) {
    case 'whatsapp_group':
    case 'meeting':
    case 'maps':
      return kind
    default:
      return 'other'
  }
}
