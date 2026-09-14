'use client'

import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createCard,
  deleteCard,
  generateEntry,
  moveCard,
  sendHumanMedia,
  sendHumanReply,
  sendPaymentQr,
  setAiActive,
  updateCard,
  updateCardServices,
  type AiActive,
  type Boards,
  type Card,
  type CardCreateInput,
  type CardDetail,
  type CardService,
  type CardUpdateInput,
  type QrEntryOut,
  type ThreadMessage,
} from '@/lib/api/crm'
import { apiErrorMessage } from '@/lib/api/errors'
import { boardKeys } from '@/hooks/use-board'
import { cardKeys } from '@/hooks/use-card'

interface MoveArgs {
  cardId: string
  stageId: string
  // Motivo del move (#253); solo lo manda el flujo de Descalificado. El drag normal no.
  reason?: string
}

interface MoveContext {
  previous?: Boards
}

/** Mueve `cardId` al `stageId` reasignando su stage en el cache (inmutable). */
function applyMove(boards: Boards, cardId: string, stageId: string): Boards {
  let moved: Card | undefined
  for (const pipeline of boards.pipelines) {
    for (const stage of pipeline.stages) {
      const found = stage.cards.find((c) => c.id === cardId)
      if (found) {
        moved = { ...found, stage_id: stageId }
        break
      }
    }
    if (moved) break
  }
  if (!moved) return boards

  const card = moved
  return {
    pipelines: boards.pipelines.map((pipeline) => ({
      ...pipeline,
      stages: pipeline.stages.map((stage) => {
        const without = stage.cards.filter((c) => c.id !== cardId)
        return stage.id === stageId
          ? { ...stage, cards: [...without, card] }
          : { ...stage, cards: without }
      }),
    })),
  }
}

/** Mover card entre stages (POST move) con update optimista + rollback. */
export function useMoveCard() {
  const queryClient = useQueryClient()

  return useMutation<Card, Error, MoveArgs, MoveContext>({
    mutationFn: ({ cardId, stageId, reason }) => moveCard(cardId, stageId, reason),
    onMutate: async ({ cardId, stageId }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.all })
      const previous = queryClient.getQueryData<Boards>(boardKeys.all)
      if (previous) {
        queryClient.setQueryData<Boards>(
          boardKeys.all,
          applyMove(previous, cardId, stageId),
        )
      }
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.all, context.previous)
      }
      // 422 del server = regla de negocio (ej. ganar exige nombre, server#241):
      // se muestra su mensaje en vez del genérico.
      const detail =
        isAxiosError(error) && error.response?.status === 422
          ? apiErrorMessage(error)
          : null
      toast.error(detail ?? 'No se pudo mover la tarjeta. Reintentá.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

interface AiActiveArgs {
  conversationId: string
  isAiActive: boolean
}

interface AiActiveContext {
  previous?: CardDetail
}

/** Genera entrada QR para una card en "Pago validado" (POST generate-entry).
 * El backend ahora rechaza lo que no es presencial (server#270: sin servicio aceptado,
 * con más de uno, virtual o sin modalidad) con un `detail` explicativo. Ese mensaje se
 * muestra tal cual: el viejo "La entrada ya fue generada" era falso para esos casos. */
export function useGenerateEntry(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<QrEntryOut, Error>({
    mutationFn: () => generateEntry(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? 'No se pudo generar la entrada. Reintentá.')
    },
  })
}

/** Reply humano por WhatsApp en takeover (POST send). Refresca el hilo al éxito. */
export function useSendHumanReply(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<ThreadMessage, Error, string>({
    mutationFn: (text: string) => sendHumanReply(cardId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
    },
    onError: () => {
      toast.error('No se pudo enviar el mensaje. Reintentá.')
    },
  })
}

/** Adjunto humano en takeover (POST send-media, #169). Refresca el hilo al éxito.
 * El 400 (archivo inválido) y el 502 (ventana de 24 h cerrada) traen mensaje del server. */
export function useSendHumanMedia(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<ThreadMessage, Error, { file: File; caption: string }>({
    mutationFn: ({ file, caption }) => sendHumanMedia(cardId, file, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? 'No se pudo enviar el archivo. Reintentá.')
    },
  })
}

/** Envía el QR de pago del sistema en takeover (POST send-qr, #169). */
export function useSendPaymentQr(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<ThreadMessage, Error>({
    mutationFn: () => sendPaymentQr(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      toast.success('QR de pago enviado.')
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? 'No se pudo enviar el QR de pago. Reintentá.')
    },
  })
}

/** Toggle IA por conversación (PUT ai-active) con update optimista del detalle.
 * El Switch lee `card.is_ai_active`; el optimismo + rollback evita el desfasaje
 * que mostraba "on" tras un handoff. */
export function useSetAiActive(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<AiActive, Error, AiActiveArgs, AiActiveContext>({
    mutationFn: ({ conversationId, isAiActive }) =>
      setAiActive(conversationId, isAiActive),
    onMutate: async ({ isAiActive }) => {
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(cardId) })
      const previous = queryClient.getQueryData<CardDetail>(cardKeys.detail(cardId))
      if (previous) {
        queryClient.setQueryData<CardDetail>(cardKeys.detail(cardId), {
          ...previous,
          is_ai_active: isAiActive,
        })
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cardKeys.detail(cardId), context.previous)
      }
      toast.error('No se pudo cambiar el estado del agente IA.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

/** Alta manual de oportunidad (#54). Invalida el board al éxito. */
export function useCreateCard() {
  const queryClient = useQueryClient()

  return useMutation<Card, Error, CardCreateInput>({
    mutationFn: (input) => createCard(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      toast.success('Oportunidad creada.')
    },
    onError: () => {
      toast.error('No se pudo crear la oportunidad. Revisá los datos.')
    },
  })
}

/** Edita nombre/notas de la oportunidad. Invalida board + detalle al éxito. */
export function useUpdateCard(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<Card, Error, CardUpdateInput>({
    mutationFn: (input) => updateCard(cardId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      toast.success('Cambios guardados.')
    },
    onError: () => {
      toast.error('No se pudieron guardar los cambios.')
    },
  })
}

/** Asigna manualmente el set de servicios a la oportunidad (#132). Refresca el detalle. */
export function useUpdateCardServices(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<CardService[], Error, string[]>({
    mutationFn: (serviceIds) => updateCardServices(cardId, serviceIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? 'No se pudieron guardar los servicios.')
    },
  })
}

/** Baja de oportunidad (borrado duro). Invalida el board al éxito. */
export function useDeleteCard() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (cardId) => deleteCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
      toast.success('Oportunidad eliminada.')
    },
    onError: () => {
      toast.error('No se pudo eliminar la oportunidad.')
    },
  })
}
