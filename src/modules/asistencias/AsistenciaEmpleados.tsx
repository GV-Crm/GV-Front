import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeftIcon, CalendarDaysIcon, ChartPieIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from 'cn'
import { SiPuede } from '@/auth/SiPuede'
import Segmentos from '@/components/Segmentos'
import { useMediaQuery } from '@/hooks/use-media-query'
import { getCalendario, getDetalles } from './api'
import type { DiaCalendario, EmpleadoDetalle } from './types'
import CalendarioMensual from './CalendarioMensual'
import DetalleDia from './DetalleDia'
import DescargarReporte from './DescargarReporte'
import JustificarFalta from './JustificarFalta'
import ResumenEmpleado from './ResumenEmpleado'
import { AvatarEmpleado, EstatusBadge } from './componentes'
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

function Leyenda({ dias, className }: { dias: DiaCalendario[]; className?: string }) {
    return (
        <ul className={cn('flex flex-wrap gap-x-3 gap-y-1.5 text-xs', className)}>
            {ORDEN_ESTADOS.map((estado) => (
                <li key={estado} className="flex items-center gap-1.5">
                    <span className={cn('size-2.5 rounded-full', ESTADOS[estado].punto)} />
                    <span>{ESTADOS[estado].etiqueta}</span>
                    <span className="text-muted-foreground tabular-nums">
                        ({dias.filter((d) => d.estado === estado).length})
                    </span>
                </li>
            ))}
        </ul>
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
        <div className="flex flex-col gap-3 sm:gap-4">
            <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
                <div className="h-1 bg-linear-to-r from-indigo-500 via-violet-500 to-sky-500" />
                <div className="flex items-center gap-2 p-2 sm:gap-3 sm:p-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Regresar a empleados"
                        nativeButton={false}
                        render={<Link to="/asistencias" />}
                    >
                        <ArrowLeftIcon />
                    </Button>
                    <AvatarEmpleado nombre={empleado.Nombre} className="size-10 sm:size-12 sm:text-base" />
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

            <div className="flex flex-wrap items-center justify-between gap-2">
                <Segmentos etiqueta="Vista" opciones={VISTAS} valor={vista} onCambio={setVista} />

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Mes anterior"
                        disabled={!puedeRetroceder}
                        onClick={() => irAMes(sumarMeses(mes, -1))}
                    >
                        <ChevronLeftIcon />
                    </Button>
                    <span className="min-w-32 text-center text-sm font-semibold first-letter:uppercase">
                        {format(mes, 'LLLL yyyy', { locale: es })}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Mes siguiente"
                        disabled={!puedeAvanzar}
                        onClick={() => irAMes(sumarMeses(mes, 1))}
                    >
                        <ChevronRightIcon />
                    </Button>
                    <Button
                        variant="ghost"
                        disabled={claveMes === claveFecha(mesActual)}
                        onClick={() => {
                            setMes(mesActual)
                            setSeleccionado(claveFecha(new Date()))
                        }}
                    >
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
                    <section className="rounded-xl border bg-card p-2 shadow-xs sm:p-4">
                        <CalendarioMensual
                            mes={mes}
                            dias={dias}
                            hoy={datosMes?.hoy ?? claveFecha(new Date())}
                            seleccionado={seleccionado}
                            onSeleccionar={seleccionar}
                            cargando={cargandoMes}
                        />
                        <Leyenda dias={listaDias} className="mt-3 border-t px-1 pt-3 lg:hidden" />
                    </section>

                    {esEscritorio && (
                        <aside className="sticky top-4 space-y-4 rounded-xl border bg-card p-4 shadow-xs">
                            <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                Detalle del día
                            </h2>
                            {detalle}
                            <Leyenda dias={listaDias} className="border-t pt-4" />
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
