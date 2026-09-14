// Lectura del QR: nativa cuando el navegador la trae, jsQR cuando no.
//
// `BarcodeDetector` es lo que hay en Chrome/Android — el caso más probable en la puerta —
// y decodifica en el proceso del navegador, sin costo de bundle ni de CPU en JS. iOS y
// Safari no lo traen (ni Firefox), así que ahí se carga jsQR **por import dinámico**: el
// teléfono que no lo necesita nunca lo descarga.

export type QrEngine = 'native' | 'js'

export interface QrDecoder {
  engine: QrEngine
  /** Devuelve el texto del QR que se vea en el frame actual, o `null` si no hay ninguno. */
  decode: (video: HTMLVideoElement) => Promise<string | null>
}

const QR_FORMAT = 'qr_code'

/** jsQR sobre un frame de 1080p no llega a tiempo en un teléfono de gama baja. Reducir el
 *  lado mayor a esto mantiene el QR legible y la lectura fluida. */
const MAX_SIDE = 640

function nativeDecoder(): QrDecoder | null {
  if (typeof window === 'undefined') return null
  const Detector = window.BarcodeDetector
  if (!Detector) return null
  try {
    const detector = new Detector({ formats: [QR_FORMAT] })
    return {
      engine: 'native',
      decode: async (video) => {
        try {
          const found = await detector.detect(video)
          return found[0]?.rawValue ?? null
        } catch {
          // Chrome tira si el frame todavía no está listo: el próximo tick reintenta.
          return null
        }
      },
    }
  } catch {
    // El navegador expone la API pero no soporta `qr_code`.
    return null
  }
}

async function jsDecoder(): Promise<QrDecoder> {
  const { default: jsQR } = await import('jsqr')
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  return {
    engine: 'js',
    decode: async (video) => {
      const width = video.videoWidth
      const height = video.videoHeight
      if (context === null || width === 0 || height === 0) return null

      const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
      const targetWidth = Math.round(width * scale)
      const targetHeight = Math.round(height * scale)
      canvas.width = targetWidth
      canvas.height = targetHeight
      context.drawImage(video, 0, 0, targetWidth, targetHeight)

      const frame = context.getImageData(0, 0, targetWidth, targetHeight)
      // `dontInvert`: el QR de la entrada es negro sobre blanco y probar la inversión
      // duplica el trabajo por frame sin ganar nada.
      const found = jsQR(frame.data, targetWidth, targetHeight, {
        inversionAttempts: 'dontInvert',
      })
      return found?.data ?? null
    },
  }
}

/** El mejor lector disponible en este navegador. */
export async function createQrDecoder(): Promise<QrDecoder> {
  return nativeDecoder() ?? (await jsDecoder())
}
