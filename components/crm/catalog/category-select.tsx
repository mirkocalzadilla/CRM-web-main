'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useServiceCategories } from '@/hooks/use-catalogo'

// Radix no admite SelectItem con value="" → usamos un centinela para "sin categoría".
const NONE = 'none'

/** Dropdown de categoría dinámica (#106). `value` '' = sin categoría. */
export function CategorySelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { data: categories } = useServiceCategories()
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
      <SelectTrigger className="w-full border-white/10 bg-white/[0.03] text-sm text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Sin categoría</SelectItem>
        {(categories ?? []).map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
