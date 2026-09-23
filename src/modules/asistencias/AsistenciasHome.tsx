import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRightIcon, GalleryHorizontalIcon, TableIcon, UsersIcon } from 'lucide-react'
import { getDetalles, getEmpleados } from './api'
import type { Empleado, EmpleadoDetalle } from './types'
import CalendarioAsistencias from './CalendarioAsistencias'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type Vista = 'tabla' | 'carrusel'

/**
 * Tamaño de cada día para que el calendario llene la tarjeta sin desbordarla.
 * Alto: 100svh menos lo que ocupan header, título, tarjeta y contador (~24rem), entre 7 filas.
 * Ancho: el de la tarjeta (100cqw) menos la columna de leyenda (~18rem), entre 7 columnas.
 */
const CELDA_CARRUSEL = 'clamp(2.75rem, min(calc((100svh - 24rem) / 7), calc((100cqw - 18rem) / 7)), 7rem)'

function EstatusBadge({ activo }: { activo: boolean }) {
    return activo ? (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Activo</Badge>
    ) : (
        <Badge variant="secondary">Inactivo</Badge>
    )
}

/**
 * Una tarjeta del carrusel. Pide su detalle solo cuando `cargar` se vuelve true
 * (la tarjeta visible y sus vecinas), para no disparar una petición por empleado al abrir.
 */
function SlideEmpleado({ empleado, cargar }: { empleado: Empleado; cargar: boolean }) {
    const [detalle, setDetalle] = useState<EmpleadoDetalle | null>(null)
    const [error, setError] = useState(false)
    const pedido = detalle !== null || error

    useEffect(() => {
        if (!cargar || pedido) return

        getDetalles(empleado.Uuid)
            .then((data) => setDetalle(data))
            .catch((err) => {
                console.error('Error al obtener el empleado:', err)
                setError(true)
            })
    }, [cargar, pedido, empleado.Uuid])

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-xl">{empleado.Nombre}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                    {empleado.Area}
                    <EstatusBadge activo={empleado.Activo} />
                </CardDescription>
                <CardAction>
                    <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link to={`/asistencias/${empleado.Uuid}`} />}
                    >
                        Ver detalle y faltas
                        <ChevronRightIcon data-icon="inline-end" />
                    </Button>
                </CardAction>
            </CardHeader>
            {/* @container: el calendario mide su ancho contra la tarjeta, no contra la ventana. */}
            <CardContent className="@container flex-1">
                {error ? (
                    <p className="text-muted-foreground text-sm">No se pudieron cargar las asistencias.</p>
                ) : !detalle ? (
                    <p className="text-muted-foreground text-sm">Cargando asistencias...</p>
                ) : (
                    <CalendarioAsistencias asistencias={detalle.Asistencias} tamanoCelda={CELDA_CARRUSEL} />
                )}
            </CardContent>
        </Card>
    )
}

function AsistenciasHome() {
    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [vista, setVista] = useState<Vista>('tabla')
    const [api, setApi] = useState<CarouselApi>()
    const [actual, setActual] = useState(0)

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

    useEffect(() => {
        if (!api) return
        const alSeleccionar = () => setActual(api.selectedScrollSnap())
        alSeleccionar()
        api.on('select', alSeleccionar)
        return () => {
            api.off('select', alSeleccionar)
        }
    }, [api])

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Empleados</h1>
                    
                </div>

                <ToggleGroup
                    variant="outline"
                    size="sm"
                    spacing={0}
                    value={[vista]}
                    onValueChange={(valor) => valor[0] && setVista(valor[0] as Vista)}
                >
                    <ToggleGroupItem value="tabla" aria-label="Vista de tabla">
                        <TableIcon />
                        Tabla
                    </ToggleGroupItem>
                    <ToggleGroupItem value="carrusel" aria-label="Vista de carrusel">
                        <GalleryHorizontalIcon />
                        Carrusel
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

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
            ) : vista === 'tabla' ? (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4">Nombre</TableHead>
                                <TableHead>Área</TableHead>
                                <TableHead>Estatus</TableHead>
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
                                        <Link to={`/asistencias/${a.Uuid}`} className="group-hover:underline">
                                            {a.Nombre}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{a.Area}</TableCell>
                                    <TableCell>
                                        <EstatusBadge activo={a.Activo} />
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
            ) : (
                // flex-1 en cadena hasta la tarjeta para que el carrusel llene el alto restante de la pantalla.
                <div className="flex flex-1 flex-col px-12">
                    <Carousel
                        setApi={setApi}
                        className="flex flex-1 flex-col [&>[data-slot=carousel-content]]:flex-1"
                    >
                        <CarouselContent className="h-full">
                            {ordenados.map((a, i) => (
                                <CarouselItem key={a.Uuid}>
                                    <SlideEmpleado empleado={a} cargar={Math.abs(i - actual) <= 1} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                    <p className="text-muted-foreground mt-3 shrink-0 text-center text-sm">
                        Empleado {actual + 1} de {ordenados.length} · usa las flechas para cambiar
                    </p>
                </div>
            )}
        </div>
    )
}

export default AsistenciasHome
