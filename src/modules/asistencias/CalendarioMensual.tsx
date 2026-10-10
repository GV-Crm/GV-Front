import { cn } from 'cn'
import { ESTADOS } from './estados'
import { claveFecha, formatHora, horasDelDia } from './formatHora'
import type { DiaCalendario } from './types'
import { Skeleton } from '@/components/ui/skeleton'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Claves `YYYY-MM-DD` del mes en una cuadrícula que empieza en lunes; `null` rellena antes y después. */
function celdasDelMes(mes: Date): (string | null)[] {
  const anio = mes.getFullYear()
  const numMes = mes.getMonth()
  const totalDias = new Date(anio, numMes + 1, 0).getDate()
  const huecosIniciales = (new Date(anio, numMes, 1).getDay() + 6) % 7

  const celdas: (string | null)[] = Array(huecosIniciales).fill(null)
  for (let dia = 1; dia <= totalDias; dia++) celdas.push(claveFecha(new Date(anio, numMes, dia)))
  while (celdas.length % 7 !== 0) celdas.push(null)
  return celdas
}

type Props = {
  mes: Date
  dias: Map<string, DiaCalendario>
  hoy: string
  seleccionado: string | null
  onSeleccionar: (fecha: string) => void
  cargando: boolean
  /** Hacia dónde se cambió de mes: el calendario entra desde ese lado. null = recién abierto. */
  direccion?: 'derecha' | 'izquierda' | null
}

function CalendarioMensual({ mes, dias, hoy, seleccionado, onSeleccionar, cargando, direccion = null }: Props) {
  const celdas = celdasDelMes(mes)

  return (
    <div className={direccion === 'derecha' ? 'mes-desde-derecha' : direccion === 'izquierda' ? 'mes-desde-izquierda' : undefined}>
      <div className="grid grid-cols-7 gap-1 pb-1.5 sm:gap-1.5">
        {DIAS_SEMANA.map((nombre, i) => (
          <div
            key={nombre}
            className={cn(
              'text-center text-[11px] font-semibold tracking-wide uppercase sm:text-xs',
              i >= 5 ? 'text-muted-foreground/70' : 'text-muted-foreground',
            )}
          >
            {nombre}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {celdas.map((fecha, i) => {
          if (!fecha) return <div key={`vacio-${i}`} />
          if (cargando) return <Skeleton key={fecha} className="h-11 rounded-lg sm:h-14 xl:h-[4.5rem]" />

          const dia = dias.get(fecha)
          const estilo = dia ? ESTADOS[dia.estado] : null
          const { entrada, salida } = horasDelDia(dia)
          const horario = entrada || salida ? `${formatHora(entrada)} – ${formatHora(salida)}` : null
          const justificacion = dia?.registros.find((r) => r.Justificacion)?.Justificacion
          const esHoy = fecha === hoy

          return (
            <button
              key={fecha}
              type="button"
              title={justificacion ?? undefined}
              aria-label={`${Number(fecha.slice(8))}${estilo ? `, ${estilo.etiqueta}` : ''}${justificacion ? `: ${justificacion}` : ''}`}
              onClick={() => onSeleccionar(fecha)}
              // Al abrir, los días brotan en diagonal (columna + fila); al cambiar de mes se desliza todo junto.
              style={direccion ? undefined : { animationDelay: `${((i % 7) + Math.floor(i / 7)) * 30}ms` }}
              className={cn(
                'group flex h-11 min-w-0 flex-col gap-0.5 rounded-lg border p-1 text-left transition-colors outline-none hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-14 sm:p-1.5 xl:h-[4.5rem]',
                estilo ? estilo.celda : 'border-dashed bg-muted/20 text-muted-foreground/60',
                !direccion && 'celda-brota',
                seleccionado === fecha && 'z-10 scale-[1.04] shadow-md ring-2 ring-primary ring-offset-1 ring-offset-card',
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:size-6 sm:text-sm',
                    esHoy && 'bg-primary text-primary-foreground',
                  )}
                >
                  {Number(fecha.slice(8))}
                </span>
                {estilo && <estilo.icono className={cn('hidden size-3.5 shrink-0 sm:block', estilo.texto)} />}
              </div>

              {estilo && <span className={cn('mx-auto mt-0.5 size-1.5 rounded-full sm:hidden', estilo.punto)} />}

              {/* Entre sm y xl solo cabe una línea: el horario si lo hay, si no la etiqueta. */}
              {estilo && (
                <span
                  className={cn(
                    'hidden truncate text-[10px] leading-tight font-medium sm:block xl:text-[11px]',
                    estilo.texto,
                    horario && 'sm:hidden xl:block',
                  )}
                >
                  {estilo.etiqueta}
                </span>
              )}
              {horario && (
                <span className="mt-auto hidden truncate text-[10px] text-muted-foreground tabular-nums sm:block xl:text-[11px]">
                  {horario}
                </span>
              )}
              {/* El motivo solo cabe en pantallas grandes; en las demás se ve en el detalle del día. */}
              {justificacion && (
                <span className="mt-auto hidden truncate text-[11px] text-muted-foreground italic xl:block">{justificacion}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarioMensual
