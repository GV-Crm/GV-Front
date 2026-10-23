import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarCheckIcon, ClockIcon, GaugeIcon, TimerIcon, type LucideIcon } from 'lucide-react'
import { cn } from 'cn'
import { EstadoBadge } from './componentes'
import { fechaDesdeClave, formatDuracion, formatHora, formatHorasMinutos, minutosTrabajados } from './formatHora'
import type { DiaCalendario } from './types'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function Tarjeta({ titulo, valor, detalle, icono: Icono, posicion }: { titulo: string; valor: string; detalle: string; icono: LucideIcon; posicion: number }) {
  return (
    <div style={retrasoEscalonado(posicion)} className={cn('flex items-center gap-3 rounded-xl border bg-card p-3', ENTRADA)} title={detalle}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', COLOR_SECCION.indicadores.suave)}>
        <Icono className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold tabular-nums">{valor}</p>
        <p className="truncate text-xs text-muted-foreground">{titulo}</p>
      </div>
    </div>
  )
}

/** Una hora o un guion si no hay. */
const hora = (valor: string | null) => (valor ? formatHora(valor) : '—')

/**
 * Pestaña "Horas" del trabajador: cuánto trabajó cada día del mes elegido arriba (flechas o selector de mes) (entrada, comida, salida, jornada,
 * tiempo extra y total) y los totales del mes. Los domingos sin checadas no se listan.
 */
function HorasTrabajadas({ mes, dias, cargando }: { mes: Date; dias: DiaCalendario[]; cargando: boolean }) {
  if (cargando) return <Skeleton className="h-96 rounded-xl" />
  const nombreMes = format(mes, "LLLL 'de' yyyy", { locale: es })

  const filas = [...dias]
    .filter((d) => d.estado !== 'descanso' || d.checadas.length > 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((dia) => ({ dia, horas: minutosTrabajados(dia) }))

  const trabajados = filas.flatMap((f) => (f.horas ? [f.horas] : []))
  const total = trabajados.reduce((suma, h) => suma + h.total, 0)
  const jornada = trabajados.reduce((suma, h) => suma + h.jornada, 0)
  const extra = trabajados.reduce((suma, h) => suma + h.extra, 0)
  const promedio = trabajados.length ? Math.round(total / trabajados.length) : 0
  // Días con entrada pero sin salida (o al revés): no se pueden contar.
  const incompletos = filas.filter((f) => !f.horas && (f.dia.entrada || f.dia.salida)).length

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tarjeta posicion={0} icono={ClockIcon} titulo={`Horas trabajadas en ${nombreMes}`} valor={formatHorasMinutos(total)} detalle="Jornada + tiempo extra" />
        <Tarjeta posicion={1} icono={CalendarCheckIcon} titulo="Días con horas" valor={String(trabajados.length)} detalle="Días con entrada y salida" />
        <Tarjeta posicion={2} icono={GaugeIcon} titulo="Promedio por día" valor={formatHorasMinutos(promedio)} detalle="Total entre los días con horas" />
        <Tarjeta posicion={3} icono={TimerIcon} titulo="Tiempo extra" valor={formatHorasMinutos(extra)} detalle="Después de su hora de salida" />
      </section>

      {incompletos > 0 && (
        <p className="text-xs text-muted-foreground">
          {incompletos === 1 ? '1 día no se cuenta' : `${incompletos} días no se cuentan`}: le falta registrar la entrada o la salida.
        </p>
      )}

      <section className={cn('overflow-hidden rounded-xl border bg-card', ENTRADA)}>
        {filas.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">Sin días registrados en {nombreMes}.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Día</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Entrada</TableHead>
                <TableHead className="text-right">Comida</TableHead>
                <TableHead className="text-right">Salida</TableHead>
                <TableHead className="text-right">Jornada</TableHead>
                <TableHead className="text-right">Extra</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map(({ dia, horas }) => (
                <TableRow key={dia.fecha}>
                  <TableCell className="font-medium whitespace-nowrap first-letter:uppercase">
                    {format(fechaDesdeClave(dia.fecha), 'EEE d', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={dia.estado} soloIconoEnMovil />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{hora(dia.entrada)}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {horas?.comida ? formatDuracion(horas.comida) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{hora(dia.salida)}</TableCell>
                  <TableCell className="text-right tabular-nums">{horas ? formatHorasMinutos(horas.jornada) : '—'}</TableCell>
                  <TableCell className={cn('text-right tabular-nums', horas?.extra ? 'text-violet-700 dark:text-violet-300' : 'text-muted-foreground')}>
                    {horas?.extra ? `+${formatHorasMinutos(horas.extra)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{horas ? formatHorasMinutos(horas.total) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="font-semibold first-letter:uppercase">
                  Total de {nombreMes}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatHorasMinutos(jornada)}</TableCell>
                <TableCell className="text-right tabular-nums">{extra ? `+${formatHorasMinutos(extra)}` : '—'}</TableCell>
                <TableCell className="text-right font-bold tabular-nums">{formatHorasMinutos(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </section>
      <p className="text-xs text-muted-foreground">
        Horas en formato horas:minutos. Jornada: de la entrada a la salida, sin la comida. Total: jornada más tiempo extra.
      </p>
    </div>
  )
}

export default HorasTrabajadas
