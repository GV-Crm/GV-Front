import { HammerIcon, PackageIcon } from 'lucide-react'
import { cn } from 'cn'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'

function InventarioPage() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <EncabezadoPagina
        icono={PackageIcon}
        color="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
        titulo="Inventario"
        descripcion="Aquí podrás consultar y registrar el inventario."
      />

      <div
        style={retrasoEscalonado(1)}
        className={cn('flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center', ENTRADA)}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 motion-safe:animate-pulse dark:bg-amber-500/20 dark:text-amber-300">
          <HammerIcon className="size-6" />
        </span>
        <p className="font-medium">Este módulo todavía está en construcción</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Muy pronto podrás consultar y registrar el inventario desde aquí. Mientras tanto, puedes seguir usando los demás
          módulos del menú.
        </p>
      </div>
    </div>
  )
}

export default InventarioPage
