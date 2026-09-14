'use client'

import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useExportPayments } from '@/hooks/use-payments'
import { localDayIso } from '@/lib/api/payments'

/** El día se manda explícito y en hora **local**: "hoy" para quien concilia es su día,
 *  no el del servidor (sin el parámetro el backend usa hoy en UTC). "Ayer" está porque
 *  el extracto de un día se consigue al día siguiente. */
export function PaymentsExportMenu() {
  const exportMutation = useExportPayments()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={exportMutation.isPending}
          className="gap-2 border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
        >
          <Download className="size-4" />
          {exportMutation.isPending ? 'Descargando…' : 'Descargar CSV'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-white/10 bg-zinc-950 text-zinc-200">
        <DropdownMenuItem onSelect={() => exportMutation.mutate(localDayIso())}>
          Pagos de hoy
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportMutation.mutate(localDayIso(-1))}>
          Pagos de ayer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
