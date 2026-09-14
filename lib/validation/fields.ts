import { z } from 'zod'

import { validationMessages as m } from './messages'

// Reusable zod field schemas/factories. Resolver-agnostic (work with or without shadcn Form).

export const email = z.string().email(m.email)

// Bolivian mobile: 8 digits starting with 6 or 7 (local number, sin código de país).
const PHONE_BO_RE = /^[67]\d{7}$/

export const phoneBO = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine((v) => PHONE_BO_RE.test(v), m.phone)

// Strip everything but digits — use in a numeric input's onChange to block letters/symbols.
export const digitsOnly = (value: string): string => value.replace(/\D/g, '')

// A BO mobile is exactly 8 digits (local number).
export const PHONE_BO_MAX_DIGITS = 8

// Phone input sanitizer: digits only, capped at max length. Blocks letters and over-typing.
export const sanitizePhoneInput = (value: string): string =>
  digitsOnly(value).slice(0, PHONE_BO_MAX_DIGITS)

// Slug input sanitizer: lowercase + only [a-z0-9-]. Blocks disallowed chars at typing time.
export const sanitizeSlugInput = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9-]/g, '')

// Canonical form `591XXXXXXXX` to match conversation.external_id. Returns null if not a valid BO mobile.
export function normalizePhoneBO(value: string): string | null {
  const digits = value.replace(/[\s+-]/g, '')
  const local = digits.startsWith('591') ? digits.slice(3) : digits
  return /^[67]\d{7}$/.test(local) ? `591${local}` : null
}

export const requiredText = (max: number) =>
  z.string().trim().min(1, m.required).max(max, m.maxLength(max))

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, m.maxLength(max))
    .transform((v) => (v === '' ? undefined : v))
    .optional()

export const SLUG_MAX = 20

export const slug = z
  .string()
  .trim()
  .max(SLUG_MAX, m.maxLength(SLUG_MAX))
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, m.slug)

export const enumField = <const T extends readonly [string, ...string[]]>(
  values: T,
  message: string = m.required,
) => z.enum(values, { errorMap: () => ({ message }) })

// Legacy: catalog price as a display string (e.g. "650 Bs"). En uso hasta migrar a numérico (#42).
export const priceText = z.string().trim().min(1, m.priceRequired)

// Target: price desde un input numérico (string de dígitos), requerido y > 0.
export const priceInput = z
  .string()
  .trim()
  .min(1, m.priceRequired)
  .refine((v) => Number(v) > 0, m.priceAmount)

export const currency = enumField(['BOB', 'USD'], m.currency)

// HTTP(S) link, espejo de la validación server-side (#178): el valor termina dentro
// de un mensaje de WhatsApp, así que se corta acá y no en el 422.
export const httpUrl = (max: number) =>
  z
    .string()
    .trim()
    .min(1, m.required)
    .max(max, m.maxLength(max))
    .refine((v) => /^https?:\/\//.test(v), m.linkScheme)
    .refine((v) => !/\s/.test(v), m.linkSpaces)

export const NOTE_MIN_LENGTH = 3

// Nota auditada obligatoria (override del comprobante, server#272). Los espacios se
// normalizan **antes** de medir el mínimo, igual que el validador del backend: así una
// nota de puros espacios se corta acá y no depende del 422. El valor parseado es el que
// hay que mandar (ya normalizado).
export const auditNote = (max: number) =>
  z
    .string()
    .max(max, m.maxLength(max))
    .transform((v) => v.split(/\s+/).filter(Boolean).join(' '))
    .refine((v) => v.length >= NOTE_MIN_LENGTH, m.noteMin(NOTE_MIN_LENGTH))

// Price/currency display formatting lives in lib/format.ts (formatMoney, #140).
