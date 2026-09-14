import { z } from 'zod'

import { apiClient } from '@/lib/api/client'

// Control de acceso en la puerta (server#278, CR6).
//
// **Un rechazo nunca es un error HTTP**: `/redeem` y `/check-in` responden siempre 200
// con el motivo redactado en español. El front no re-decide ni re-escribe nada: pinta el
// color según `admitted` y muestra `detail` tal cual.

export const REDEEM_LEGACY = 'legacy'

/** `status` es `string` y no un enum a propósito (mismo criterio que los `flags` de la
 *  card): un veredicto nuevo del backend tiene que poder mostrarse, no romper la
 *  pantalla. El color no depende del string sino de `admitted`. */
export const redeemResultSchema = z.object({
  status: z.string(),
  admitted: z.boolean(),
  detail: z.string(),
  lead_name: z.string().nullable().default(null),
  service_name: z.string().nullable().default(null),
  amount: z.string().nullable().default(null),
  event_name: z.string().nullable().default(null),
  // Hora del primer uso; sólo viene cuando la entrada ya se había usado.
  used_at: z.string().nullable().default(null),
})

export type RedeemResult = z.infer<typeof redeemResultSchema>

export const attendeeSchema = z.object({
  entry_id: z.string(),
  card_id: z.string(),
  lead_name: z.string(),
  used_at: z.string().nullable(),
  // Entró sin mostrar el QR (check-in a mano). Se distingue en la lista para poder
  // revisar después del evento a quién se dejó pasar sin escanear.
  used_manually: z.boolean().default(false),
  revoked_at: z.string().nullable(),
})

/** La lista incluye las entradas **anuladas** a propósito: quien atiende necesita poder
 *  decir "tu entrada fue anulada" y no "no aparecés". El token del QR no viene — es el
 *  secreto que hace válida la entrada, y por eso el check-in va por `entry_id`. */
export const attendanceSchema = z.object({
  total: z.number(),
  checked_in: z.number(),
  attendees: z.array(attendeeSchema),
})

export type Attendee = z.infer<typeof attendeeSchema>
export type Attendance = z.infer<typeof attendanceSchema>

export type VerdictTone = 'pass' | 'warn' | 'reject'

/** El color de la pantalla: verde si pasa, ámbar para `legacy` (pasa, pero hay que
 *  verificar a mano que sea de este evento), rojo para todo lo demás. */
export function verdictTone(result: RedeemResult): VerdictTone {
  if (!result.admitted) return 'reject'
  return result.status === REDEEM_LEGACY ? 'warn' : 'pass'
}

/** Consume la entrada que leyó la cámara. `token` es texto libre: parte del trabajo del
 *  backend es decir **qué** se escaneó (el QR de pago del banco es el error más probable
 *  en la puerta), así que se manda tal cual y no se valida el formato acá. */
export async function redeemEntry(token: string, eventId: string | null): Promise<RedeemResult> {
  const { data } = await apiClient.post('/crm/entries/redeem', {
    token,
    ...(eventId ? { event_id: eventId } : {}),
  })
  return redeemResultSchema.parse(data)
}

/** Admite a alguien desde la lista, sin escanear. Rechaza por los mismos motivos que el
 *  escaneo: existe porque falló la cámara, no para saltear una entrada anulada. */
export async function checkInEntry(
  entryId: string,
  eventId: string | null,
): Promise<RedeemResult> {
  const { data } = await apiClient.post(
    `/crm/entries/${entryId}/check-in`,
    eventId ? { event_id: eventId } : {},
  )
  return redeemResultSchema.parse(data)
}

export async function getAttendance(eventId: string): Promise<Attendance> {
  const { data } = await apiClient.get(`/crm/entries/attendance/${eventId}`)
  return attendanceSchema.parse(data)
}
