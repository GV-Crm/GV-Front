import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'
import { getDetalles } from './api'
import type { EmpleadoDetalle } from './types'
import CalendarioAsistencias from './CalendarioAsistencias'
import FaltasPorMes from './FaltasPorMes'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function BotonRegresar() {
    return (
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/asistencias" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            Regresar
        </Button>
    )
}

function AsistenciaDetalle() {
    const { uuid } = useParams()
    const [empleado, setEmpleado] = useState<EmpleadoDetalle | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!uuid) return

        getDetalles(uuid)
            .then((data) => setEmpleado(data))
            .catch((err) => console.error('Error al obtener el empleado:', err))
            .finally(() => setLoading(false))
    }, [uuid])

    if (loading)
        return (
            <div className="space-y-4">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-80 w-full max-w-md" />
            </div>
        )
    if (!empleado)
        return (
            <div className="space-y-4">
                <BotonRegresar />
                <div className="rounded-lg border border-dashed px-6 py-16 text-center">
                    <p className="font-medium">No encontramos a este empleado</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Regresa a la lista y elige otro empleado.
                    </p>
                </div>
            </div>
        )

    return (
        <div>
            <BotonRegresar />
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">{empleado.Nombre}</h1>
                    <p className="text-muted-foreground">{empleado.Area}</p>
                </div>
                <FaltasPorMes nombre={empleado.Nombre} asistencias={empleado.Asistencias} />
            </div>

            <div className="mt-6">
                <CalendarioAsistencias asistencias={empleado.Asistencias} />
            </div>
        </div>
    )
}

export default AsistenciaDetalle
