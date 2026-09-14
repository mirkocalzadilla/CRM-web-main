import { z } from 'zod'

import { apiClient } from '@/lib/api/client'

// Config de pagos por organización (espejo de payment_schemas.py).
// `payment_qr_url` llega resuelta: si la org no cargó una propia es la global de la
// plataforma, y ahí `is_qr_url_custom` es false.

export const BENEFICIARY_MAX = 120

export const QR_ACCEPTED_TYPES = ['image/jpeg', 'image/png']
export const QR_MAX_SIZE = 5 * 1024 * 1024 // 5 MB, igual que el resto de las subidas

export const paymentSettingsReadSchema = z.object({
  expected_beneficiary: z.string().nullable(),
  payment_qr_url: z.string(),
  is_qr_url_custom: z.boolean(),
  // El QR vigente es un archivo subido acá (se puede reemplazar/borrar) y no un link
  // externo cargado a mano antes de que existiera la subida.
  is_qr_uploaded: z.boolean(),
})

export type PaymentSettingsRead = z.infer<typeof paymentSettingsReadSchema>

/** PUT parcial: omitir deja intacto, `null` explícito borra. El QR ya no se edita por
 *  acá — se sube y se borra con sus propios endpoints — pero el backend sigue
 *  aceptando la URL, que es como quedaron configuradas las orgs previas. */
export interface PaymentSettingsUpdate {
  expected_beneficiary?: string | null
  payment_qr_url?: string | null
}

export async function getPaymentSettings(): Promise<PaymentSettingsRead> {
  const { data } = await apiClient.get('/crm/payment-settings')
  return paymentSettingsReadSchema.parse(data)
}

export async function updatePaymentSettings(
  body: PaymentSettingsUpdate,
): Promise<PaymentSettingsRead> {
  const { data } = await apiClient.put('/crm/payment-settings', body)
  return paymentSettingsReadSchema.parse(data)
}

/** Sube la imagen del QR y reemplaza la anterior: hay una sola por organización. */
export async function uploadPaymentQr(file: File): Promise<PaymentSettingsRead> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post('/crm/payment-settings/qr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return paymentSettingsReadSchema.parse(data)
}

/** Saca el QR propio: el bot vuelve a mandar el global de la plataforma. */
export async function deletePaymentQr(): Promise<PaymentSettingsRead> {
  const { data } = await apiClient.delete('/crm/payment-settings/qr')
  return paymentSettingsReadSchema.parse(data)
}
