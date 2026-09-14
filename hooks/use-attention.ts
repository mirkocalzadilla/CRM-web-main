'use client'

import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { markCardAttended } from '@/lib/api/crm'
import { useBoard, boardKeys } from '@/hooks/use-board'
import { cardKeys } from '@/hooks/use-card'
import {
  collectAttention,
  countBlocking,
  type AttentionItem,
} from '@/lib/crm/attention'

export interface AttentionQueue {
  items: AttentionItem[]
  /** Cuántas no avanzan sin que alguien decida: es el número que va al contador. */
  blocking: number
  isLoading: boolean
  isError: boolean
}

/** La cola se deriva del board, no de un endpoint propio: `useBoard` ya trae todas las
 *  cards con sus avisos y React Query comparte la misma query entre pantallas, así que
 *  esto no agrega tráfico y se actualiza con el mismo realtime que el tablero. */
export function useAttention(): AttentionQueue {
  const { data, isLoading, isError } = useBoard()
  const items = useMemo(() => collectAttention(data), [data])
  return { items, blocking: countBlocking(items), isLoading, isError }
}

/** "Atendido": una persona declara que ahí no hay nada pendiente. Es la salida para lo
 *  que ninguna regla acierta — la conversación que terminó con un "gracias". */
export function useMarkAttended() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (cardId) => markCardAttended(cardId),
    onSuccess: (_data, cardId) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      toast.success('Marcada como atendida.', {
        description: 'Vuelve a la cola si el lead escribe de nuevo.',
      })
    },
    onError: () => {
      toast.error('No se pudo marcar como atendida.')
    },
  })
}
