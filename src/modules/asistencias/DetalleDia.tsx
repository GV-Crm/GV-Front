import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlarmClockIcon,
  CoffeeIcon,
  LogInIcon,
  LogOutIcon,
  MousePointerClickIcon,
  PalmtreeIcon,
  TimerIcon,
  UtensilsIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { EstadoBadge } from './componentes'
import { ESTADOS } from './estados'
import { describirFechas, fechaDesdeClave, formatDuracion, formatHora, horasDelDia } from './formatHora'
import type { DiaCalendario, PeriodoVacaciones } from './types'
import { ENTRADA } from '@/lib/animaciones'

type Paso = { titulo: string; hora: string | null; icono: LucideIcon; obligatorio: boolean }

function LineaDeTiempo({ pasos }: { pasos: Paso[] }) {
  return (
    <ol className="relative space-y-4">
      {/* Línea vertical que se dibuja de arriba hacia abajo; cada paso aparece cuando la línea llega a él. */}
      <span aria-hidden className="linea-crece absolute top-2 bottom-2 left-4 w-px bg-border" />
      {pasos.map((paso, i) => {
        const faltante = paso.obligatorio && !paso.hora
        return (
          <li key={paso.titulo} style={{ animationDelay: `${150 + i * 200}ms` }} className={cn('relative flex items-center gap-3', ENTRADA)}>
            <span
              className={cn(
                'z-10 flex size-8 items-center justify-center rounded-full border bg-background',
                paso.hora && 'border-primary/30 bg-primary/10 text-primary',
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
  /** Si el día es futuro y cae en un periodo de vacaciones ya registrado. */
  programada?: PeriodoVacaciones | null
}

function PeriodoDeVacaciones({ periodo, programada }: { periodo: PeriodoVacaciones; programada: boolean }) {
  return (
    <div className="space-y-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm dark:border-teal-500/30 dark:bg-teal-500/10">
      <p className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-300">
        <PalmtreeIcon className="size-4" />
        {programada ? 'Vacaciones programadas' : 'De vacaciones'}
      </p>
      <p>
        <span className="text-muted-foreground">Solicitud de {periodo.Dias} {periodo.Dias === 1 ? 'día' : 'días'}: </span>
        {describirFechas(periodo.Fechas)}
      </p>
      {periodo.Nota && <p className="text-xs break-words text-muted-foreground">{periodo.Nota}</p>}
    </div>
  )
}

function DetalleDia({ fecha, dia, accion, programada }: Props) {
  if (!fecha) {
    return (
      <div className={cn('flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground', ENTRADA)}>
        <span className="flex size-10 items-center justify-center rounded-full bg-muted motion-safe:animate-bounce">
          <MousePointerClickIcon className="size-5" />
        </span>
        Elige un día del calendario para ver sus horarios.
      </div>
    )
  }

  const titulo = format(fechaDesdeClave(fecha), "EEEE d 'de' MMMM yyyy", { locale: es })
  const horas = horasDelDia(dia)
  const asistio = dia?.estado === 'asistio' || dia?.estado === 'retardo' || dia?.estado === 'sin_salida' || dia?.estado === 'sin_entrada'
  const periodoVacaciones = dia?.vacaciones ?? programada ?? null
  // De vacaciones no se muestra el motivo de una falta guardada antes de registrarlas.
  const motivos =
    dia?.estado === 'vacaciones' ? [] : [...new Set(dia?.registros.map((r) => r.Estado?.Motivo.trim()).filter(Boolean))]
  // Solo las faltas justificadas tienen este texto.
  const justificacion = dia?.registros.find((r) => r.Justificacion)

  return (
    <div className={cn('space-y-5', ENTRADA)}>
      <div className="space-y-2">
        <p className="text-base font-semibold first-letter:uppercase">{titulo}</p>
        {dia ? (
          <div className="space-y-1">
            <EstadoBadge estado={dia.estado} />
            <p className="text-xs text-muted-foreground">{ESTADOS[dia.estado].descripcion}</p>
          </div>
        ) : programada ? null : (
          <p className="text-sm text-muted-foreground">Sin información: día futuro o anterior a su ingreso.</p>
        )}
      </div>

      {periodoVacaciones && <PeriodoDeVacaciones periodo={periodoVacaciones} programada={!dia} />}

      {justificacion && (
        <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm dark:border-blue-500/30 dark:bg-blue-500/10">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Motivo de la justificación</p>
          <p className="break-words whitespace-pre-line">{justificacion.Justificacion}</p>
          {justificacion.JustificadoPor && (
            <p className="text-xs text-muted-foreground">Justificó: {justificacion.JustificadoPor}</p>
          )}
        </div>
      )}

      {/* En una falta justificada todas las horas están vacías: no hace falta mostrarlas. */}
      {dia && dia.estado !== 'justificada' && dia.estado !== 'vacaciones' && (
        <LineaDeTiempo
          pasos={[
            { titulo: 'Entrada', hora: horas.entrada, icono: LogInIcon, obligatorio: asistio },
            { titulo: 'Inicio de comida', hora: horas.inicioComida, icono: UtensilsIcon, obligatorio: false },
            { titulo: 'Fin de comida', hora: horas.finComida, icono: CoffeeIcon, obligatorio: false },
            { titulo: 'Salida', hora: horas.salida, icono: LogOutIcon, obligatorio: asistio },
          ]}
        />
      )}

      {dia?.retardo && dia.entrada && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm dark:border-yellow-500/30 dark:bg-yellow-500/10">
          <AlarmClockIcon className="mt-0.5 size-4 shrink-0 text-yellow-700 dark:text-yellow-300" />
          <p>
            Llegó <span className="font-semibold">{formatDuracion(dia.minutosTarde)}</span> tarde.{' '}
            <span className="text-muted-foreground">
              {dia.minutosTarde > 60 ? 'Después de las 9:00 cuenta como falta.' : 'Después de las 8:15 es retardo.'}
            </span>
          </p>
        </div>
      )}

      {dia?.extra && (
        <div className="space-y-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm dark:border-violet-500/30 dark:bg-violet-500/10">
          <p className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-violet-800 dark:text-violet-300">
              <TimerIcon className="size-4" />
              Tiempo extra
            </span>
            <span className="font-semibold tabular-nums">{formatDuracion(dia.minutosExtra)}</span>
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatHora(dia.extra.inicio)} – {dia.extra.fin ? formatHora(dia.extra.fin) : 'sin checar su salida'}
          </p>
          {!dia.extra.fin && (
            <p className="text-xs text-muted-foreground">
              Volvió a checar después de la hora de salida, pero falta su última checada para contar el tiempo.
            </p>
          )}
        </div>
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
