'use client'

import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useExportContacts } from '@/hooks/use-contacts'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

const BUTTON_CLASS = 'gap-2 border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]'

/** Export CSV del Embudo (#113): todos los leads o solo fríos (recontacto manual).
 * Oculto para staff — extracción masiva; el endpoint igual responde 403 (server#176). */
export function LeadsExportMenu({ className }: { className?: string }) {
  const { canExportContacts } = usePermissions()
  const exportMutation = useExportContacts()

  if (!canExportContacts) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={exportMutation.isPending}
          className={cn(BUTTON_CLASS, className)}
        >
          <Download className="size-4" />
          {exportMutation.isPending ? 'Exportando…' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-white/10 bg-zinc-950 text-zinc-200">
        <DropdownMenuItem onSelect={() => exportMutation.mutate({})}>
          Todos los leads
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportMutation.mutate({ rating: 'cold' })}>
          Solo leads fríos
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Export CSV de la sección Contactos (#113): un click baja todos los contactos
 * registrados, sin menú. Oculto para staff. */
export function ContactsExportButton({ className }: { className?: string }) {
  const { canExportContacts } = usePermissions()
  const exportMutation = useExportContacts()

  if (!canExportContacts) return null

  return (
    <Button
      variant="outline"
      disabled={exportMutation.isPending}
      onClick={() => exportMutation.mutate({ scope: 'contacts' })}
      className={cn(BUTTON_CLASS, className)}
    >
      <Download className="size-4" />
      {exportMutation.isPending ? 'Exportando…' : 'Exportar'}
    </Button>
  )
}
