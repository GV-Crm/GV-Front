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

/** Etiqueta de color con el estado del día. `soloIconoEnMovil`: en pantallas chicas solo se ve el ícono. */
export function EstadoBadge({ estado, soloIconoEnMovil = false }: { estado: EstadoDia; soloIconoEnMovil?: boolean }) {
  const estilo = ESTADOS[estado]
  return (
    <Badge className={estilo.badge} title={estilo.descripcion}>
      <estilo.icono data-icon="inline-start" />
      <span className={soloIconoEnMovil ? 'sr-only sm:not-sr-only' : undefined}>{estilo.etiqueta}</span>
    </Badge>
  )
}
