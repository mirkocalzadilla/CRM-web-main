'use client'

import { useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { linkKindLabel } from '@/components/crm/catalog/labels'
import { FieldError } from '@/components/crm/catalog/service-form'
import {
  serviceLinkKinds,
  LINK_LABEL_MAX,
  LINK_URL_MAX,
  type ServiceLinkKind,
} from '@/lib/api/service-links'
import { httpUrl, validationMessages as m } from '@/lib/validation'

export interface LinkDraft {
  kind: ServiceLinkKind
  url: string
  label: string
}

// Cliente-side mirror del 422 del backend: el link se corta acá.
const draftSchema = z.object({
  kind: z.enum(serviceLinkKinds),
  url: httpUrl(LINK_URL_MAX),
  label: z.string().trim().max(LINK_LABEL_MAX, m.maxLength(LINK_LABEL_MAX)),
})

interface ServiceLinkFormProps {
  initial?: LinkDraft
  saving: boolean
  submitLabel: string
  onSubmit: (draft: LinkDraft) => void
  onCancel: () => void
}

const EMPTY: LinkDraft = { kind: 'whatsapp_group', url: '', label: '' }

function toKind(value: string): ServiceLinkKind {
  const parsed = draftSchema.shape.kind.safeParse(value)
  return parsed.success ? parsed.data : 'other'
}

export function ServiceLinkForm({
  initial,
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: ServiceLinkFormProps) {
  const [draft, setDraft] = useState<LinkDraft>(initial ?? EMPTY)
  const [errors, setErrors] = useState<{ url?: string; label?: string }>({})

  function submit() {
    const parsed = draftSchema.safeParse(draft)
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setErrors({ url: flat.url?.[0], label: flat.label?.[0] })
      return
    }
    setErrors({})
    onSubmit({ kind: parsed.data.kind, url: parsed.data.url, label: parsed.data.label })
  }

  // El form del link vive dentro del <form> del servicio: sin preventDefault, Enter
  // dispararía además el submit del servicio.
  function onEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    submit()
  }

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Select
          value={draft.kind}
          onValueChange={(kind) => setDraft((prev) => ({ ...prev, kind: toKind(kind) }))}
        >
          <SelectTrigger
            aria-label="Tipo de link"
            className="border-white/10 bg-white/[0.03] text-sm text-white"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {serviceLinkKinds.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {linkKindLabel(kind)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="space-y-1">
          <Input
            autoFocus
            value={draft.url}
            onChange={(e) => setDraft((prev) => ({ ...prev, url: e.target.value }))}
            onKeyDown={onEnter}
            placeholder="https://chat.whatsapp.com/…"
            maxLength={LINK_URL_MAX}
            aria-label="URL del link"
            className="border-white/10 bg-white/[0.03] text-sm text-white"
          />
          <FieldError message={errors.url} />
        </div>
      </div>
      <div className="space-y-1">
        <Input
          value={draft.label}
          onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
          onKeyDown={onEnter}
          placeholder="Etiqueta (opcional, ej. Grupo del curso)"
          maxLength={LINK_LABEL_MAX}
          aria-label="Etiqueta del link"
          className="border-white/10 bg-white/[0.03] text-sm text-white"
        />
        <FieldError message={errors.label} />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="h-8 text-xs text-zinc-400 hover:text-white"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={submit}
          disabled={saving}
          className="h-8 bg-gradient-to-b from-violet-500 to-violet-700 text-xs text-white"
        >
          {saving ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
