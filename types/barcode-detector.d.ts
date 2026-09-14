// Tipos del `BarcodeDetector` nativo (Chrome/Android), que todavía no están en `lib.dom`.
//
// Ambient a propósito — sin `import`/`export` de nivel superior — para que la interfaz
// `Window` de la plataforma se extienda por merge y `window.BarcodeDetector` quede tipado
// como **opcional**: así el front puede preguntar si existe sin un `as`. iOS/Safari no lo
// trae, y ahí entra el fallback con jsQR (ver `lib/qr/decoder.ts`).

interface DetectedBarcode {
  rawValue: string
  format: string
}

interface BarcodeDetectorOptions {
  formats?: string[]
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>
  static getSupportedFormats(): Promise<string[]>
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector
}
