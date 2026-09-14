/** Encabezado de sección del detalle de la oportunidad. */
export function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
      {children}
    </h3>
  )
}
