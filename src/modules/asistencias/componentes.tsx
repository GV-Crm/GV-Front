import { ESTADOS } from './estados'
import type { EstadoDia } from './types'
import { Badge } from '@/components/ui/badge'

export function EstatusBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Activo</Badge>
  ) : (
    <Badge variant="secondary">Inactivo</Badge>
  )
}

/**
 * Etiqueta con el estado del día.
 * - `soloIconoEnMovil`: en pantallas chicas solo se ve el ícono.
 * - `color`: clases de color que reemplazan al color del estado, para que la etiqueta tome el color de su
 *   sección (ver src/lib/colores-seccion.ts). El ícono y el texto siguen diciendo cuál es el estado.
 */
export function EstadoBadge({
  estado,
  soloIconoEnMovil = false,
  color,
}: {
  estado: EstadoDia
  soloIconoEnMovil?: boolean
  color?: string
}) {
  const estilo = ESTADOS[estado]
  return (
    <Badge className={color ?? estilo.badge} title={estilo.descripcion}>
      <estilo.icono data-icon="inline-start" />
      <span className={soloIconoEnMovil ? 'sr-only sm:not-sr-only' : undefined}>{estilo.etiqueta}</span>
    </Badge>
  )
}
