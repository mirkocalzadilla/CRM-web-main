'use client'

import { useState } from 'react'
import { CircleCheck, PenLine } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useValidateReceipt } from '@/hooks/use-receipt'
import { ReceiptOverrideDialog } from '@/components/crm/receipt/receipt-override-dialog'

/** Las dos formas de aprobar el pago: un click cuando los checks cerraron, o con nota
 *  obligatoria cuando no. Validar también dispara la entrega (una sola operación en el
 *  backend, server#272). */
export function ReceiptActions({ cardId, passed }: { cardId: string; passed: boolean }) {
  const validate = useValidateReceipt(cardId)
  const [overrideOpen, setOverrideOpen] = useState(false)

  if (passed) {
    return (
      <Button
        size="sm"
        disabled={validate.isPending}
        onClick={() => validate.mutate()}
        className="gap-1.5 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white hover:from-emerald-400 hover:to-emerald-600"
      >
        <CircleCheck className="size-3.5" />
        {validate.isPending ? 'Validando…' : 'Validar pago y entregar'}
      </Button>
    )
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOverrideOpen(true)}
        className="gap-1.5 bg-gradient-to-b from-violet-500 to-violet-700 text-white hover:from-violet-400 hover:to-violet-600"
      >
        <PenLine className="size-3.5" />
        Validar con nota
      </Button>
      <ReceiptOverrideDialog
        cardId={cardId}
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
      />
    </>
  )
}
