'use client'

import { CameraOff, RotateCcw, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { problemCopy } from '@/components/crm/entries/labels'
import type { CameraProblem as Problem } from '@/hooks/use-qr-scanner'

interface CameraProblemProps {
  problem: Problem
  onRetry: () => void
  onOpenList: () => void
}

/** Cuando la cámara no abre, la pantalla dice **qué hacer** y ofrece la lista: un problema
 *  técnico no puede dejar afuera a alguien que pagó. */
export function CameraProblemPanel({ problem, onRetry, onOpenList }: CameraProblemProps) {
  const { title, hint } = problemCopy(problem)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/30 bg-amber-950/40 p-5">
      <div className="flex items-center gap-3">
        <CameraOff className="size-9 shrink-0 text-amber-300" />
        <p className="text-2xl leading-tight font-bold text-amber-200">{title}</p>
      </div>
      <p className="text-base leading-snug text-zinc-200">{hint}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={onOpenList}
          className="h-14 flex-1 gap-2 bg-white text-base font-semibold text-black hover:bg-zinc-200"
        >
          <Users className="size-5" /> Lista de asistencia
        </Button>
        <Button
          variant="outline"
          onClick={onRetry}
          className="h-14 flex-1 gap-2 border-white/15 bg-white/[0.04] text-base text-white"
        >
          <RotateCcw className="size-5" /> Volver a intentar
        </Button>
      </div>
    </div>
  )
}
