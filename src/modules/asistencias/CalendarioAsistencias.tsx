import { useMemo, useState, type CSSProperties } from 'react'
import { es } from 'date-fns/locale'
import { formatFecha, formatHora } from './formatHora'
import type { EmpleadoDetalle } from './types'
import { Calendar } from '@/components/ui/calendar'

type Asistencia = EmpleadoDetalle['Asistencias'][number]

const NARANJA = 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
const ROJO = 'bg-red-500/20 text-red-700 dark:text-red-300'
const VERDE = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'

/** Colores fijos por texto del motivo (no por id). */
const COLOR_POR_MOTIVO: Record<string, string> = {
    Retardo: NARANJA,
    'Retardo Justificado': NARANJA,
    Falta: ROJO,
    'Falta Justificada': ROJO,
    Asistencia: VERDE,
}

/** Para motivos nuevos que aparezcan en la base sin que nadie toque este archivo. Sin rojo, naranja ni verde. */
const PALETA = [
    'bg-sky-500/20 text-sky-700 dark:text-sky-300',
    'bg-violet-500/20 text-violet-700 dark:text-violet-300',
    'bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300',
    'bg-teal-500/20 text-teal-700 dark:text-teal-300',
]

/** Color de un motivo sin color fijo, derivado de su texto: el mismo motivo sale igual en cualquier empleado. */
function colorDeMotivo(motivo: string) {
    let hash = 0
    for (const letra of motivo) hash = (hash * 31 + letra.charCodeAt(0)) | 0
    return PALETA[Math.abs(hash) % PALETA.length]
}

const COLOR_SIN_ESTADO = 'bg-muted text-muted-foreground'

/** Clave YYYY-MM-DD en hora local, para cruzar un día del calendario con su asistencia. */
function claveFecha(fecha: Date) {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${fecha.getFullYear()}-${mes}-${dia}`
}

function fechaDesdeClave(clave: string) {
    const [anio, mes, dia] = clave.split('-').map(Number)
    return new Date(anio, mes - 1, dia)
}

/**
 * Calendario con los días coloreados por motivo, su leyenda y el registro del día elegido.
 * `tamanoCelda` acepta cualquier valor CSS (p. ej. un `clamp(...)`) para agrandar el calendario.
 */
function CalendarioAsistencias({
    asistencias,
    tamanoCelda,
}: {
    asistencias: Asistencia[]
    tamanoCelda?: string
}) {
    const [diaSeleccionado, setDiaSeleccionado] = useState<Date | undefined>()

    const porFecha = useMemo(() => {
        const mapa = new Map<string, Asistencia>()
        for (const a of asistencias) {
            if (a.HoraEntrada) mapa.set(claveFecha(new Date(a.HoraEntrada)), a)
        }
        return mapa
    }, [asistencias])

    const { modifiers, modifiersClassNames, leyenda } = useMemo(() => {
        const grupos = new Map<string, { id: number | null; motivo: string; dias: Date[] }>()

        for (const [clave, a] of porFecha) {
            const id = a.Estado?.id ?? null
            const llave = `estado_${id ?? 'sin'}`
            let grupo = grupos.get(llave)
            if (!grupo) {
                grupo = { id, motivo: a.Estado?.Motivo ?? 'Sin estado', dias: [] }
                grupos.set(llave, grupo)
            }
            grupo.dias.push(fechaDesdeClave(clave))
        }

        const ordenados = [...grupos.entries()].sort(
            ([, a], [, b]) => (a.id ?? Infinity) - (b.id ?? Infinity),
        )

        const conColor = ordenados.map(([llave, grupo]) => {
            const color =
                grupo.id === null
                    ? COLOR_SIN_ESTADO
                    : (COLOR_POR_MOTIVO[grupo.motivo.trim()] ?? colorDeMotivo(grupo.motivo.trim()))
            return { llave, color, ...grupo }
        })

        return {
            modifiers: Object.fromEntries(conColor.map((g) => [g.llave, g.dias])),
            modifiersClassNames: Object.fromEntries(
                conColor.map((g) => [g.llave, `${g.color} font-medium rounded-(--cell-radius)`]),
            ),
            leyenda: conColor.map((g) => ({ motivo: g.motivo, color: g.color, total: g.dias.length })),
        }
    }, [porFecha])

    const dias = [...porFecha.keys()].sort()
    const primerDia = dias.at(0)
    const ultimoDia = dias.at(-1)

    // Rango de los selectores de mes/año: desde enero del primer registro hasta diciembre del año actual.
    const hoy = new Date()
    const anioInicio = primerDia ? Math.min(fechaDesdeClave(primerDia).getFullYear(), hoy.getFullYear()) : hoy.getFullYear()
    const asistencia = diaSeleccionado ? porFecha.get(claveFecha(diaSeleccionado)) : undefined

    return (
        <div className="flex flex-wrap items-start gap-6">
            <Calendar
                mode="single"
                locale={es}
                captionLayout="dropdown"
                startMonth={new Date(anioInicio, 0)}
                endMonth={new Date(hoy.getFullYear(), 11)}
                selected={diaSeleccionado}
                onSelect={setDiaSeleccionado}
                defaultMonth={ultimoDia ? fechaDesdeClave(ultimoDia) : undefined}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="rounded-md border p-4 text-base [--cell-size:--spacing(11)]"
                style={tamanoCelda ? ({ '--cell-size': tamanoCelda } as CSSProperties) : undefined}
            />

            <div className="min-w-56 space-y-6">
                {leyenda.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Qué significa cada color</p>
                        <ul className="space-y-1.5 text-sm">
                            {leyenda.map((item) => (
                                <li key={item.motivo} className="flex items-center gap-2">
                                    <span className={`size-3.5 rounded-sm ${item.color}`} />
                                    <span>{item.motivo}</span>
                                    <span className="text-muted-foreground">({item.total})</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {!diaSeleccionado ? (
                    <p className="text-muted-foreground text-sm">
                        Haz clic en un día del calendario para ver sus horarios de entrada, comida y salida.
                    </p>
                ) : !asistencia ? (
                    <p className="text-muted-foreground text-sm">
                        Sin registro el {formatFecha(diaSeleccionado.toISOString())}.
                    </p>
                ) : (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">Entrada</dt>
                        <dd>{formatHora(asistencia.HoraEntrada)}</dd>

                        <dt className="text-muted-foreground">Inicio comida</dt>
                        <dd>{formatHora(asistencia.InicioComida)}</dd>

                        <dt className="text-muted-foreground">Fin comida</dt>
                        <dd>{formatHora(asistencia.FinComida)}</dd>

                        <dt className="text-muted-foreground">Salida</dt>
                        <dd>{formatHora(asistencia.HoraSalida)}</dd>

                        <dt className="text-muted-foreground">Leyenda</dt>
                        <dd>{asistencia.Estado?.Motivo ?? '—'}</dd>
                    </dl>
                )}
            </div>
        </div>
    )
}

export default CalendarioAsistencias
