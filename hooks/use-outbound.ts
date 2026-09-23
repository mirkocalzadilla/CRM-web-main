'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cardKeys } from '@/hooks/use-card'
import {
  addOptOut,
  getOutboundSettings,
  listCardOutbound,
  listOptOuts,
  listOutboundMessages,
  MANUAL_REASON_LABELS,
  reactivateCard,
  remindCard,
  updateOutboundSettings,
  type ManualSendResult,
  type OutboundMessageFilters,
  type OutboundSettings,
  type OutboundSettingsUpdate,
} from '@/lib/api/outbound'
import { apiErrorMessage } from '@/lib/api/errors'

export const outboundKeys = {
  all: ['outbound'] as const,
  messages: (filters: OutboundMessageFilters) => ['outbound', 'messages', filters] as const,
  card: (cardId: string) => ['outbound', 'card', cardId] as const,
  settings: ['outbound', 'settings'] as const,
  optOuts: ['outbound', 'opt-outs'] as const,
}

export function useOutboundMessages(filters: OutboundMessageFilters) {
  return useQuery({
    queryKey: outboundKeys.messages(filters),
    queryFn: () => listOutboundMessages(filters),
    refetchInterval: 30_000, // los estados de Meta llegan por webhook, sin SSE propio
  })
}

export function useCardOutbound(cardId: string | null) {
  return useQuery({
    queryKey: outboundKeys.card(cardId ?? ''),
    queryFn: () => listCardOutbound(cardId ?? ''),
    enabled: cardId !== null,
  })
}

export function useOutboundSettings() {
  return useQuery<OutboundSettings>({
    queryKey: outboundKeys.settings,
    queryFn: getOutboundSettings,
  })
}

export function useUpdateOutboundSettings() {
  const queryClient = useQueryClient()
  return useMutation<OutboundSettings, Error, OutboundSettingsUpdate>({
    mutationFn: updateOutboundSettings,
    onSuccess: (settings) => {
      toast.success('Seguimientos guardados.')
      queryClient.setQueryData(outboundKeys.settings, settings)
    },
    onError: (error) =>
      toast.error(apiErrorMessage(error) ?? 'No se pudo guardar la configuración.'),
  })
}

export function useOptOuts() {
  return useQuery({ queryKey: outboundKeys.optOuts, queryFn: listOptOuts })
}

export function useAddOptOut() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: addOptOut,
    onSuccess: () => {
      toast.success('Número dado de baja: no recibirá más envíos automáticos.')
      queryClient.invalidateQueries({ queryKey: outboundKeys.optOuts })
    },
    onError: (error) => toast.error(apiErrorMessage(error) ?? 'No se pudo registrar la baja.'),
  })
}

function reportManual(result: ManualSendResult, okText: string) {
  if (result.sent) {
    toast.success(okText)
    return
  }
  toast.error(MANUAL_REASON_LABELS[result.reason ?? ''] ?? 'No se pudo enviar.')
}

export function useRemindCard(cardId: string) {
  const queryClient = useQueryClient()
  return useMutation<ManualSendResult, Error>({
    mutationFn: () => remindCard(cardId),
    onSuccess: (result) => {
      reportManual(result, 'Recordatorio enviado por WhatsApp.')
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      queryClient.invalidateQueries({ queryKey: outboundKeys.all })
    },
    onError: (error) => toast.error(apiErrorMessage(error) ?? 'No se pudo enviar el recordatorio.'),
  })
}

export function useReactivateCard(cardId: string) {
  const queryClient = useQueryClient()
  return useMutation<ManualSendResult, Error>({
    mutationFn: () => reactivateCard(cardId),
    onSuccess: (result) => {
      reportManual(result, 'Mensaje de reactivación enviado.')
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(cardId) })
      queryClient.invalidateQueries({ queryKey: outboundKeys.all })
    },
    onError: (error) => toast.error(apiErrorMessage(error) ?? 'No se pudo enviar la reactivación.'),
  })
}
