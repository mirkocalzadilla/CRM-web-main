'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createService,
  createServiceCategory,
  deleteService,
  deleteServiceCategory,
  listServiceCategories,
  listServices,
  updateService,
  updateServiceCategory,
  uploadAsset,
  deleteAsset,
  type AssetRead,
  type ServiceCategoryCreate,
  type ServiceCategoryRead,
  type ServiceCategoryUpdate,
  type ServiceCreate,
  type ServiceRead,
  type ServiceUpdate,
} from '@/lib/api/catalogo'
import { apiErrorMessage } from '@/lib/api/errors'

export const catalogKeys = {
  // Catálogo del tenant (un solo catálogo por tenant): key única sin agentId.
  services: ['catalog', 'services'] as const,
  categories: ['catalog', 'categories'] as const,
}

function fail(error: unknown, fallback: string): void {
  toast.error(apiErrorMessage(error) ?? fallback)
}

export function useServices() {
  return useQuery<ServiceRead[]>({
    queryKey: catalogKeys.services,
    queryFn: () => listServices(),
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation<ServiceRead, Error, ServiceCreate>({
    mutationFn: (body) => createService(body),
    onSuccess: (service) => {
      toast.success(`Servicio "${service.nombre}" creado`)
      queryClient.invalidateQueries({ queryKey: catalogKeys.services })
    },
    onError: (error) => fail(error, 'No se pudo crear el servicio.'),
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation<ServiceRead, Error, { serviceId: string; body: ServiceUpdate }>({
    mutationFn: ({ serviceId, body }) => updateService(serviceId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.services })
    },
    onError: (error) => fail(error, 'No se pudo actualizar el servicio.'),
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (serviceId) => deleteService(serviceId),
    onSuccess: () => {
      toast.success('Servicio eliminado')
      queryClient.invalidateQueries({ queryKey: catalogKeys.services })
    },
    onError: (error) => fail(error, 'No se pudo eliminar el servicio.'),
  })
}

export function useUploadAsset() {
  return useMutation<AssetRead, Error, File>({
    mutationFn: (file) => uploadAsset(file),
    onError: (error) => fail(error, 'No se pudo subir el material.'),
  })
}

export function useDeleteAsset() {
  return useMutation<void, Error, string>({
    mutationFn: (assetId) => deleteAsset(assetId),
    onError: (error) => fail(error, 'No se pudo eliminar el material.'),
  })
}

// ---------- Categorías (#106) ----------

export function useServiceCategories() {
  return useQuery<ServiceCategoryRead[]>({
    queryKey: catalogKeys.categories,
    queryFn: listServiceCategories,
  })
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation<ServiceCategoryRead, Error, ServiceCategoryCreate>({
    mutationFn: (body) => createServiceCategory(body),
    onSuccess: (category) => {
      toast.success(`Categoría "${category.nombre}" creada`)
      queryClient.invalidateQueries({ queryKey: catalogKeys.categories })
    },
    onError: (error) => fail(error, 'No se pudo crear la categoría.'),
  })
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation<
    ServiceCategoryRead,
    Error,
    { categoryId: string; body: ServiceCategoryUpdate }
  >({
    mutationFn: ({ categoryId, body }) => updateServiceCategory(categoryId, body),
    onSuccess: () => {
      // El rename impacta la categoría anidada en los servicios → refrescar ambos.
      queryClient.invalidateQueries({ queryKey: catalogKeys.categories })
      queryClient.invalidateQueries({ queryKey: catalogKeys.services })
    },
    onError: (error) => fail(error, 'No se pudo actualizar la categoría.'),
  })
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (categoryId) => deleteServiceCategory(categoryId),
    onSuccess: () => {
      // Borrar deja los servicios sin categoría → refrescar ambos.
      toast.success('Categoría eliminada')
      queryClient.invalidateQueries({ queryKey: catalogKeys.categories })
      queryClient.invalidateQueries({ queryKey: catalogKeys.services })
    },
    onError: (error) => fail(error, 'No se pudo eliminar la categoría.'),
  })
}
