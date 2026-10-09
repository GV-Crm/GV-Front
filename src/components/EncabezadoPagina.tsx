import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from 'cn'
import { ENTRADA } from '@/lib/animaciones'

type Props = {
  icono: LucideIcon
  /** Clases de color del cuadro del ícono. Usa el mismo color que el módulo en src/modulos.ts. */
  color: string
  titulo: string
  /** Una frase que explique qué se hace en esta pantalla. */
  descripcion: string
  /** Botones a la derecha (en móvil quedan abajo del título). */
  acciones?: ReactNode
}

/** Título de una pantalla con su ícono y una explicación corta. */
function EncabezadoPagina({ icono: Icono, color, titulo, descripcion, acciones }: Props) {
  return (
    <header className={cn('flex flex-wrap items-center justify-between gap-3', ENTRADA)}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl shadow-xs sm:size-11', color)}>
          <Icono className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold sm:text-2xl">{titulo}</h1>
          <p className="text-sm text-muted-foreground">{descripcion}</p>
        </div>
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  )
}

export default EncabezadoPagina
