import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CircleCheckIcon,
  CircleXIcon,
  FileCheckIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { ESTADOS, ORDEN_ESTADOS } from './estados'
import FaltasPorMes from './FaltasPorMes'
import type { DiaCalendario, EmpleadoDetalle } from './types'
import { Skeleton } from '@/components/ui/skeleton'

type Kpi = { titulo: string; valor: string; detalle: string; icono: LucideIcon; color: string }

function TarjetaKpi({ titulo, valor, detalle, icono: Icono, color }: Kpi) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs sm:p-4">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10', color)}>
        <Icono className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-semibold tabular-nums sm:text-2xl">{valor}</p>
        <p className="truncate text-xs font-medium">{titulo}</p>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{detalle}</p>
      </div>
    </div>
  )
}

function kpisDelMes(dias: DiaCalendario[]): Kpi[] {
  const cuenta = (estado: DiaCalendario['estado']) => dias.filter((d) => d.estado === estado).length
  const asistencias = cuenta('asistio')
  const incompletos = cuenta('sin_salida') + cuenta('sin_entrada')
  const faltas = cuenta('falta')
  const evaluados = asistencias + incompletos + faltas
  const porcentaje = evaluados ? Math.round(((asistencias + incompletos) / evaluados) * 100) : null

  return [
    {
      titulo: 'Asistencias',
      valor: String(asistencias),
      detalle: 'Con entrada y salida',
      icono: CircleCheckIcon,
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    },
    {
      titulo: 'Faltas',
      valor: String(faltas),
      detalle: 'Sin justificar',
      icono: CircleXIcon,
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    },
    {
      titulo: 'Justificadas',
      valor: String(cuenta('justificada')),
      detalle: 'Faltas con justificación',
      icono: FileCheckIcon,
      color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    },
    {
      titulo: 'Por completar',
      valor: String(incompletos),
      detalle: 'Falta entrada o salida',
      icono: TriangleAlertIcon,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    },
    {
      titulo: 'Asistencia',
      valor: porcentaje === null ? '—' : `${porcentaje}%`,
      // Las faltas justificadas no cuentan en contra.
      detalle: `${asistencias + incompletos} de ${evaluados} días laborales`,
      icono: TrendingUpIcon,
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
    },
  ]
}

function Distribucion({ dias }: { dias: DiaCalendario[] }) {
  const conteo = ORDEN_ESTADOS.map((estado) => ({ estado, total: dias.filter((d) => d.estado === estado).length }))
  const total = dias.length

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {conteo
          .filter((c) => c.total > 0)
          .map((c) => (
            <div
              key={c.estado}
              className={ESTADOS[c.estado].punto}
              style={{ width: `${(c.total / total) * 100}%` }}
              title={`${ESTADOS[c.estado].etiqueta}: ${c.total}`}
            />
          ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {conteo.map(({ estado, total: n }) => (
          <li key={estado} className={cn('flex items-center gap-2', n === 0 && 'text-muted-foreground')}>
            <span className={cn('size-2.5 shrink-0 rounded-full', ESTADOS[estado].punto)} />
            <span className="truncate">{ESTADOS[estado].etiqueta}</span>
            <span className="ml-auto font-medium tabular-nums">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type Props = { mes: Date; dias: DiaCalendario[]; cargando: boolean; asistencias: EmpleadoDetalle['Asistencias'] }

function ResumenEmpleado({ mes, dias, cargando, asistencias }: Props) {
  const kpis = kpisDelMes(dias)

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) =>
          cargando ? <Skeleton key={kpi.titulo} className="h-20 rounded-xl" /> : <TarjetaKpi key={kpi.titulo} {...kpi} />,
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4 shadow-xs">
          <h2 className="mb-4 text-sm font-semibold first-letter:uppercase">
            Distribución de {format(mes, 'LLLL yyyy', { locale: es })}
          </h2>
          {cargando ? <Skeleton className="h-24" /> : <Distribucion dias={dias} />}
        </section>

        <section className="rounded-xl border bg-card p-4 shadow-xs">
          <h2 className="mb-4 text-sm font-semibold">Historial de faltas por mes</h2>
          <FaltasPorMes asistencias={asistencias} />
        </section>
      </div>
    </div>
  )
}

export default ResumenEmpleado
