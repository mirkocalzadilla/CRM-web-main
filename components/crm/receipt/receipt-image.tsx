'use client'

import { ImageOff } from 'lucide-react'

/** La imagen del comprobante al lado de los datos: el operador no tiene que ir a
 *  buscarla al hilo. Click = original a tamaño completo en otra pestaña. */
export function ReceiptImage({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/10 px-2 text-center">
        <ImageOff className="size-4 text-zinc-600" />
        <span className="text-[11px] font-normal text-zinc-600">Sin imagen guardada</span>
      </div>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title="Abrir el comprobante en tamaño completo"
      className="block overflow-hidden rounded-lg border border-white/10 bg-black/30"
    >
      <img
        src={url}
        alt="Comprobante de pago enviado por el lead"
        className="max-h-40 w-full object-contain transition-opacity hover:opacity-80"
      />
    </a>
  )
}
