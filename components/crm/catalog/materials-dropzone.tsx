'use client'

import { useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Label } from '@/components/ui/label'
import { useUploadAsset, useDeleteAsset } from '@/hooks/use-catalogo'
import type { AssetRead } from '@/lib/api/catalogo'
import { cn } from '@/lib/utils'

const MAX_FILES = 5
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB (#108)
const ACCEPT = ['application/pdf', 'image/jpeg', 'image/png']

interface MaterialsDropzoneProps {
  materials: AssetRead[]
  onChange: (materials: AssetRead[]) => void
}

/** Dropzone de materiales: pdf/jpg/png ≤5 MB, máx. 5 por servicio, con listado en vivo. */
export function MaterialsDropzone({ materials, onChange }: MaterialsDropzoneProps) {
  const upload = useUploadAsset()
  const deleteAsset = useDeleteAsset()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const full = materials.length >= MAX_FILES

  async function addFiles(files: FileList | null) {
    if (!files?.length) return
    const slots = MAX_FILES - materials.length
    if (slots <= 0) {
      toast.error(`Máximo ${MAX_FILES} archivos.`)
      return
    }
    const valid = Array.from(files).filter((file) => {
      if (!ACCEPT.includes(file.type)) return toast.error(`${file.name}: solo PDF, JPG o PNG.`), false
      if (file.size > MAX_SIZE) return toast.error(`${file.name}: supera los 5 MB.`), false
      return true
    })
    if (valid.length > slots) toast.error(`Solo se agregan ${slots} más (máx. ${MAX_FILES}).`)

    const uploaded: AssetRead[] = []
    for (const file of valid.slice(0, slots)) {
      try {
        uploaded.push(await upload.mutateAsync(file))
      } catch {
        // El hook ya notifica el error; seguimos con el resto de los archivos.
      }
    }
    if (uploaded.length) onChange([...materials, ...uploaded])
  }

  async function removeAsset(id: string) {
    try {
      await deleteAsset.mutateAsync(id)
      onChange(materials.filter((m) => m.id !== id))
    } catch {
      // El hook ya notifica el error
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-zinc-400">
        Materiales (PDF/JPG/PNG, ≤5 MB · máx. {MAX_FILES})
      </Label>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={full}
        onClick={() => !full && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!full && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!full) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (!full) void addFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center text-xs text-zinc-400 transition',
          !full && 'cursor-pointer hover:border-violet-400/40 hover:bg-white/[0.04]',
          dragOver && 'border-violet-400/60 bg-violet-500/10',
          full && 'opacity-50',
        )}
      >
        <Upload className="size-4 text-zinc-500" />
        <span>
          {upload.isPending
            ? 'Subiendo…'
            : full
              ? `Límite de ${MAX_FILES} archivos alcanzado`
              : 'Arrastrá archivos o hacé clic para subir'}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        hidden
        onChange={(e) => {
          void addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {materials.length > 0 && (
        <ul className="space-y-1">
          {materials.map((material) => (
            <li
              key={material.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-300"
            >
              <span className="flex min-w-0 items-center gap-2">
                {material.kind === 'image' ? (
                  <ImageIcon className="size-3.5 shrink-0 text-zinc-500" />
                ) : (
                  <FileText className="size-3.5 shrink-0 text-zinc-500" />
                )}
                <span className="truncate">{material.filename}</span>
              </span>
              <button
                type="button"
                onClick={() => removeAsset(material.id)}
                disabled={deleteAsset.isPending}
                className="shrink-0 rounded p-0.5 text-zinc-500 hover:text-rose-400 disabled:opacity-50"
                aria-label={`Quitar ${material.filename}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
