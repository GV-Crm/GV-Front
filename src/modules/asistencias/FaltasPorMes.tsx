import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarXIcon } from 'lucide-react'
import type { EmpleadoDetalle } from './types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

type Asistencia = EmpleadoDetalle['Asistencias'][number]

type Fila = { mes: Date; faltas: number; justificadas: number }

/** Clave YYYY-MM en hora local, igual que el calendario, para que un día caiga en el mismo mes en ambos. */
function claveMes(fecha: Date) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Faltas por mes, del mes actual hacia atrás hasta el del primer registro (los meses sin faltas salen en 0).
 * Se cuenta por texto del motivo, igual que los colores del calendario.
 */
function calcularFilas(asistencias: Asistencia[]) {
    const porMes = new Map<string, Fila>()
    let primero: Date | undefined

    for (const a of asistencias) {
        if (!a.HoraEntrada) continue
        const fecha = new Date(a.HoraEntrada)
        if (!primero || fecha < primero) primero = fecha

        const motivo = a.Estado?.Motivo.trim()
        if (motivo !== 'Falta' && motivo !== 'Falta Justificada') continue

        const clave = claveMes(fecha)
        const fila = porMes.get(clave) ?? {
            mes: new Date(fecha.getFullYear(), fecha.getMonth()),
            faltas: 0,
            justificadas: 0,
        }
        if (motivo === 'Falta') fila.faltas++
        else fila.justificadas++
        porMes.set(clave, fila)
    }

    if (!primero) return []

    const resultado: Fila[] = []
    const hoy = new Date()
    const inicio = new Date(primero.getFullYear(), primero.getMonth())
    for (let mes = new Date(hoy.getFullYear(), hoy.getMonth()); mes >= inicio; mes.setMonth(mes.getMonth() - 1)) {
        resultado.push(porMes.get(claveMes(mes)) ?? { mes: new Date(mes), faltas: 0, justificadas: 0 })
    }
    return resultado
}

function Resumen({ titulo, valor, detalle }: { titulo: string; valor: number; detalle: string }) {
    return (
        <div className="bg-muted/40 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">{titulo}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{valor}</p>
            <p className="text-muted-foreground mt-1 text-xs">{detalle}</p>
        </div>
    )
}

/** Botón que abre un drawer con las faltas del empleado: resumen arriba y detalle mes por mes abajo. */
function FaltasPorMes({ nombre, asistencias }: { nombre: string; asistencias: Asistencia[] }) {
    const filas = useMemo(() => calcularFilas(asistencias), [asistencias])

    const totalFaltas = filas.reduce((suma, f) => suma + f.faltas, 0)
    const totalJustificadas = filas.reduce((suma, f) => suma + f.justificadas, 0)
    const total = totalFaltas + totalJustificadas
    // filas[0] siempre es el mes actual.
    const esteMes = filas[0] ? filas[0].faltas + filas[0].justificadas : 0

    return (
        <Drawer>
            <DrawerTrigger render={<Button variant="outline" size="lg" />}>
                <CalendarXIcon data-icon="inline-start" />
                Ver faltas por mes
                <Badge variant={total > 0 ? 'destructive' : 'secondary'}>{total}</Badge>
            </DrawerTrigger>

            <DrawerContent>
                <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
                    <DrawerHeader className="gap-1 px-6 pt-6">
                        <DrawerTitle className="text-xl">Faltas de {nombre}</DrawerTitle>
                    </DrawerHeader>

                    {/* Solo esta parte hace scroll; título y botón de cerrar quedan siempre a la vista. */}
                    <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
                        {filas.length === 0 ? (
                            <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
                                Este empleado todavía no tiene registros de asistencia.
                            </p>
                        ) : (
                            <>
                                <section className="grid gap-3 sm:grid-cols-3">
                                    <Resumen
                                        titulo="Este mes"
                                        valor={esteMes}
                                        detalle={format(new Date(), 'LLLL yyyy', { locale: es })}
                                    />
                                    <Resumen titulo="Sin justificar" valor={totalFaltas} detalle="En todo el historial" />
                                    <Resumen titulo="Justificadas" valor={totalJustificadas} detalle="En todo el historial" />
                                </section>

                                <section className="space-y-3">
                                    <div>
                                        <h3 className="font-medium">Detalle por mes</h3>
                                    </div>

                                    <div className="rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="pl-4">Mes</TableHead>
                                                    <TableHead className="text-right">Sin justificar</TableHead>
                                                    <TableHead className="text-right">Justificadas</TableHead>
                                                    <TableHead className="pr-4 text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filas.map((f) => {
                                                    const totalMes = f.faltas + f.justificadas
                                                    return (
                                                        <TableRow
                                                            key={claveMes(f.mes)}
                                                            className={totalMes === 0 ? 'text-muted-foreground' : undefined}
                                                        >
                                                            <TableCell className="pl-4 capitalize">
                                                                {format(f.mes, 'LLLL yyyy', { locale: es })}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums">{f.faltas}</TableCell>
                                                            <TableCell className="text-right tabular-nums">{f.justificadas}</TableCell>
                                                            <TableCell className="pr-4 text-right">
                                                                <Badge variant={totalMes > 0 ? 'destructive' : 'secondary'}>
                                                                    {totalMes}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow>
                                                    <TableCell className="pl-4">Total</TableCell>
                                                    <TableCell className="text-right tabular-nums">{totalFaltas}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{totalJustificadas}</TableCell>
                                                    <TableCell className="pr-4 text-right tabular-nums">{total}</TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </div>
                                </section>
                            </>
                        )}
                    </div>

                    <DrawerFooter className="flex-row items-center justify-between gap-4 border-t px-6 py-4">
                        <DrawerClose render={<Button variant="outline" />}>Cerrar</DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export default FaltasPorMes
