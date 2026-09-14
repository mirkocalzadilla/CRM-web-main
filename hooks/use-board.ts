'use client'

import { useQuery } from '@tanstack/react-query'

import { getBoards, type Boards } from '@/lib/api/crm'
import { POLL_BOARD_MS } from '@/lib/crm/realtime'

export const boardKeys = {
  all: ['crm', 'boards'] as const,
}

/** Boards reales del backend; polling-puente hasta el SSE de slice 2b. */
export function useBoard() {
  return useQuery<Boards>({
    queryKey: boardKeys.all,
    queryFn: getBoards,
    refetchInterval: POLL_BOARD_MS,
  })
}
