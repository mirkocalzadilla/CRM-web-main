'use client'

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { MODALITY_NONE } from '@/components/crm/catalog/labels'
import { ServiceConversationSection } from '@/components/crm/catalog/service-conversation-section'
import { ServiceDeliverySection } from '@/components/crm/catalog/service-delivery-section'
import { ServiceIdentitySection } from '@/components/crm/catalog/service-identity-section'
import { ServicePreview } from '@/components/crm/catalog/service-preview'
import { Hint, serviceDefaults, slugify } from '@/components/crm/catalog/service-form'
import { useCreateService, useUpdateService } from '@/hooks/use-catalogo'
import type { ServiceRead } from '@/lib/api/catalogo'

interface ServiceEditorProps {
  service: ServiceRead | null
  defaultOrden: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tras crear un servicio con entrega, el padre lo pasa a modo edición: los links
   *  necesitan el id, y "cerrá y volvé a abrir" era el paso que todos se salteaban. */
  onCreated: (service: ServiceRead) => void
}

export function ServiceEditor({
  service,
  defaultOrden,
  open,
  onOpenChange,
  onCreated,
}: ServiceEditorProps) {
  const isEdit = service !== null
  const create = useCreateService()
  const update = useUpdateService()
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({ defaultValues: serviceDefaults(service), mode: 'onChange' })
  const values = watch()

  // El slug se autogenera del nombre hasta que el operador lo toca a mano: es el campo
  // que más frenaba el alta ("¿qué pongo acá?") para un identificador interno.
  const slugTouched = useRef(false)
  useEffect(() => {
    if (isEdit || slugTouched.current) return
    setValue('slug', slugify(values.nombre), { shouldValidate: true })
  }, [values.nombre, isEdit, setValue])

  const onSubmit = handleSubmit(async (form) => {
    // `null` explícito borra el valor en el PUT parcial del backend (#178).
    const base = {
      nombre: form.nombre,
      category_id: form.category_id || null,
      resumen: form.resumen,
      detalle: form.detalle.trim() || null,
      precio: form.precio,
      moneda: form.moneda,
      flujo_cierre: form.flujo_cierre,
      modality: form.modality === MODALITY_NONE ? null : form.modality,
      price_amount: form.price_amount.trim() || null,
    }
    if (isEdit) {
      await update.mutateAsync({
        serviceId: service.id,
        body: { ...base, is_active: form.is_active },
      })
      toast.success('Servicio actualizado')
      onOpenChange(false)
      return
    }
    const created = await create.mutateAsync({ ...base, slug: form.slug, orden: defaultOrden })
    if (base.modality !== null) {
      // Con entrega configurada faltan los links: el editor queda abierto en modo
      // edición para cargarlos ahora, sin cerrar y volver a abrir.
      onCreated(created)
    } else {
      onOpenChange(false)
    }
  })

  const saving = create.isPending || update.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-zinc-950 p-0 text-white sm:max-w-2xl lg:max-w-4xl"
      >
        <SheetHeader className="border-b border-white/5 px-6 py-4">
          <SheetTitle className="text-white">
            {isEdit ? 'Editar servicio' : 'Nuevo servicio'}
          </SheetTitle>
          <SheetDescription>
            El bot usa estos datos para ofrecer el servicio. Los materiales (PDF) se suben en la
            categoría.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="space-y-5">
                <ServiceIdentitySection
                  control={control}
                  register={register}
                  errors={errors}
                  nombre={values.nombre}
                  isEdit={isEdit}
                  slug={service?.slug ?? null}
                  onSlugInput={() => {
                    slugTouched.current = true
                  }}
                />

                <ServiceConversationSection
                  control={control}
                  register={register}
                  errors={errors}
                  resumen={values.resumen}
                  detalle={values.detalle}
                />

                <ServiceDeliverySection
                  control={control}
                  register={register}
                  errors={errors}
                  moneda={values.moneda}
                  priceAmount={values.price_amount}
                  modality={values.modality}
                  serviceId={service?.id ?? null}
                />
              </div>

              {/* En desktop acompaña el scroll; en mobile la grilla lo apila al final. */}
              <div>
                <div className="space-y-2 lg:sticky lg:top-0">
                  <ServicePreview
                    service={{
                      nombre: values.nombre,
                      resumen: values.resumen,
                      detalle: values.detalle,
                      precio: values.precio,
                      moneda: values.moneda,
                      flujo_cierre: values.flujo_cierre,
                    }}
                  />
                  <Hint>Se actualiza mientras escribís.</Hint>
                </div>
              </div>
            </div>
          </div>

          {/* Footer fijo: guardar y cancelar sin perseguir el botón al fondo del scroll. */}
          <div className="flex items-center justify-between gap-3 border-t border-white/5 px-6 py-4">
            <p className="text-[11px] text-zinc-600">
              {!isValid
                ? 'Completá los campos requeridos para guardar.'
                : 'El bot toma los cambios apenas guardás.'}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/10 bg-white/[0.03] text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || !isValid}
                className="gap-2 bg-gradient-to-b from-violet-500 to-violet-700 text-white"
              >
                {saving && <Spinner className="size-4" />}
                {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear servicio'}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
