import { cn } from 'cn'
import { colorDeAvatar, ESTADOS, iniciales } from './estados'
import type { EstadoDia } from './types'
import { Badge } from '@/components/ui/badge'

export function AvatarEmpleado({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
        colorDeAvatar(nombre),
        className,
      )}
    >
      {iniciales(nombre)}
    </span>
  )
}

export function EstatusBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Activo</Badge>
  ) : (
    <Badge variant="secondary">Inactivo</Badge>
  )
}

export function EstadoBadge({ estado }: { estado: EstadoDia }) {
  const estilo = ESTADOS[estado]
  return (
    <Badge className={estilo.badge}>
      <estilo.icono data-icon="inline-start" />
      {estilo.etiqueta}
    </Badge>
  )
}
