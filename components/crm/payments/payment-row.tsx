'use client'

import { CircleCheck, Eye, TicketX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatTicketTime } from '@/lib/format'
import type { PendingPayment } from '@/lib/api/payments'
import { useConfirmPayment } from '@/hooks/use-payments'
import { NO_VALUE, paymentAmount } from '@/components/crm/payments/labels'

/** Un dato ilegible del comprobante se muestra como vacío, no se rellena con nada. */
function Value({ text, className }: { text: string | null; className?: string }) {
  if (!text) return <span className="text-zinc-600">{NO_VALUE}</span>
  return (
    <span title={text} className={className}>
      {text}
    </span>
  )
}

interface PaymentRowProps {
  payment: PendingPayment
  onOpenCard: (cardId: string) => void
  onReject: (payment: PendingPayment) => void
}

/** Una fila de la cola: lo necesario para buscar el movimiento en el extracto y las dos
 *  decisiones. Confirmar es 1 click; rechazar abre el diálogo con la nota obligatoria,
 *  porque revoca la entrada. */
export function PaymentRow({ payment, onOpenCard, onReject }: PaymentRowProps) {
  const confirm = useConfirmPayment()

  return (
    <TableRow className="border-white/5 hover:bg-white/[0.02]">
      <TableCell className="text-sm font-medium whitespace-nowrap text-white">
        <Value text={paymentAmount(payment)} />
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap text-zinc-300">
        <Value text={payment.paid_at} />
      </TableCell>
      <TableCell className="max-w-40 truncate text-sm text-zinc-300">
        <Value text={payment.beneficiary} />
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap text-zinc-200">
        <Value text={payment.reference} className="font-mono select-all" />
      </TableCell>
      <TableCell className="max-w-32 truncate text-sm text-zinc-400">
        <Value text={payment.bank} />
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap text-zinc-500">
        {formatTicketTime(payment.created_at)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Ver la oportunidad"
                onClick={() => onOpenCard(payment.card_id)}
                className="size-8 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <Eye className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver la oportunidad y su comprobante</TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            disabled={confirm.isPending}
            onClick={() => confirm.mutate(payment.id)}
            className="gap-1.5 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 hover:to-emerald-600"
          >
            <CircleCheck className="size-3.5" />
            {confirm.isPending ? 'Confirmando…' : 'Confirmar'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(payment)}
            className="gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
          >
            <TicketX className="size-3.5" />
            Rechazar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
