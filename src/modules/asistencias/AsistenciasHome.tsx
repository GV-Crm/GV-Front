import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarCheck, ChevronRightIcon, SearchIcon, SunIcon, UsersIcon } from 'lucide-react'
import { cn } from 'cn'
import { getCalendario, getDetalles, getEmpleados } from './api'
import type { Empleado, EstadoDia } from './types'
import DescargarReporte from './DescargarReporte'
import { EstadoBadge, EstatusBadge } from './componentes'
import { ESTADOS } from './estados'
import Avatar from '@/components/Avatar'
import Ayuda from '@/components/Ayuda'
import Desplegable from '@/components/Desplegable'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import { ELEVAR_AL_PASAR, ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { sinAcentos } from '@/lib/texto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const RESUMEN_HOY: EstadoDia[] = ['asistio', 'sin_salida', 'sin_entrada', 'pendiente']

/** Cuatro tarjetas con cuántos empleados hay hoy en cada estado. */
function TarjetasDeHoy({ estadoHoy }: { estadoHoy: Map<string, EstadoDia> }) {
    return (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {RESUMEN_HOY.map((estado, i) => {
                const estilo = ESTADOS[estado]
                const total = [...estadoHoy.values()].filter((e) => e === estado).length
                return (
                    <div
                        key={estado}
                        style={retrasoEscalonado(i)}
                        className={cn('flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs sm:p-4', ENTRADA, ELEVAR_AL_PASAR)}
                    >
                        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', estilo.badge)}>
                            <estilo.icono className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-2xl font-semibold tabular-nums">{total}</p>
                            <p className="truncate text-xs font-medium">{estilo.etiqueta}</p>
                            <p className="hidden truncate text-xs text-muted-foreground sm:block">{estilo.descripcion}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function AsistenciasHome() {
    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [estadoHoy, setEstadoHoy] = useState<Map<string, EstadoDia> | null>(null)
    const [busqueda, setBusqueda] = useState('')

    useEffect(() => {
        // Es complementario: si falla, la lista se muestra igual, solo sin el estado de hoy.
        getCalendario()
            .then((c) => setEstadoHoy(new Map(c.empleados.flatMap((e) => (e.dias[0] ? [[e.Uuid, e.dias[0].estado] as const] : [])))))
            .catch((err) => console.error('Error al obtener el estado de hoy:', err))
    }, [])

    const pedirEmpleados = useCallback(() => {
        getEmpleados()
            .then((data) => setEmpleados(data))
            .catch((err) => {
                console.error('Error al obtener empleados:', err)
                setError(true)
            })
            .finally(() => setLoading(false))
    }, [])

    useEffect(pedirEmpleados, [pedirEmpleados])

    // El endpoint general no trae nombre ni motivo, así que el reporte se arma con el detalle de cada empleado.
    const obtenerDetallesReporte = () => Promise.all(empleados.map((e) => getDetalles(e.Uuid)))

    const reintentar = () => {
        setLoading(true)
        setError(false)
        pedirEmpleados()
    }

    // Activos primero y luego por nombre; se filtra por nombre o área.
    const visibles = useMemo(() => {
        const texto = sinAcentos(busqueda.trim())
        return [...empleados]
            .filter((e) => !texto || sinAcentos(`${e.Nombre} ${e.Area ?? ''}`).includes(texto))
            .sort((a, b) => Number(b.Activo) - Number(a.Activo) || a.Nombre.localeCompare(b.Nombre))
    }, [empleados, busqueda])

    const resumenCorto =
        estadoHoy &&
        RESUMEN_HOY.map((estado) => `${[...estadoHoy.values()].filter((e) => e === estado).length} ${ESTADOS[estado].etiqueta.toLowerCase()}`)
            .slice(0, 2)
            .join(' · ')

    return (
        <div className="flex flex-1 flex-col gap-4 sm:gap-6">
            <EncabezadoPagina
                icono={CalendarCheck}
                color="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                titulo="Asistencias"
                descripcion="Elige a un empleado para ver su calendario, sus faltas y justificaciones."
                acciones={
                    <DescargarReporte
                        titulo="Reporte mensual de asistencias"
                        archivo="asistencias"
                        obtenerDetalles={obtenerDetallesReporte}
                    />
                }
            />

            {estadoHoy && (
                <section className="space-y-3">
                    <h2 className="hidden items-center gap-2 text-sm font-semibold sm:flex">
                        <SunIcon className="size-4 text-amber-500" />
                        <span className="first-letter:uppercase">Hoy, {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</span>
                        <Ayuda>Cuántos empleados activos hay hoy en cada situación. Se actualiza al abrir esta pantalla.</Ayuda>
                    </h2>
                    {/* En el celular las tarjetas quedan dentro de un panel que se despliega. */}
                    <Desplegable titulo="Resumen de hoy" icono={SunIcon} resumen={resumenCorto} soloEnMovil>
                        <TarjetasDeHoy estadoHoy={estadoHoy} />
                    </Desplegable>
                </section>
            )}

            <section className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <UsersIcon className="size-4 text-indigo-500" />
                        Empleados
                        {!loading && <span className="font-normal text-muted-foreground">({visibles.length})</span>}
                    </h2>
                    <div className="relative sm:w-72">
                        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o área"
                            className="h-9 bg-card pl-8"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-2 rounded-xl border bg-card p-3">
                        {Array.from({ length: 6 }, (_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : error ? (
                    <div className={cn('flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center', ENTRADA)}>
                        <p className="font-medium">No se pudo cargar la lista de empleados</p>
                        <p className="text-muted-foreground max-w-sm text-sm">
                            Revisa tu conexión o que el servidor esté encendido, y vuelve a intentarlo.
                        </p>
                        <Button variant="outline" onClick={reintentar}>
                            Reintentar
                        </Button>
                    </div>
                ) : visibles.length === 0 ? (
                    <div className={cn('flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center', ENTRADA)}>
                        <span className="bg-muted rounded-full p-3">
                            <UsersIcon className="text-muted-foreground size-6" />
                        </span>
                        <p className="font-medium">{busqueda ? 'Nadie coincide con tu búsqueda' : 'Todavía no hay empleados registrados'}</p>
                    </div>
                ) : (
                    <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
                        {visibles.map((e, i) => {
                            const hoy = estadoHoy?.get(e.Uuid)
                            return (
                                <li key={e.Uuid} style={retrasoEscalonado(i)} className={ENTRADA}>
                                    <Link
                                        to={`/asistencias/${e.Uuid}`}
                                        className={cn(
                                            'group flex items-center gap-3 p-3 transition-colors hover:bg-indigo-50/60 sm:px-4 dark:hover:bg-indigo-500/5',
                                            !e.Activo && 'opacity-70',
                                        )}
                                    >
                                        <Avatar nombre={e.Nombre} className={cn(!e.Activo && 'grayscale')} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-medium">{e.Nombre}</p>
                                                {!e.Activo && <EstatusBadge activo={false} />}
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground">{e.Area?.trim() || 'Sin área'}</p>
                                        </div>
                                        {hoy && <EstadoBadge estado={hoy} soloIconoEnMovil />}
                                        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-indigo-600" />
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>
        </div>
    )
}

export default AsistenciasHome
