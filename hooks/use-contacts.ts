'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createContact,
  deleteContact,
  exportContacts,
  listContacts,
  updateContact,
  type ContactCreate,
  type ContactRead,
  type ContactUpdate,
  type ContactsExport,
  type ExportParams,
} from '@/lib/api/contacts'
import { apiErrorMessage } from '@/lib/api/errors'

export const contactKeys = {
  all: ['crm', 'contacts'] as const,
}

export function useContacts() {
  return useQuery<ContactRead[]>({
    queryKey: contactKeys.all,
    queryFn: listContacts,
  })
}

function fail(error: unknown, fallback: string): void {
  toast.error(apiErrorMessage(error) ?? fallback)
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation<ContactRead, Error, ContactCreate>({
    mutationFn: (body) => createContact(body),
    onSuccess: () => {
      toast.success('Contacto creado')
      queryClient.invalidateQueries({ queryKey: contactKeys.all })
    },
    onError: (error) => fail(error, 'No se pudo crear el contacto.'),
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation<ContactRead, Error, { contactId: string; body: ContactUpdate }>({
    mutationFn: ({ contactId, body }) => updateContact(contactId, body),
    onSuccess: () => {
      toast.success('Contacto actualizado')
      queryClient.invalidateQueries({ queryKey: contactKeys.all })
    },
    onError: (error) => fail(error, 'No se pudo actualizar el contacto.'),
  })
}

/** Baja el CSV de leads/contactos y dispara la descarga en el browser (#113). */
export function useExportContacts() {
  return useMutation<ContactsExport, Error, ExportParams>({
    mutationFn: (params) => exportContacts(params),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('Export descargado')
    },
    onError: (error) => fail(error, 'No se pudo exportar los contactos.'),
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (contactId) => deleteContact(contactId),
    onSuccess: () => {
      toast.success('Contacto eliminado')
      queryClient.invalidateQueries({ queryKey: contactKeys.all })
    },
    onError: (error) => fail(error, 'No se pudo eliminar el contacto.'),
  })
}
