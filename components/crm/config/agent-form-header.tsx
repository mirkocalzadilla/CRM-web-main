'use client'

import { Button } from '@/components/ui/button'

interface AgentFormHeaderProps {
  title: string
  version: number | null
  isDirty: boolean
  isSaving: boolean
}

/** Cabecera sticky del editor del agente (#136): Guardar siempre a la vista aunque el
 *  prompt sea largo, con aviso visible de cambios sin guardar. */
export function AgentFormHeader({ title, version, isDirty, isSaving }: AgentFormHeaderProps) {
  return (
    <div className="sticky top-0 z-10 -mx-2 flex items-center justify-between rounded-b-xl bg-black/70 px-2 py-3 backdrop-blur-xl">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <div className="flex items-center gap-2">
          {version !== null ? (
            <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-500/30">
              Versión {version}
            </span>
          ) : (
            <p className="text-sm text-zinc-500">Sin versiones guardadas</p>
          )}
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              <span className="size-1.5 rounded-full bg-amber-400" />
              Cambios sin guardar
            </span>
          )}
        </div>
      </div>
      <Button
        type="submit"
        disabled={!isDirty || isSaving}
        className="h-10 gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 px-5 text-sm font-medium text-white hover:from-violet-400 hover:to-violet-600 disabled:opacity-50"
      >
        {isSaving ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  )
}
