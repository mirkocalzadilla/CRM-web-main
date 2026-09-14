import {
  CalendarClock,
  CircleHelp,
  Coins,
  Copy,
  FileImage,
  Hash,
  Landmark,
  Tag,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

// Copy del panel del comprobante (server#272). El backend manda códigos y el `detail`
// de cada check ya viene en español: acá solo se nombra **qué se comparó**, para que el
// semáforo se lea de un vistazo.

interface CheckMeta {
  label: string
  icon: LucideIcon
}

const CHECK_META: Record<string, CheckMeta> = {
  price: { label: 'Precio del servicio', icon: Tag },
  currency: { label: 'Moneda', icon: Coins },
  amount: { label: 'Monto pagado', icon: Coins },
  beneficiary: { label: 'Destinatario', icon: UserCheck },
  date: { label: 'Fecha del comprobante', icon: CalendarClock },
  reference: { label: 'N.º de transacción', icon: Hash },
  reused: { label: 'Comprobante sin reusar', icon: Copy },
  media: { label: 'Archivo del comprobante', icon: FileImage },
}

/** Un código que el front todavía no conoce se muestra crudo, con su `detail` al lado:
 *  esconder un check es peor que mostrarlo sin traducir (igual que en `flag-badges`). */
export function checkMeta(code: string): CheckMeta {
  return CHECK_META[code] ?? { label: code, icon: CircleHelp }
}

interface ExtractedField {
  key: string
  label: string
  icon: LucideIcon
}

/** Claves de `extracted`, en el orden en que se leen contra la imagen. */
const EXTRACTED_FIELDS: readonly ExtractedField[] = [
  { key: 'amount', label: 'Monto', icon: Coins },
  { key: 'currency', label: 'Moneda', icon: Coins },
  { key: 'paid_at', label: 'Fecha del pago', icon: CalendarClock },
  { key: 'beneficiary', label: 'Destinatario', icon: UserCheck },
  { key: 'reference', label: 'N.º de transacción', icon: Hash },
  { key: 'bank', label: 'Banco', icon: Landmark },
]

const KNOWN_KEYS = new Set(EXTRACTED_FIELDS.map((field) => field.key))

export interface ExtractedRow extends ExtractedField {
  /** `null` = el modelo no pudo leer ese dato (o el backend no mandó la clave). */
  value: string | null
}

/** Filas del bloque "lo que leyó el sistema": los campos conocidos en orden fijo, más
 *  cualquier clave nueva que mande el backend (sin traducir, pero visible). */
export function extractedRows(extracted: Record<string, string | null>): ExtractedRow[] {
  const known = EXTRACTED_FIELDS.map((field) => ({
    ...field,
    value: extracted[field.key] ?? null,
  }))
  const extra = Object.keys(extracted)
    .filter((key) => !KNOWN_KEYS.has(key))
    .map((key) => ({ key, label: key, icon: CircleHelp, value: extracted[key] ?? null }))
  return [...known, ...extra]
}
