import { PackageIcon } from 'lucide-react'

function InventarioPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Inventario</h1>

      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
        <div className="bg-muted rounded-full p-3">
          <PackageIcon className="text-muted-foreground size-6" />
        </div>
        <p className="font-medium">Este módulo todavía está en construcción</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Muy pronto podrás consultar y registrar el inventario desde aquí. Mientras tanto, puedes seguir
          usando el módulo de Asistencias en el menú de la izquierda.
        </p>
      </div>
    </div>
  )
}

export default InventarioPage
