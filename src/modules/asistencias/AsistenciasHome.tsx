import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRightIcon, UsersIcon } from 'lucide-react'
import { cn } from 'cn'
import { getCalendario, getDetalles, getEmpleados } from './api'
import type { Empleado, EstadoDia } from './types'
import DescargarReporte from './DescargarReporte'
import { AvatarEmpleado, EstadoBadge, EstatusBadge } from './componentes'
import { ESTADOS } from './estados'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const RESUMEN_HOY: EstadoDia[] = ['asistio', 'sin_salida', 'sin_entrada', 'pendiente']

function AsistenciasHome() {
    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [estadoHoy, setEstadoHoy] = useState<Map<string, EstadoDia> | null>(null)

    useEffect(() => {
        // Es complementario: si falla, la lista se muestra igual, solo sin el estado de hoy.
        getCalendario()
            .then((c) => setEstadoHoy(new Map(c.empleados.flatMap((e) => (e.dias[0] ? [[e.Uuid, e.dias[0].estado] as const] : [])))))
            .catch((err) => console.error('Error al obtener el estado de hoy:', err))
    }, [])

    const navigate = useNavigate()

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

    // Activos primero; sort es estable, así que dentro de cada grupo se respeta el orden de la API.
    const ordenados = useMemo(
        () => [...empleados].sort((a, b) => Number(b.Activo) - Number(a.Activo)),
        [empleados],
    )

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h1 className="text-2xl font-semibold">Empleados</h1>

                <DescargarReporte
                    titulo="Reporte mensual de asistencias"
                    archivo="asistencias"
                    obtenerDetalles={obtenerDetallesReporte}
                />
            </div>

            {estadoHoy && (
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {RESUMEN_HOY.map((estado) => {
                        const estilo = ESTADOS[estado]
                        const total = [...estadoHoy.values()].filter((e) => e === estado).length
                        return (
                            <div key={estado} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
                                <span className={cn('flex size-10 items-center justify-center rounded-lg', estilo.badge)}>
                                    <estilo.icono className="size-5" />
                                </span>
                                <div>
                                    <p className="text-2xl font-semibold tabular-nums">{total}</p>
                                    <p className="text-muted-foreground text-xs">{estilo.etiqueta} hoy</p>
                                </div>
                            </div>
                        )
                    })}
                </section>
            )}

            {loading ? (
                <div className="space-y-3 rounded-lg border p-4">
                    {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                    ))}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
                    <p className="font-medium">No se pudo cargar la lista de empleados</p>
                    <p className="text-muted-foreground max-w-sm text-sm">
                        Revisa tu conexión o que el servidor esté encendido, y vuelve a intentarlo.
                    </p>
                    <Button variant="outline" onClick={reintentar}>
                        Reintentar
                    </Button>
                </div>
            ) : ordenados.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
                    <div className="bg-muted rounded-full p-3">
                        <UsersIcon className="text-muted-foreground size-6" />
                    </div>
                    <p className="font-medium">Todavía no hay empleados registrados</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="pl-4">Nombre</TableHead>
                                <TableHead>Área</TableHead>
                                <TableHead>Estatus</TableHead>
                                <TableHead>Hoy</TableHead>
                                <TableHead className="w-0 pr-4">
                                    <span className="sr-only">Abrir</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ordenados.map((a) => (
                                // Toda la fila abre el detalle; el Link queda para navegar con teclado.
                                <TableRow
                                    key={a.Uuid}
                                    className="group cursor-pointer"
                                    onClick={() => navigate(`/asistencias/${a.Uuid}`)}
                                >
                                    <TableCell className="py-3 pl-4 font-medium">
                                        <div className="flex items-center gap-3">
                                            <AvatarEmpleado nombre={a.Nombre} />
                                            <Link to={`/asistencias/${a.Uuid}`} className="group-hover:underline">
                                                {a.Nombre}
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{a.Area?.trim()}</TableCell>
                                    <TableCell>
                                        <EstatusBadge activo={a.Activo} />
                                    </TableCell>
                                    <TableCell>
                                        {estadoHoy?.get(a.Uuid) ? (
                                            <EstadoBadge estado={estadoHoy.get(a.Uuid)!} />
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="pr-4">
                                        <span className="text-muted-foreground group-hover:text-foreground flex items-center justify-end gap-1 text-sm whitespace-nowrap">
                                            Ver asistencias
                                            <ChevronRightIcon className="size-4" />
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

export default AsistenciasHome
