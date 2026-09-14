import { digitsOnly } from '@/lib/validation/fields'

// Canonical display formatters (#140). Every money/phone value rendered in the UI
// goes through these so the whole app reads the same.

const CURRENCY_LABELS: Record<string, string> = { BOB: 'Bs', USD: 'US$' }

/** "1800" + "BOB" → "Bs 1.800" (es-BO grouping). Unknown/invalid values degrade
 *  to the raw amount so a bad price never renders as "NaN". */
export function formatMoney(amount: string | number, currency: string): string {
  const label = CURRENCY_LABELS[currency] ?? currency
  const value = typeof amount === 'number' ? amount : Number(amount)
  if (!Number.isFinite(value)) return `${label} ${amount}`
  return `${label} ${new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(value)}`
}

/** wa_id "59169005037" → "+591 6900 5037". Non-BO numbers keep their digits with
 *  a leading "+"; empty/garbage input returns the input as-is. */
export function formatPhone(phone: string): string {
  const digits = digitsOnly(phone)
  if (digits.length === 0) return phone
  if (digits.length === 11 && digits.startsWith('591')) {
    return `+591 ${digits.slice(3, 7)} ${digits.slice(7)}`
  }
  return `+${digits}`
}

/** True when the card has no real name and its title is just the phone/wa_id. */
export function isUnnamedLead(title: string, phone: string | null | undefined): boolean {
  return !!phone && (title === phone || digitsOnly(title) === digitsOnly(phone))
}

/** Display title for a lead anywhere in the app: real name, or formatted phone. */
export function leadTitle(title: string, phone: string | null | undefined): string {
  return isUnnamedLead(title, phone) && phone ? formatPhone(phone) : title
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** True if both ISO timestamps fall on the same calendar day (thread grouping, #134). */
export function sameCalendarDay(aIso: string, bIso: string): boolean {
  const a = new Date(aIso)
  const b = new Date(bIso)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return true
  return sameDay(a, b)
}

/** Day label for thread separators: "Hoy", "Ayer" or "1 jul" (#134). */
export function formatThreadDay(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  if (sameDay(date, now)) return 'Hoy'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, yesterday)) return 'Ayer'
  return date.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
}

/** Format time for tickets: "Hoy 14:30", "Ayer 09:15", "1 jul 18:20" */
export function formatTicketTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const time = date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (sameDay(date, now)) return `Hoy ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, yesterday)) return `Ayer ${time}`
  const dayStr = date.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
  return `${dayStr} ${time}`
}
