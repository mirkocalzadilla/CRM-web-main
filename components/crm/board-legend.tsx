'use client'

import {
  BotOff,
  Clock,
  Flame,
  HelpCircle,
  Snowflake,
  Thermometer,
  TriangleAlert,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Leyenda del tablero (#133): decodifica íconos y colores de las cards para que
 *  el significado no dependa de descubrir cada tooltip. */
export function BoardLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Leyenda del tablero"
          className="size-10 rounded-full text-zinc-500 hover:bg-white/5 hover:text-white"
        >
          <HelpCircle className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 border-white/10 bg-zinc-950 p-3 text-white">
        <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Leyenda
        </p>
        <ul className="space-y-2 text-xs text-zinc-300">
          <li className="flex items-center gap-2">
            <Flame className="size-3.5 shrink-0 text-red-400" />
            Lead caliente · listo para cerrar
          </li>
          <li className="flex items-center gap-2">
            <Thermometer className="size-3.5 shrink-0 text-amber-400" />
            Lead tibio · interesado, falta empujar
          </li>
          <li className="flex items-center gap-2">
            <Snowflake className="size-3.5 shrink-0 text-sky-400" />
            Lead frío · recién llega o sin señales
          </li>
          <li className="flex items-center gap-2">
            <TriangleAlert className="size-3.5 shrink-0 text-amber-400" />
            Pidió algo fuera del catálogo
          </li>
          <li className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0 text-amber-400" />
            Avisos en ámbar · la entrega necesita una mano (pasá el mouse por el aviso)
          </li>
          <li className="flex items-center gap-2">
            <BotOff className="size-3.5 shrink-0 text-zinc-400" />
            Agente IA apagado · atendés vos
          </li>
          <li className="flex items-center gap-2">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500/70" />
              <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
            </span>
            Mensaje sin responder · te esperan
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold text-white">
              3
            </span>
            Leads derivados esperando en ese pipeline
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  )
}
