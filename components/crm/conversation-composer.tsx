'use client'

import { useRef, useState, type FormEvent } from 'react'
import { FileText, ImageIcon, Loader2, Paperclip, QrCode, Send, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useSendHumanMedia,
  useSendHumanReply,
  useSendPaymentQr,
} from '@/hooks/use-card-mutations'

// Mismo set que valida el backend (JPG/PNG/PDF ≤5 MB, server #251).
export const COMPOSER_ACCEPT = 'image/jpeg,image/png,application/pdf'
const MAX_FILE_BYTES = 5 * 1024 * 1024

/** Chequeo previo al upload; devuelve el mensaje de error o null si es válido. */
export function composerFileError(file: File): string | null {
  if (!COMPOSER_ACCEPT.split(',').includes(file.type)) {
    return 'El archivo debe ser JPG, PNG o PDF'
  }
  if (file.size > MAX_FILE_BYTES) return 'El archivo supera el límite de 5 MB'
  return null
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ICON_BUTTON =
  'size-9 flex-shrink-0 rounded-full text-zinc-500 hover:bg-white/5 hover:text-white'

/** Composer del takeover (#169): texto + adjunto (clip/drag/paste, el texto pasa a
 *  ser el caption) + botón de QR de pago. Solo se monta con IA off y permiso. */
export function ConversationComposer({
  cardId,
  file,
  onFileChange,
}: {
  cardId: string
  file: File | null
  onFileChange: (file: File | null) => void
}) {
  const sendReply = useSendHumanReply(cardId)
  const sendMedia = useSendHumanMedia(cardId)
  const sendQr = useSendPaymentQr(cardId)
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSending = sendReply.isPending || sendMedia.isPending
  const canSubmit = !isSending && (file !== null || text.trim().length > 0)

  const pickFile = (candidate: File) => {
    const error = composerFileError(candidate)
    if (error) {
      toast.error(error)
      return
    }
    onFileChange(candidate)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const trimmed = text.trim()
    const clear = () => {
      setText('')
      onFileChange(null)
    }
    if (file) {
      sendMedia.mutate({ file, caption: trimmed }, { onSuccess: clear })
    } else {
      sendReply.mutate(trimmed, { onSuccess: clear })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {file && (
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          {file.type === 'application/pdf' ? (
            <FileText className="size-4 flex-shrink-0 text-violet-400" />
          ) : (
            <ImageIcon className="size-4 flex-shrink-0 text-violet-400" />
          )}
          <span className="min-w-0 flex-1 truncate text-xs font-normal text-zinc-300">
            {file.name}
          </span>
          <span className="flex-shrink-0 text-[10px] font-normal text-zinc-600">
            {formatSize(file.size)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Quitar archivo"
            onClick={() => onFileChange(null)}
            disabled={isSending}
            className="size-6 flex-shrink-0 rounded-md text-zinc-500 hover:bg-white/5 hover:text-white"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept={COMPOSER_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const picked = e.target.files?.[0]
            if (picked) pickFile(picked)
            e.target.value = '' // allow re-selecting the same file
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Adjuntar archivo"
          title="Adjuntar archivo (JPG, PNG o PDF)"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className={ICON_BUTTON}
        >
          <Paperclip className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Enviar QR de pago"
          title="Enviar QR de pago"
          onClick={() => sendQr.mutate()}
          disabled={sendQr.isPending || isSending}
          className={cn(ICON_BUTTON, 'hover:text-violet-300')}
        >
          {sendQr.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <QrCode className="size-4" />
          )}
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.files?.[0]
            if (pasted) {
              e.preventDefault()
              pickFile(pasted)
            }
          }}
          placeholder={file ? 'Agregá un comentario…' : 'Escribí tu respuesta…'}
          maxLength={file ? 1024 : 4096}
          disabled={isSending}
          className="h-10 flex-1 rounded-full border-white/10 bg-white/[0.03] text-sm font-normal text-white placeholder:text-zinc-600 disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={!canSubmit}
          aria-label={isSending ? 'Enviando…' : 'Enviar'}
          className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-b from-violet-500 to-violet-700 p-0 hover:from-violet-400 hover:to-violet-600 disabled:opacity-40"
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </form>
  )
}
