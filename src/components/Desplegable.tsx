import type { ReactNode } from 'react'
import { Collapsible } from '@base-ui/react/collapsible'
import { ChevronDownIcon, type LucideIcon } from 'lucide-react'
import { cn } from 'cn'
import { useMediaQuery } from '@/hooks/use-media-query'

type Props = {
  titulo: string
  icono: LucideIcon
  /** Texto corto que se ve aunque esté cerrado, p. ej. "3 asistieron · 2 pendientes". */
  resumen?: ReactNode
  /** Si es true, en pantallas medianas y grandes el contenido se muestra siempre, sin botón. */
  soloEnMovil?: boolean
  abiertoAlInicio?: boolean
  className?: string
  children: ReactNode
}

/**
 * Sección que se abre y se cierra con una animación. Sirve para que en el celular
 * no se amontone todo: se ve solo el título y se despliega al tocarlo.
 */
function Desplegable({ titulo, icono: Icono, resumen, soloEnMovil = false, abiertoAlInicio = false, className, children }: Props) {
  const pantallaGrande = useMediaQuery('(min-width: 640px)')
  if (soloEnMovil && pantallaGrande) return <>{children}</>

  return (
    <Collapsible.Root defaultOpen={abiertoAlInicio} className={cn('rounded-xl border bg-card shadow-xs', className)}>
      <Collapsible.Trigger className="group flex w-full items-center gap-3 rounded-xl p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Icono className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{titulo}</span>
          {resumen && <span className="block truncate text-xs text-muted-foreground">{resumen}</span>}
        </span>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-300 group-data-[panel-open]:rotate-180" />
      </Collapsible.Trigger>

      {/* La altura se anima de 0 a la altura real del contenido. */}
      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-300 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <div className="border-t p-3">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

export default Desplegable
