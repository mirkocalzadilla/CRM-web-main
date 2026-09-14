'use client'

import { ScanLine, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

export type ScannerMode = 'escaner' | 'lista'

const MODES: readonly { value: ScannerMode; label: string; icon: typeof ScanLine }[] = [
  { value: 'escaner', label: 'Leer entradas', icon: ScanLine },
  { value: 'lista', label: 'Lista', icon: Users },
]

interface ScannerModeToggleProps {
  mode: ScannerMode
  onChange: (mode: ScannerMode) => void
}

/** Dos botones grandes en vez de tabs: en la puerta se toca con el pulgar, de una mano y
 *  sin mirar demasiado. */
export function ScannerModeToggle({ mode, onChange }: ScannerModeToggleProps) {
  return (
    <div role="tablist" className="flex gap-2">
      {MODES.map(({ value, label, icon: Icon }) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            className={cn(
              'flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border text-base font-medium transition-colors',
              active
                ? 'border-violet-500/40 bg-violet-500/20 text-white'
                : 'border-white/10 bg-white/[0.03] text-zinc-400',
            )}
          >
            <Icon className="size-5 shrink-0" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
