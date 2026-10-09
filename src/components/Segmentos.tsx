import type { LucideIcon } from 'lucide-react'
import { cn } from 'cn'

type Opcion<T extends string> = { id: T; nombre: string; icono?: LucideIcon }

type Props<T extends string> = {
  opciones: readonly Opcion<T>[]
  valor: T
  onCambio: (valor: T) => void
  /** Texto para lectores de pantalla, p. ej. "Vista". */
  etiqueta: string
}

/** Botones tipo pestaña para elegir una opción, p. ej. "Calendario | Resumen". */
function Segmentos<T extends string>({ opciones, valor, onCambio, etiqueta }: Props<T>) {
  return (
    <div role="tablist" aria-label={etiqueta} className="flex w-fit rounded-lg border bg-muted/60 p-0.5">
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          role="tab"
          aria-selected={valor === opcion.id}
          onClick={() => onCambio(opcion.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            valor === opcion.id ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opcion.icono && <opcion.icono className="size-4" />}
          {opcion.nombre}
        </button>
      ))}
    </div>
  )
}

export default Segmentos
