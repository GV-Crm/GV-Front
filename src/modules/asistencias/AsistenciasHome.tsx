import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarCheck, ChevronRightIcon, SearchIcon, SunIcon, UsersIcon } from 'lucide-react'
import { cn } from 'cn'
import { getCalendario, getEmpleados } from './api'
import type { Empleado, EmpleadoCalendario } from './types'
import DescargarReporte from './DescargarReporte'
import { EstadoBadge, EstatusBadge } from './componentes'
import PanelDeHoy from './PanelDeHoy'
import Avatar from '@/components/Avatar'
import Ayuda from '@/components/Ayuda'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { sinAcentos } from '@/lib/texto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

function AsistenciasHome() {
    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    // Calendario de hoy de los trabajadores activos (para el panel y el estado de cada uno en la lista).
    const [hoy, setHoy] = useState<EmpleadoCalendario[] | null>(null)
    const [busqueda, setBusqueda] = useState('')

    const pedirHoy = useCallback(() => {
        // Es complementario: si falla, la lista se muestra igual, solo sin el panel de hoy.
        getCalendario()
            .then((c) => setHoy(c.empleados))
            .catch((err) => console.error('Error al obtener el estado de hoy:', err))
    }, [])

    useEffect(pedirHoy, [pedirHoy])

    // Mientras alguien tenga un permiso de salida abierto, se vuelve a pedir cada 15 s
    // para que su checada aparezca sola como "Salió con permiso".
    const hayPermisoActivo = useMemo(
        () => Boolean(hoy?.some((e) => e.dias[0]?.permisoSalida?.situacion === 'activo')),
        [hoy],
    )
    useEffect(() => {
        if (!hayPermisoActivo) return
        const intervalo = setInterval(pedirHoy, 15_000)
        return () => clearInterval(intervalo)
    }, [hayPermisoActivo, pedirHoy])

    const estadoHoy = useMemo(
        () => (hoy ? new Map(hoy.flatMap((e) => (e.dias[0] ? [[e.Uuid, e.dias[0].estado] as const] : []))) : null),
        [hoy],
    )

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

    return (
        <div className="flex flex-1 flex-col gap-6 sm:gap-8">
            <EncabezadoPagina
                icono={CalendarCheck}
                titulo="Asistencias"
                acciones={
                    <DescargarReporte titulo="Reporte mensual de asistencias" archivo="asistencias" />
                }
            />

            {hoy && (
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <SunIcon className={cn('size-4', COLOR_SECCION.indicadores.texto)} />
                        <span className="first-letter:uppercase">Hoy, {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</span>
                        <Ayuda>
                            Cómo va el día de los trabajadores activos: quién llegó, quién llegó tarde (después de las 8:15), quién
                            faltó (sin registros, o llegó después de las 9:00) y quién no ha llegado. Se actualiza al abrir esta
                            pantalla. Toca a alguien para ver su calendario.
                        </Ayuda>
                    </h2>
                    <PanelDeHoy empleados={hoy} onCambio={pedirHoy} />
                </section>
            )}

            <section className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                        <UsersIcon className={cn('size-4', COLOR_SECCION.personas.texto)} />
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
                    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                        {visibles.map((e, i) => {
                            const estadoDeHoy = estadoHoy?.get(e.Uuid)
                            return (
                                <li key={e.Uuid} style={retrasoEscalonado(i)} className={ENTRADA}>
                                    <Link
                                        to={`/asistencias/${e.Uuid}`}
                                        className={cn(
                                            'group flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 sm:px-4',
                                            !e.Activo && 'opacity-70',
                                        )}
                                    >
                                        <Avatar nombre={e.Nombre} foto={e.Foto} className={cn(COLOR_SECCION.personas.suave, !e.Activo && 'grayscale')} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate font-medium">{e.Nombre}</p>
                                                {!e.Activo && <EstatusBadge activo={false} />}
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground">{e.Area?.trim() || 'Sin área'}</p>
                                        </div>
                                        {estadoDeHoy && <EstadoBadge estado={estadoDeHoy} soloIconoEnMovil />}
                                        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground" />
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
