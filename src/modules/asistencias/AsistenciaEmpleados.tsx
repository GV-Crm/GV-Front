import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    ArrowLeftIcon,
    CalendarCheckIcon,
    CalendarDaysIcon,
    ChartPieIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardListIcon,
    MousePointerClickIcon,
    PaletteIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { SiPuede } from '@/auth/SiPuede'
import Desplegable from '@/components/Desplegable'
import Segmentos from '@/components/Segmentos'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { getCalendario, getDetalles } from './api'
import type { DiaCalendario, EmpleadoDetalle } from './types'
import CalendarioMensual from './CalendarioMensual'
import DetalleDia from './DetalleDia'
import DescargarReporte from './DescargarReporte'
import JustificarFalta from './JustificarFalta'
import ResumenEmpleado from './ResumenEmpleado'
import { EstatusBadge } from './componentes'
import Avatar from '@/components/Avatar'
import { ESTADOS, ESTADOS_JUSTIFICABLES, ORDEN_ESTADOS } from './estados'
import { claveFecha, fechaDesdeClave } from './formatHora'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'

type Vista = 'calendario' | 'resumen'

const VISTAS = [
    { id: 'calendario', nombre: 'Calendario', icono: CalendarDaysIcon },
    { id: 'resumen', nombre: 'Resumen', icono: ChartPieIcon },
] as const

function inicioDeMes(fecha: Date) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), 1)
}

function sumarMeses(mes: Date, meses: number) {
    return new Date(mes.getFullYear(), mes.getMonth() + meses, 1)
}

/** Qué significa cada color del calendario, con cuántos días hubo de cada uno en el mes. */
function Leyenda({ dias, className }: { dias: DiaCalendario[]; className?: string }) {
    return (
        <Desplegable
            titulo="¿Qué significa cada color?"
            icono={PaletteIcon}
            resumen={
                <span className="flex gap-1 pt-1">
                    {ORDEN_ESTADOS.map((estado) => (
                        <span key={estado} className={cn('size-2 rounded-full', ESTADOS[estado].punto)} />
                    ))}
                </span>
            }
            className={className}
        >
            <ul className="space-y-2.5">
                {ORDEN_ESTADOS.map((estado) => {
                    const estilo = ESTADOS[estado]
                    return (
                        <li key={estado} className="flex items-start gap-2.5 text-sm">
                            <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', estilo.badge)}>
                                <estilo.icono className="size-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2 font-medium">
                                    {estilo.etiqueta}
                                    <span className="text-xs font-normal text-muted-foreground tabular-nums">
                                        {dias.filter((d) => d.estado === estado).length} días
                                    </span>
                                </span>
                                <span className="block text-xs text-muted-foreground">{estilo.descripcion}</span>
                            </span>
                        </li>
                    )
                })}
            </ul>
        </Desplegable>
    )
}

type MesCargado = { mes: string; hoy: string; dias: Map<string, DiaCalendario> } | { mes: string; error: true }

