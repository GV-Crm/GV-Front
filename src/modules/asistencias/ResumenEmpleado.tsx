import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChartPieIcon,
  CircleCheckIcon,
  CircleXIcon,
  FileCheckIcon,
  HistoryIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { ESTADOS, ORDEN_ESTADOS } from './estados'
import FaltasPorMes from './FaltasPorMes'
import type { DiaCalendario, EmpleadoDetalle } from './types'
import Ayuda from '@/components/Ayuda'
import Desplegable from '@/components/Desplegable'
import { ELEVAR_AL_PASAR, ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { Skeleton } from '@/components/ui/skeleton'

type Kpi = { titulo: string; valor: string; detalle: string; icono: LucideIcon; color: string }

function TarjetaKpi({ titulo, valor, detalle, icono: Icono, color, posicion }: Kpi & { posicion: number }) {
  return (
    <div
      title={detalle}
      style={retrasoEscalonado(posicion)}
      className={cn('flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs sm:p-4', ENTRADA, ELEVAR_AL_PASAR)}
    >
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
              // Cada tramo de la barra entra desde la izquierda.
              className={cn(ESTADOS[c.estado].punto, 'motion-safe:animate-in motion-safe:slide-in-from-left-full motion-safe:duration-700')}
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
  const nombreMes = format(mes, 'LLLL yyyy', { locale: es })

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi, i) =>
          cargando ? (
            <Skeleton key={kpi.titulo} className="h-20 rounded-xl" />
          ) : (
            <TarjetaKpi key={kpi.titulo} posicion={i} {...kpi} />
          ),
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section style={retrasoEscalonado(3)} className={cn('rounded-xl border bg-card p-4 shadow-xs', ENTRADA)}>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ChartPieIcon className="size-4 text-indigo-500" />
            <span className="first-letter:uppercase">Distribución de {nombreMes}</span>
            <Ayuda>Cuántos días del mes fueron de cada tipo. La barra de colores muestra la proporción.</Ayuda>
          </h2>
          {cargando ? <Skeleton className="h-24" /> : <Distribucion dias={dias} />}
        </section>

        {/* En el celular el historial queda plegado para no hacer la página tan larga. */}
        <Desplegable titulo="Historial de faltas por mes" icono={HistoryIcon} resumen="Toca para ver mes por mes" soloEnMovil>
          <section style={retrasoEscalonado(4)} className={cn('rounded-xl border-0 bg-card sm:border sm:p-4 sm:shadow-xs', ENTRADA)}>
            <h2 className="mb-4 hidden items-center gap-2 text-sm font-semibold sm:flex">
              <HistoryIcon className="size-4 text-rose-500" />
              Historial de faltas por mes
              <Ayuda>Faltas sin justificar y justificadas de cada mes, desde su primer registro hasta hoy.</Ayuda>
            </h2>
            <FaltasPorMes asistencias={asistencias} />
          </section>
        </Desplegable>
      </div>
    </div>
  )
}

export default ResumenEmpleado
