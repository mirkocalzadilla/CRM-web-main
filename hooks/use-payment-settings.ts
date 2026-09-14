'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  deletePaymentQr,
  getPaymentSettings,
  updatePaymentSettings,
  uploadPaymentQr,
  type PaymentSettingsRead,
  type PaymentSettingsUpdate,
} from '@/lib/api/payment-settings'
import { apiErrorMessage } from '@/lib/api/errors'

export const paymentSettingsKeys = {
  current: ['crm', 'payment-settings'] as const,
}

export function usePaymentSettings() {
  return useQuery<PaymentSettingsRead>({
    queryKey: paymentSettingsKeys.current,
    queryFn: getPaymentSettings,
  })
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient()
  return useMutation<PaymentSettingsRead, Error, PaymentSettingsUpdate>({
    mutationFn: (body) => updatePaymentSettings(body),
    onSuccess: (settings) => {
      toast.success('Cambios guardados.')
      queryClient.setQueryData(paymentSettingsKeys.current, settings)
    },
    onError: (error) => toast.error(apiErrorMessage(error) ?? 'No se pudo guardar la config de pagos.'),
  })
}

export function useUploadPaymentQr() {
  const queryClient = useQueryClient()
  return useMutation<PaymentSettingsRead, Error, File>({
    mutationFn: (file) => uploadPaymentQr(file),
    onSuccess: (settings) => {
      toast.success('QR de pago actualizado.')
      queryClient.setQueryData(paymentSettingsKeys.current, settings)
    },
    onError: (error) => toast.error(apiErrorMessage(error) ?? 'No se pudo subir el QR.'),
  })
}

export function useDeletePaymentQr() {
  const queryClient = useQueryClient()
  return useMutation<PaymentSettingsRead, Error, void>({
    mutationFn: () => deletePaymentQr(),
    onSuccess: (settings) => {
      toast.success('Se volvió al QR global de la plataforma.')
      queryClient.setQueryData(paymentSettingsKeys.current, settings)
    },
    onError: (error) => toast.error(apiErrorMessage(error) ?? 'No se pudo eliminar el QR.'),
  })
}