function AsistenciaDetalle() {
    const { uuid } = useParams()
    const esEscritorio = useMediaQuery('(min-width: 1024px)')

    const [empleado, setEmpleado] = useState<EmpleadoDetalle | null>(null)
    const [loading, setLoading] = useState(true)
    const [vista, setVista] = useState<Vista>('calendario')
    const [mes, setMes] = useState(() => inicioDeMes(new Date()))
    // Hacia dónde se movió el último cambio de mes (null = recién abierto).
    const [direccion, setDireccion] = useState<'derecha' | 'izquierda' | null>(null)
    const [mesCargado, setMesCargado] = useState<MesCargado | null>(null)
    const [seleccionado, setSeleccionado] = useState<string | null>(() => claveFecha(new Date()))
    const [detalleAbierto, setDetalleAbierto] = useState(false)
    // Se incrementa tras justificar una falta para volver a pedir los datos.
    const [version, setVersion] = useState(0)

    useEffect(() => {
        if (!uuid) return
        getDetalles(uuid)
            .then((data) => setEmpleado(data))
            .catch((err) => console.error('Error al obtener el empleado:', err))
            .finally(() => setLoading(false))
    }, [uuid, version])

    const claveMes = claveFecha(mes)

    useEffect(() => {
        if (!uuid) return
        let vigente = true
        const hasta = claveFecha(new Date(mes.getFullYear(), mes.getMonth() + 1, 0))

        getCalendario({ uuid, desde: claveMes, hasta })
            .then((c) => {
                if (!vigente) return
                const dias = new Map((c.empleados[0]?.dias ?? []).map((d) => [d.fecha, d]))
                setMesCargado({ mes: claveMes, hoy: c.hoy, dias })
            })
            .catch((err) => {
                console.error('Error al obtener el calendario:', err)
                if (vigente) setMesCargado({ mes: claveMes, error: true })
            })
        return () => {
            vigente = false
        }
    }, [uuid, mes, claveMes, version])

    // Al recargar el mismo mes (tras justificar) se siguen mostrando los datos anteriores, sin parpadeo.
    const cargandoMes = mesCargado?.mes !== claveMes
    const datosMes = !cargandoMes && mesCargado && !('error' in mesCargado) ? mesCargado : null
    const dias = useMemo(() => datosMes?.dias ?? new Map<string, DiaCalendario>(), [datosMes])
    const listaDias = useMemo(() => [...dias.values()], [dias])

    const mesActual = inicioDeMes(new Date())
    const mesIngreso = empleado?.Ingreso ? inicioDeMes(fechaDesdeClave(empleado.Ingreso)) : null
    const puedeRetroceder = !mesIngreso || mes > mesIngreso
    const puedeAvanzar = mes < mesActual

    const irAMes = (nuevo: Date) => {
        // El calendario entra desde el lado hacia el que se navega.
        setDireccion(nuevo > mes ? 'derecha' : 'izquierda')
        setMes(nuevo)
        setSeleccionado(null)
    }

    const seleccionar = (fecha: string) => {
        setSeleccionado(fecha)
        if (!esEscritorio) setDetalleAbierto(true)
    }

    if (loading)
        return (
            <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        )
    if (!empleado || !uuid)
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/asistencias" />}>
                    <ArrowLeftIcon data-icon="inline-start" />
                    Regresar
                </Button>
                <div className="rounded-lg border border-dashed px-6 py-16 text-center">
                    <p className="font-medium">No encontramos a este empleado</p>
                    <p className="text-muted-foreground mt-1 text-sm">Regresa a la lista y elige otro empleado.</p>
                </div>
            </div>
        )

    const diaSeleccionado = seleccionado ? dias.get(seleccionado) : undefined
    const detalle = (
        <DetalleDia
            // La clave hace que la animación de entrada se repita al elegir otro día.
            key={seleccionado ?? 'ninguno'}
            fecha={seleccionado}
            dia={diaSeleccionado}
            accion={
                diaSeleccionado && ESTADOS_JUSTIFICABLES.includes(diaSeleccionado.estado) ? (
                    <SiPuede accion="justificar" recurso="Falta">
                        <JustificarFalta
                            key={diaSeleccionado.fecha}
                            uuid={uuid}
                            dia={diaSeleccionado}
                            onCambio={() => setVersion((v) => v + 1)}
                        />
                    </SiPuede>
                ) : undefined
            }
        />
    )

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <section className={cn('overflow-hidden rounded-xl border bg-card', ENTRADA)}>
                <div className="flex items-center gap-2 p-2 sm:gap-3 sm:p-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Regresar a empleados"
                        title="Regresar a la lista de empleados"
                        nativeButton={false}
                        render={<Link to="/asistencias" />}
                    >
                        <ArrowLeftIcon />
                    </Button>
                    <Avatar nombre={empleado.Nombre} foto={empleado.Foto} className={cn(COLOR_SECCION.personas.suave, 'size-10 sm:size-12 sm:text-base')} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-base font-semibold sm:text-xl">{empleado.Nombre}</h1>
                            <EstatusBadge activo={empleado.Activo} />
                        </div>
                        <p className="text-muted-foreground truncate text-xs sm:text-sm">
                            {empleado.Area?.trim() || 'Sin área'}
                            {empleado.Ingreso &&
                                ` · Ingreso ${format(fechaDesdeClave(empleado.Ingreso), 'd MMM yyyy', { locale: es })}`}
                        </p>
                    </div>
                    <DescargarReporte
                        titulo={`Reporte mensual de asistencias · ${empleado.Nombre}`}
                        archivo={`asistencias-${empleado.Nombre}`}
                        obtenerDetalles={() => [empleado]}
                    />
                </div>
            </section>

            {/* En el celular: las pestañas ocupan todo el ancho y el mes va en su propia fila. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Segmentos
                    etiqueta="Vista"
                    opciones={VISTAS}
                    valor={vista}
                    onCambio={setVista}
                    className="w-full sm:w-fit"
                />

                <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mes anterior"
                        title="Mes anterior"
                        disabled={!puedeRetroceder}
                        onClick={() => irAMes(sumarMeses(mes, -1))}
                    >
                        <ChevronLeftIcon />
                    </Button>
                    <span
                        key={claveMes}
                        className={cn('flex-1 text-center text-sm font-semibold first-letter:uppercase sm:min-w-32', ENTRADA)}
                    >
                        {format(mes, 'LLLL yyyy', { locale: es })}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mes siguiente"
                        title="Mes siguiente"
                        disabled={!puedeAvanzar}
                        onClick={() => irAMes(sumarMeses(mes, 1))}
                    >
                        <ChevronRightIcon />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        title="Ir al mes actual"
                        disabled={claveMes === claveFecha(mesActual)}
                        onClick={() => {
                            setDireccion(mesActual > mes ? 'derecha' : 'izquierda')
                            setMes(mesActual)
                            setSeleccionado(claveFecha(new Date()))
                        }}
                    >
                        <CalendarCheckIcon data-icon="inline-start" />
                        Hoy
                    </Button>
                </div>
            </div>

            {mesCargado && 'error' in mesCargado && !cargandoMes ? (
                <div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
                    No se pudo cargar este mes. Revisa tu conexión e inténtalo de nuevo.
                </div>
            ) : vista === 'resumen' ? (
                <ResumenEmpleado mes={mes} dias={listaDias} cargando={cargandoMes} asistencias={empleado.Asistencias} />
            ) : (
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="space-y-3">
                        <section className={cn('rounded-xl border bg-card p-2 sm:p-4', ENTRADA)}>
                            <p className="mb-2 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                                <MousePointerClickIcon className="size-3.5" />
                                {esEscritorio ? 'Haz clic en un día para ver sus horarios.' : 'Toca un día para ver sus horarios.'}
                            </p>
                            <CalendarioMensual
                                key={claveMes}
                                direccion={direccion}
                                mes={mes}
                                dias={dias}
                                hoy={datosMes?.hoy ?? claveFecha(new Date())}
                                seleccionado={seleccionado}
                                onSeleccionar={seleccionar}
                                cargando={cargandoMes}
                            />
                        </section>
                        {!esEscritorio && <Leyenda dias={listaDias} />}
                    </div>

                    {esEscritorio && (
                        <aside
                            style={retrasoEscalonado(2)}
                            className={cn('sticky top-18 space-y-4 rounded-xl border bg-card p-4', ENTRADA)}
                        >
                            <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                <ClipboardListIcon className="size-4" />
                                Detalle del día
                            </h2>
                            {detalle}
                            <Leyenda dias={listaDias} className="shadow-none" />
                        </aside>
                    )}
                </div>
            )}

            {!esEscritorio && (
                <Drawer open={detalleAbierto} onOpenChange={setDetalleAbierto}>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>Detalle del día</DrawerTitle>
                        </DrawerHeader>
                        <div className="overflow-y-auto px-4 pb-6">{detalle}</div>
                    </DrawerContent>
                </Drawer>
            )}
        </div>
    )
}

export default AsistenciaDetalle
