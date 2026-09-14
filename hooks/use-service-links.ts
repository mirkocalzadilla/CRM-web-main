'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createServiceLink,
  deleteServiceLink,
  listServiceLinks,
  updateServiceLink,
  type ServiceLinkCreate,
  type ServiceLinkRead,
  type ServiceLinkUpdate,
} from '@/lib/api/service-links'
import { apiErrorMessage } from '@/lib/api/errors'

export const serviceLinkKeys = {
  forService: (serviceId: string) => ['catalog', 'service-links', serviceId] as const,
}

function fail(error: unknown, fallback: string): void {
  toast.error(apiErrorMessage(error) ?? fallback)
}

export function useServiceLinks(serviceId: string) {
  return useQuery<ServiceLinkRead[]>({
    queryKey: serviceLinkKeys.forService(serviceId),
    queryFn: () => listServiceLinks(serviceId),
  })
}

export function useCreateServiceLink(serviceId: string) {
  const queryClient = useQueryClient()
  return useMutation<ServiceLinkRead, Error, ServiceLinkCreate>({
    mutationFn: (body) => createServiceLink(serviceId, body),
    onSuccess: () => {
      toast.success('Link agregado')
      queryClient.invalidateQueries({ queryKey: serviceLinkKeys.forService(serviceId) })
    },
    onError: (error) => fail(error, 'No se pudo agregar el link.'),
  })
}

export function useUpdateServiceLink(serviceId: string) {
  const queryClient = useQueryClient()
  return useMutation<ServiceLinkRead, Error, { linkId: string; body: ServiceLinkUpdate }>({
    mutationFn: ({ linkId, body }) => updateServiceLink(linkId, body),
    onSuccess: () => {
      toast.success('Link actualizado')
      queryClient.invalidateQueries({ queryKey: serviceLinkKeys.forService(serviceId) })
    },
    onError: (error) => fail(error, 'No se pudo actualizar el link.'),
  })
}

export function useDeleteServiceLink(serviceId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (linkId) => deleteServiceLink(linkId),
    onSuccess: () => {
      toast.success('Link eliminado')
      queryClient.invalidateQueries({ queryKey: serviceLinkKeys.forService(serviceId) })
    },
    onError: (error) => fail(error, 'No se pudo eliminar el link.'),
  })
}
