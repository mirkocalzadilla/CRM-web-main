'use client'

import { useRef, useState } from 'react'
import { ImageUp } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useDeletePaymentQr, useUploadPaymentQr } from '@/hooks/use-payment-settings'
import {
  QR_ACCEPTED_TYPES,
  QR_MAX_SIZE,
  type PaymentSettingsRead,
} from '@/lib/api/payment-settings'
import { cn } from '@/lib/utils'

/** QR de pago de la organización: una sola imagen, subida acá. Subir una nueva pisa la
 *  anterior (el backend borra el archivo) y eliminarla vuelve al QR global.
 *
 *  Vive fuera del `<form>` de la config: sube y borra con su propia llamada, así el
 *  operador ve el QR nuevo apenas lo suelta, sin pasar por "Guardar cambios". */
export function PaymentQrField({ settings }: { settings: PaymentSettingsRead }) {
  const upload = useUploadPaymentQr()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const busy = upload.isPending

  function submitFile(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!QR_ACCEPTED_TYPES.includes(file.type)) {
      toast.error('El QR debe ser una imagen JPG o PNG.')
      return
    }
    if (file.size > QR_MAX_SIZE) {
      toast.error('La imagen supera los 5 MB.')
      return
    }
    upload.mutate(file)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs font-medium text-zinc-400">QR de pago</Label>
        {settings.is_qr_url_custom ? (
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-200">
            QR propio de la organización
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-400">
            QR global de la plataforma
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-stretch gap-3">
        <img
          src={settings.payment_qr_url}
          alt="QR de pago vigente"
          className="size-32 shrink-0 rounded-lg border border-white/10 bg-white/5 object-contain p-1.5"
        />
        <div
          role="button"
          tabIndex={0}
          aria-disabled={busy}
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!busy && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!busy) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (!busy) submitFile(e.dataTransfer.files)
          }}
          className={cn(
            'flex min-w-[15rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center text-xs text-zinc-400 transition',
            !busy && 'cursor-pointer hover:border-violet-400/40 hover:bg-white/[0.04]',
            dragOver && 'border-violet-400/60 bg-violet-500/10',
            busy && 'opacity-50',
          )}
        >
          <ImageUp className="size-4 text-zinc-500" />
          <span>
            {busy
              ? 'Subiendo…'
              : settings.is_qr_url_custom
                ? 'Arrastrá otra imagen para reemplazar el QR'
                : 'Arrastrá el QR o hacé clic para subirlo'}
          </span>
          <span className="text-[11px] text-zinc-600">JPG o PNG · hasta 5 MB</span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={(e) => {
          submitFile(e.target.files)
          e.target.value = ''
        }}
      />

      <p className="text-[11px] text-zinc-500">
        Imagen que el bot le manda al lead para pagar. Se guarda una sola por
        organización: al subir una nueva, la anterior se reemplaza. Si la eliminás, el bot vuelve a
        mandar el <span className="text-zinc-300">QR global de la plataforma</span>.
      </p>

      {settings.is_qr_url_custom && <QrDeleteDialog uploaded={settings.is_qr_uploaded} />}
    </div>
  )
}

/** Confirmación de la baja: el archivo se borra del servidor y no se recupera. */
function QrDeleteDialog({ uploaded }: { uploaded: boolean }) {
  const remove = useDeletePaymentQr()
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={remove.isPending}
          className="h-8 px-0 text-xs text-zinc-400 hover:text-rose-400"
        >
          Eliminar el QR y volver al global
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Eliminar el QR de pago</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            El bot va a pasar a mandarle a los leads el QR global de la plataforma
            {uploaded ? ', y la imagen que subiste se borra del servidor' : ''}. Podés subir otra
            cuando quieras.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white">
            Cancelar
          </AlertDialogCancel>
          <Button
            onClick={() => remove.mutate(undefined, { onSuccess: () => setOpen(false) })}
            disabled={remove.isPending}
            className="bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
          >
            {remove.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
