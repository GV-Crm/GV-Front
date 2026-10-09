import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { fechaDeRegistro } from './formatHora'
import type { EmpleadoDetalle } from './types'
import { Badge } from '@/components/ui/badge'
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
        const fecha = fechaDeRegistro(a)
        if (!fecha) continue
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

/** Historial de faltas del empleado, mes por mes, con totales. */
function FaltasPorMes({ asistencias }: { asistencias: Asistencia[] }) {
    const filas = useMemo(() => calcularFilas(asistencias), [asistencias])

    const totalFaltas = filas.reduce((suma, f) => suma + f.faltas, 0)
    const totalJustificadas = filas.reduce((suma, f) => suma + f.justificadas, 0)

    if (filas.length === 0) {
        return (
            <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
                Este empleado todavía no tiene registros de asistencia.
            </p>
        )
    }

    return (
        // Altura acotada: el historial puede ser largo y no debe empujar el resto de la página.
        <div className="max-h-80 overflow-y-auto rounded-lg border">
            <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
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
                            <TableRow key={claveMes(f.mes)} className={totalMes === 0 ? 'text-muted-foreground' : undefined}>
                                <TableCell className="pl-4 capitalize">{format(f.mes, 'LLLL yyyy', { locale: es })}</TableCell>
                                <TableCell className="text-right tabular-nums">{f.faltas}</TableCell>
                                <TableCell className="text-right tabular-nums">{f.justificadas}</TableCell>
                                <TableCell className="pr-4 text-right">
                                    <Badge variant={totalMes > 0 ? 'destructive' : 'secondary'}>{totalMes}</Badge>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
                <TableFooter className="sticky bottom-0">
                    <TableRow>
                        <TableCell className="pl-4">Total</TableCell>
                        <TableCell className="text-right tabular-nums">{totalFaltas}</TableCell>
                        <TableCell className="text-right tabular-nums">{totalJustificadas}</TableCell>
                        <TableCell className="pr-4 text-right tabular-nums">{totalFaltas + totalJustificadas}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    )
}

export default FaltasPorMes
