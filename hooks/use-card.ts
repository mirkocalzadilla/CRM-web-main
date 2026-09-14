'use client'

import { useQuery } from '@tanstack/react-query'

import { getCard, type CardDetail } from '@/lib/api/crm'
import { POLL_CARD_MS } from '@/lib/crm/realtime'

export const cardKeys = {
  detail: (cardId: string) => ['crm', 'card', cardId] as const,
}

/** Detalle de una card con su hilo espejo; refetch más frecuente (conversación activa). */
export function useCard(cardId: string | null) {
  return useQuery<CardDetail>({
    queryKey: cardKeys.detail(cardId ?? ''),
    queryFn: () => getCard(cardId as string),
    enabled: Boolean(cardId),
    refetchInterval: POLL_CARD_MS,
  })
}
