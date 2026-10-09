import type { LucideIcon } from 'lucide-react'
import { cn } from 'cn'

type Opcion<T extends string> = { id: T; nombre: string; icono?: LucideIcon }

type Props<T extends string> = {
  opciones: readonly Opcion<T>[]
  valor: T
  onCambio: (valor: T) => void
  /** Texto para lectores de pantalla, p. ej. "Vista". */
  etiqueta: string
  /** Por ejemplo "w-full sm:w-fit" para que en el celular ocupe todo el ancho. */
  className?: string
}

/** Botones tipo pestaña para elegir una opción, p. ej. "Calendario | Resumen". */
function Segmentos<T extends string>({ opciones, valor, onCambio, etiqueta, className }: Props<T>) {
  return (
    <div role="tablist" aria-label={etiqueta} className={cn('flex w-fit rounded-lg border bg-muted/70 p-0.5', className)}>
      {opciones.map((opcion) => {
        const elegida = valor === opcion.id
        return (
          <button
            key={opcion.id}
            type="button"
            role="tab"
            aria-selected={elegida}
            onClick={() => onCambio(opcion.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95',
              elegida
                ? 'bg-card text-indigo-700 shadow-sm dark:text-indigo-300'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opcion.icono && <opcion.icono className="size-4" />}
            {opcion.nombre}
          </button>
        )
      })}
    </div>
  )
}

export default Segmentos
