import { useState } from 'react'
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DownloadIcon,
    FileSpreadsheetIcon,
    FileTextIcon,
    Loader2Icon,
    SheetIcon,
} from 'lucide-react'
import {
    armarReporte,
    descargarCSV,
    descargarExcel,
    descargarPDF,
    nombreDeArchivo,
    nombreMes,
    tieneRegistros,
} from './reportes'
import type { EmpleadoDetalle } from './types'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Formato = 'pdf' | 'excel' | 'csv'

const FORMATOS: { id: Formato; nombre: string; ayuda: string; icono: typeof FileTextIcon }[] = [
    { id: 'pdf', nombre: 'PDF', ayuda: 'Para imprimir o enviar por correo', icono: FileTextIcon },
    { id: 'excel', nombre: 'Excel', ayuda: 'Para filtrar y hacer cálculos', icono: FileSpreadsheetIcon },
    { id: 'csv', nombre: 'CSV', ayuda: 'Para importar en otros sistemas', icono: SheetIcon },
]

function inicioDeMes(fecha: Date) {
    return new Date(fecha.getFullYear(), fecha.getMonth())
}

/**
 * Botón desplegable para descargar el reporte mensual de asistencias.
 * Dentro del menú se elige el mes (por defecto el actual) y luego el formato.
 * `obtenerDetalles` se llama al elegir un formato, así los datos se piden solo cuando hacen falta.
 */
function DescargarReporte({
    titulo,
    archivo,
    obtenerDetalles,
}: {
    titulo: string
    /** Prefijo del nombre del archivo; se le agrega el mes. */
    archivo: string
    obtenerDetalles: () => EmpleadoDetalle[] | Promise<EmpleadoDetalle[]>
}) {
    const mesActual = inicioDeMes(new Date())
    const [mes, setMes] = useState(mesActual)
    const [generando, setGenerando] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)

    const esMesActual = mes.getTime() >= mesActual.getTime()
    const moverMes = (delta: number) => setMes(new Date(mes.getFullYear(), mes.getMonth() + delta))

    async function descargar(formato: Formato) {
        setGenerando(true)
        setAviso(null)
        try {
            const reporte = armarReporte(await obtenerDetalles(), mes, titulo)
            if (!tieneRegistros(reporte)) {
                setAviso(`No hay asistencias registradas en ${nombreMes(mes)}.`)
                return
            }
            const nombre = nombreDeArchivo(archivo, nombreMes(mes))
            if (formato === 'pdf') await descargarPDF(reporte, nombre)
            else if (formato === 'excel') await descargarExcel(reporte, nombre)
            else descargarCSV(reporte, nombre)
        } catch (err) {
            console.error('Error al generar el reporte:', err)
            setAviso('No se pudo generar el reporte. Inténtalo de nuevo.')
        } finally {
            setGenerando(false)
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={<Button variant="outline" size="lg" disabled={generando} aria-label="Descargar reporte" />}
                >
                    {generando ? (
                        <Loader2Icon data-icon="inline-start" className="animate-spin" />
                    ) : (
                        <DownloadIcon data-icon="inline-start" />
                    )}
                    {/* En móvil solo el ícono, para que quepa junto al nombre del empleado. */}
                    <span className="hidden sm:inline">{generando ? 'Generando…' : 'Descargar reporte'}</span>
                    <ChevronDownIcon data-icon="inline-end" className="hidden sm:block" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>1. Elige el mes</DropdownMenuLabel>
                        {/* Botones sueltos (no items del menú) para que cambiar de mes no cierre el menú. */}
                        <div className="flex items-center justify-between gap-2 px-1 py-1">
                            <Button variant="ghost" size="icon-sm" aria-label="Mes anterior" onClick={() => moverMes(-1)}>
                                <ChevronLeftIcon />
                            </Button>
                            <span className="text-sm font-medium capitalize">{nombreMes(mes)}</span>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Mes siguiente"
                                disabled={esMesActual}
                                onClick={() => moverMes(1)}
                            >
                                <ChevronRightIcon />
                            </Button>
                        </div>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuLabel>2. Elige el formato para descargar</DropdownMenuLabel>
                        {FORMATOS.map((f) => (
                            <DropdownMenuItem key={f.id} className="gap-3 py-2" onClick={() => descargar(f.id)}>
                                <f.icono className="text-muted-foreground size-5" />
                                <div>
                                    <p className="font-medium">{f.nombre}</p>
                                    <p className="text-muted-foreground text-xs">{f.ayuda}</p>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {aviso && <p className="text-destructive text-xs">{aviso}</p>}
        </div>
    )
}

export default DescargarReporte
