import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from 'cn'
import { ENTRADA } from '@/lib/animaciones'

type Props = {
  icono: LucideIcon
  titulo: string
  /** Botones a la derecha (en móvil quedan abajo del título). */
  acciones?: ReactNode
}

/** Título de una pantalla con su ícono. Todos los módulos usan el mismo color (el principal). */
function EncabezadoPagina({ icono: Icono, titulo, acciones }: Props) {
  return (
    // La línea de abajo separa el título del contenido de la pantalla.
    <header className={cn('flex flex-wrap items-center justify-between gap-3 border-b pb-5', ENTRADA)}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-11">
          <Icono className="size-5" />
        </span>
        <h1 className="min-w-0 text-2xl font-bold sm:text-3xl">{titulo}</h1>
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  )
}

export default EncabezadoPagina
