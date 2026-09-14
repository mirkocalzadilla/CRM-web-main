'use client'

import { useCallback } from 'react'
import { ScanLine } from 'lucide-react'

import { Spinner } from '@/components/ui/spinner'
import { CameraProblemPanel } from '@/components/crm/entries/camera-problem'
import { ScanVerdict } from '@/components/crm/entries/scan-verdict'
import { toneClasses } from '@/components/crm/entries/labels'
import { verdictTone, type RedeemResult } from '@/lib/api/entries'
import { useQrScanner } from '@/hooks/use-qr-scanner'
import { cn } from '@/lib/utils'

interface QrCameraProps {
  /** Se llama con el texto crudo del QR; el backend decide qué es. */
  onToken: (token: string) => void
  /** Veredicto en pantalla; mientras esté, la cámara deja de decodificar. */
  result: RedeemResult | null
  pending: boolean
  onDismiss: () => void
  onOpenList: () => void
}

/** Visor de la cámara con el QR leyéndose solo, y el veredicto encima cuando llega.
 *
 *  El veredicto **tapa** el visor a propósito: quien atiende no necesita mirar la cámara
 *  mientras decide, y el panel ocupando la pantalla es lo que hace que se lea de lejos. */
export function QrCamera({
  onToken,
  result,
  pending,
  onDismiss,
  onOpenList,
}: QrCameraProps) {
  const paused = result !== null || pending
  const { videoRef, problem, engine, ready, retry } = useQrScanner({ onToken, paused })

  const handleRetry = useCallback(() => {
    onDismiss()
    retry()
  }, [onDismiss, retry])

  return (
    <div className="relative flex flex-col gap-3">
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-black',
          result !== null && cn('ring-4', toneClasses(verdictTone(result)).ring),
        )}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          aria-label="Cámara para leer el QR de la entrada"
          className="size-full object-cover"
        />

        {ready && result === null && !pending && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="size-2/3 rounded-2xl border-4 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {!ready && problem === null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Spinner className="size-8" />
            <p className="text-sm">Abriendo la cámara…</p>
          </div>
        )}

        {pending && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
            <Spinner className="size-10 text-violet-300" />
            <p className="text-lg font-medium text-white">Consultando la entrada…</p>
          </div>
        )}
      </div>

      {/* Fuera del cuadro de la cámara a propósito: el panel del veredicto es más alto que
          el cuadrado en un teléfono chico, y recortarlo ahí adentro dejaría el botón
          "Siguiente" detrás de un scroll. */}
      {result !== null && (
        <div className="absolute inset-x-0 top-0 z-10">
          <ScanVerdict result={result} onDismiss={onDismiss} />
        </div>
      )}

      {problem !== null && (
        <CameraProblemPanel problem={problem} onRetry={handleRetry} onOpenList={onOpenList} />
      )}

      {ready && result === null && !pending && (
        <p className="flex items-center justify-center gap-2 text-sm text-zinc-400">
          <ScanLine className="size-4" />
          Apuntá al QR de la entrada: se lee solo
          {engine === 'js' && <span className="text-zinc-600">· lector compatible</span>}
        </p>
      )}
    </div>
  )
}
