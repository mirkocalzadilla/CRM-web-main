'use client'

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PendingPayment } from '@/lib/api/payments'
import { PaymentRow } from '@/components/crm/payments/payment-row'

/** Orden de lectura contra el extracto: primero el monto y la fecha (para ubicar el
 *  movimiento), después el número de transacción (para confirmarlo). */
const COLUMNS: readonly string[] = [
  'Monto',
  'Fecha del pago',
  'Beneficiario',
  'N.º de transacción',
  'Banco',
  'Recibido',
]

interface PaymentsTableProps {
  payments: PendingPayment[]
  onOpenCard: (cardId: string) => void
  onReject: (payment: PendingPayment) => void
}

/** Cola de pagos por confirmar. El orden lo manda el backend (los más viejos primero):
 *  no se reordena acá, el que espera más es el que hay que mirar antes. */
export function PaymentsTable({ payments, onOpenCard, onReject }: PaymentsTableProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02]">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            {COLUMNS.map((column) => (
              <TableHead key={column} className="whitespace-nowrap text-zinc-400">
                {column}
              </TableHead>
            ))}
            <TableHead className="text-right text-zinc-400">Conciliación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onOpenCard={onOpenCard}
              onReject={onReject}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
