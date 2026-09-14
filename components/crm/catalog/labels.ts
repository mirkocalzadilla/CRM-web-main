import type { ServiceClosing, ServiceCurrency, ServiceModality } from '@/lib/api/catalogo'

export const CURRENCY_LABELS: Record<ServiceCurrency, string> = {
  BOB: 'Bs (BOB)',
  USD: 'USD (tipo de cambio paralelo)',
}

export const CLOSING_LABELS: Record<ServiceClosing, string> = {
  pago_qr: 'Pago con QR',
  handoff_consultivo: 'Derivar a humano (consultivo)',
}

// Radix no admite SelectItem con value="" → centinela para "sin modalidad" (null).
export const MODALITY_NONE = 'none'

export type ModalityChoice = ServiceModality | typeof MODALITY_NONE

export const MODALITY_CHOICES = ['presencial', 'virtual', 'hibrido', MODALITY_NONE] as const

export const MODALITY_LABELS: Record<ModalityChoice, string> = {
  presencial: 'Presencial (entrada con QR)',
  virtual: 'Virtual (links de acceso)',
  hibrido: 'Híbrido (entrada con QR + links)',
  none: 'Sin entrega',
}

/** Etiqueta corta para tablas/badges. */
export const MODALITY_SHORT: Record<ModalityChoice, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  hibrido: 'Híbrido',
  none: 'Sin entrega',
}

// `kind` llega como string libre del backend → lookup tolerante con fallback.
export const LINK_KIND_LABELS: Record<string, string> = {
  whatsapp_group: 'Grupo de WhatsApp',
  meeting: 'Reunión (Meet/Zoom)',
  maps: 'Ubicación (Maps)',
  other: 'Otro',
}

export function linkKindLabel(kind: string): string {
  return LINK_KIND_LABELS[kind] ?? kind
}
