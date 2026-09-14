'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { createQrDecoder, type QrEngine } from '@/lib/qr/decoder'

/** Qué le impide a este teléfono leer el QR. Cada caso tiene una salida distinta, así que
 *  se distinguen en vez de mostrar "no se pudo abrir la cámara". */
export type CameraProblem = 'denied' | 'missing' | 'busy' | 'insecure' | 'unknown'

/** ~5 lecturas por segundo: suficiente para que el QR "salte" apenas entra en el cuadro,
 *  sin freír la batería del teléfono de la puerta. */
const SCAN_INTERVAL_MS = 180

interface QrScannerOptions {
  /** Se llama una vez por token nuevo leído. */
  onToken: (token: string) => void
  /** Con el veredicto en pantalla la cámara sigue prendida pero deja de decodificar. */
  paused: boolean
}

interface QrScanner {
  videoRef: React.RefObject<HTMLVideoElement | null>
  problem: CameraProblem | null
  engine: QrEngine | null
  ready: boolean
  retry: () => void
}

function cameraProblem(error: unknown): CameraProblem {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'missing'
  if (name === 'NotReadableError' || name === 'AbortError') return 'busy'
  return 'unknown'
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}

/** Cámara trasera + lectura continua del QR. Mientras el componente esté montado el
 *  stream queda abierto: reabrirlo por cada persona de la fila agregaría un segundo de
 *  espera a cada admisión. */
export function useQrScanner({ onToken, paused }: QrScannerOptions): QrScanner {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pausedRef = useRef(paused)
  const onTokenRef = useRef(onToken)
  /** Último token emitido. Sin esto, el QR que sigue frente a la cámara después de un
   *  escaneo exitoso se volvería a mandar y el backend contestaría "ya se usó" sobre la
   *  entrada que acaba de pasar. */
  const lastTokenRef = useRef<string | null>(null)

  const [problem, setProblem] = useState<CameraProblem | null>(null)
  const [engine, setEngine] = useState<QrEngine | null>(null)
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    const video = videoRef.current
    if (video === null) return

    let cancelled = false
    let timer: number | undefined

    async function start(element: HTMLVideoElement): Promise<void> {
      // Sin HTTPS (o localhost) el navegador no expone `mediaDevices`.
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setProblem('insecure')
        return
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
      } catch (error) {
        setProblem(cameraProblem(error))
        return
      }
      if (cancelled) {
        stopStream(stream)
        return
      }

      streamRef.current = stream
      element.srcObject = stream
      try {
        await element.play()
      } catch {
        // iOS puede rechazar el autoplay; el `playsInline` + `muted` del elemento
        // resuelven el caso normal y el frame igual llega en cuanto haya un gesto.
      }

      const decoder = await createQrDecoder()
      if (cancelled) return
      setEngine(decoder.engine)
      setProblem(null)
      setReady(true)

      const tick = async (): Promise<void> => {
        if (cancelled) return
        if (!pausedRef.current) {
          const value = await decoder.decode(element)
          const token = value?.trim() ?? ''
          if (token !== '' && token !== lastTokenRef.current) {
            lastTokenRef.current = token
            onTokenRef.current(token)
          }
        }
        if (!cancelled) timer = window.setTimeout(() => void tick(), SCAN_INTERVAL_MS)
      }
      void tick()
    }

    void start(video)

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
      stopStream(streamRef.current)
      streamRef.current = null
      setReady(false)
    }
  }, [attempt])

  const retry = useCallback(() => {
    setProblem(null)
    lastTokenRef.current = null
    setAttempt((value) => value + 1)
  }, [])

  return { videoRef, problem, engine, ready, retry }
}
