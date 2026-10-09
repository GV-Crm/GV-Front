import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CoffeeIcon, LogInIcon, LogOutIcon, MousePointerClickIcon, UtensilsIcon, type LucideIcon } from 'lucide-react'
import { cn } from 'cn'
import { EstadoBadge } from './componentes'
import { fechaDesdeClave, formatHora, horasDelDia } from './formatHora'
import type { DiaCalendario } from './types'

type Paso = { titulo: string; hora: string | null; icono: LucideIcon; obligatorio: boolean }

function LineaDeTiempo({ pasos }: { pasos: Paso[] }) {
  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-border">
      {pasos.map((paso) => {
        const faltante = paso.obligatorio && !paso.hora
        return (
          <li key={paso.titulo} className="relative flex items-center gap-3">
            <span
              className={cn(
                'z-10 flex size-8 items-center justify-center rounded-full border bg-background',
                paso.hora && 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10',
                faltante && 'border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/10',
              )}
            >
              <paso.icono className="size-4" />
            </span>
            <div className="flex flex-1 items-baseline justify-between gap-2">
              <span className="text-sm">{paso.titulo}</span>
              {paso.hora ? (
                <span className="font-semibold tabular-nums">{formatHora(paso.hora)}</span>
              ) : (
                <span className={cn('text-sm', faltante ? 'font-medium text-amber-600' : 'text-muted-foreground')}>
                  {faltante ? 'Sin registrar' : '—'}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

type Props = {
  fecha: string | null
  dia: DiaCalendario | undefined
  /** Botón u otra acción sobre el día (p. ej. justificar la falta), según los permisos del usuario. */
  accion?: ReactNode
}

function DetalleDia({ fecha, dia, accion }: Props) {
  if (!fecha) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
        <MousePointerClickIcon className="size-6" />
        Elige un día del calendario para ver sus horarios.
      </div>
    )
  }

  const titulo = format(fechaDesdeClave(fecha), "EEEE d 'de' MMMM yyyy", { locale: es })
  const horas = horasDelDia(dia)
  const asistio = dia?.estado === 'asistio' || dia?.estado === 'sin_salida' || dia?.estado === 'sin_entrada'
  const motivos = [...new Set(dia?.registros.map((r) => r.Estado?.Motivo.trim()).filter(Boolean))]

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-base font-semibold first-letter:uppercase">{titulo}</p>
        {dia ? (
          <EstadoBadge estado={dia.estado} />
        ) : (
          <p className="text-sm text-muted-foreground">Sin información: día futuro o anterior a su ingreso.</p>
        )}
      </div>

      {dia && (
        <LineaDeTiempo
          pasos={[
            { titulo: 'Entrada', hora: horas.entrada, icono: LogInIcon, obligatorio: asistio },
            { titulo: 'Inicio de comida', hora: horas.inicioComida, icono: UtensilsIcon, obligatorio: false },
            { titulo: 'Fin de comida', hora: horas.finComida, icono: CoffeeIcon, obligatorio: false },
            { titulo: 'Salida', hora: horas.salida, icono: LogOutIcon, obligatorio: asistio },
          ]}
        />
      )}

      {motivos.length > 0 && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Motivo: </span>
          <span className="font-medium">{motivos.join(', ')}</span>
        </div>
      )}

      {accion}
    </div>
  )
}

export default DetalleDia
