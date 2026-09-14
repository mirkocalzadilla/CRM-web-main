'use client'

import { useEffect, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsMobile } from '@/hooks/use-mobile'
import { OpportunityDetails } from '@/components/crm/opportunity-details'
import { ConversationPanel } from '@/components/crm/conversation-panel'

interface CardDetailDialogProps {
  cardId: string | null
  onClose: () => void
}

const TAB_TRIGGER = 'data-[state=active]:bg-violet-600 data-[state=active]:text-white'

/** Popup 50/50 del detalle de oportunidad (#75): izquierda detalles + historial de
 *  movimientos, derecha el chat (reusa `ConversationPanel`). En mobile colapsa a tabs
 *  Detalles/Chat. Cierra con X / overlay / Esc → `onClose`. */
export function CardDetailDialog({ cardId, onClose }: CardDetailDialogProps) {
  const isMobile = useIsMobile()
  // Conserva el último card abierto para no parpadear durante la animación de cierre,
  // cuando `cardId` ya pasó a null pero el popup sigue desmontándose.
  const [renderId, setRenderId] = useState<string | null>(null)
  useEffect(() => {
    if (cardId) setRenderId(cardId)
  }, [cardId])

  return (
    <Dialog
      open={cardId !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden border-white/10 bg-zinc-950 p-0 sm:max-w-5xl">
        <DialogTitle className="sr-only">Detalle de la oportunidad</DialogTitle>
        <DialogDescription className="sr-only">
          Detalles, historial de movimientos y conversación del lead.
        </DialogDescription>

        {isMobile ? (
          <Tabs defaultValue="detalles" className="flex min-h-0 flex-1 flex-col gap-0">
            <TabsList className="m-3 w-fit border border-white/5 bg-white/[0.03]">
              <TabsTrigger value="detalles" className={TAB_TRIGGER}>
                Detalles
              </TabsTrigger>
              <TabsTrigger value="chat" className={TAB_TRIGGER}>
                Chat
              </TabsTrigger>
            </TabsList>
            <TabsContent value="detalles" className="min-h-0">
              <OpportunityDetails cardId={renderId} onDeleted={onClose} />
            </TabsContent>
            <TabsContent value="chat" className="flex min-h-0 flex-col">
              <ConversationPanel cardId={renderId} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-2">
            <div className="min-h-0 border-r border-white/5">
              <OpportunityDetails cardId={renderId} onDeleted={onClose} />
            </div>
            <div className="flex min-h-0 flex-col">
              <ConversationPanel cardId={renderId} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
