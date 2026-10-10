import { HammerIcon, PackageIcon } from 'lucide-react'
import { cn } from 'cn'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'

function InventarioPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <EncabezadoPagina
        icono={PackageIcon}
        titulo="Inventario"
      />

      <div
        style={retrasoEscalonado(1)}
        className={cn('flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center', ENTRADA)}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary motion-safe:animate-pulse">
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
