import { ScanFaceIcon } from 'lucide-react'
import { cn } from 'cn'

/** Recuadro con el ID del trabajador en el checador: es el número que hay que usar al registrarlo en el equipo. */
function PinChecador({ pin, className }: { pin: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border bg-muted/40 p-3', className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ScanFaceIcon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">ID en el checador</p>
        <p className="font-mono text-lg leading-tight font-semibold">{pin}</p>
      </div>
      <p className="max-w-40 text-right text-xs text-muted-foreground">Regístralo en el equipo con este número.</p>
    </div>
  )
}

export default PinChecador
