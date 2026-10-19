import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ESTADOS } from './estados'
import { fechaDesdeClave, formatDuracion, formatHora, horasDelDia } from './formatHora'
import type { DiaCalendario, EmpleadoCalendario } from './types'

/** Un día de un empleado. */
type FilaDia = {
    fecha: string
    entrada: string
    inicioComida: string
    finComida: string
    salida: string
    horasExtra: string
    motivo: string
}

type Resumen = { dias: number; asistencias: number; retardos: number; faltas: number; horasExtra: string }

type EmpleadoReporte = { nombre: string; area: string; dias: FilaDia[]; resumen: Resumen }

export type ReporteMes = { mes: Date; titulo: string; empleados: EmpleadoReporte[] }

const COLUMNAS_DIA: { titulo: string; campo: keyof FilaDia; ancho: number }[] = [
    { titulo: 'Fecha', campo: 'fecha', ancho: 14 },
    { titulo: 'Entrada', campo: 'entrada', ancho: 10 },
    { titulo: 'Inicio comida', campo: 'inicioComida', ancho: 14 },
    { titulo: 'Fin comida', campo: 'finComida', ancho: 12 },
    { titulo: 'Salida', campo: 'salida', ancho: 10 },
    { titulo: 'Horas extra', campo: 'horasExtra', ancho: 12 },
    { titulo: 'Estado', campo: 'motivo', ancho: 40 },
]

const COLUMNAS_RESUMEN: { titulo: string; valor: (e: EmpleadoReporte) => string | number; ancho: number }[] = [
    { titulo: 'Empleado', valor: (e) => e.nombre, ancho: 28 },
    { titulo: 'Área', valor: (e) => e.area, ancho: 18 },
    { titulo: 'Días', valor: (e) => e.resumen.dias, ancho: 8 },
    { titulo: 'Asistencias', valor: (e) => e.resumen.asistencias, ancho: 12 },
    { titulo: 'Retardos', valor: (e) => e.resumen.retardos, ancho: 12 },
    { titulo: 'Faltas', valor: (e) => e.resumen.faltas, ancho: 12 },
    { titulo: 'Horas extra', valor: (e) => e.resumen.horasExtra, ancho: 14 },
]

/** "Retardo · llegó 25 min tarde", "Falta justificada: Incapacidad"... */
function textoDelEstado(d: DiaCalendario) {
    const etiqueta = ESTADOS[d.estado].etiqueta
    const justificacion = d.registros.find((r) => r.Justificacion)?.Justificacion
    if (justificacion) return `${etiqueta}: ${justificacion}`
    if (d.retardo && d.entrada) return `${etiqueta} · llegó ${formatDuracion(d.minutosTarde)} tarde`
    return etiqueta
}

/** "septiembre 2026" */
export function nombreMes(mes: Date) {
    return format(mes, 'LLLL yyyy', { locale: es })
}

/** Nombre de archivo seguro: sin acentos ni espacios. */
export function nombreDeArchivo(...partes: string[]) {
    return partes
        .join('-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
}

/**
 * Arma el reporte del mes con el calendario (mismas reglas que en pantalla: retardos, faltas y horas extra).
 * Un bloque por empleado (orden alfabético) con sus días en orden, sin los descansos, y un resumen.
 */
export function armarReporte(calendario: EmpleadoCalendario[], mes: Date, titulo: string): ReporteMes {
    const empleados = calendario.map((e) => {
        const dias = e.dias.filter((d) => d.estado !== 'descanso' || d.checadas.length > 0)
        const resumen: Resumen = {
            dias: dias.length,
            asistencias: e.totales.asistencias,
            retardos: e.totales.retardos,
            faltas: e.totales.faltas,
            horasExtra: formatDuracion(e.totales.minutosExtra),
        }

        return {
            nombre: e.Nombre,
            area: e.Area?.trim() ?? '',
            resumen,
            dias: dias.map((d) => {
                const horas = horasDelDia(d)
                return {
                    // "lun 01/09" para ubicar rápido el día de la semana.
                    fecha: format(fechaDesdeClave(d.fecha), 'EEE dd/MM', { locale: es }),
                    entrada: formatHora(horas.entrada),
                    inicioComida: formatHora(horas.inicioComida),
                    finComida: formatHora(horas.finComida),
                    salida: formatHora(horas.salida),
                    horasExtra: d.minutosExtra > 0 ? formatDuracion(d.minutosExtra) : '—',
                    motivo: textoDelEstado(d),
                }
            }),
        }
    })

    empleados.sort((a, b) => a.nombre.localeCompare(b.nombre))
    return { mes, titulo, empleados }
}

export function tieneRegistros(reporte: ReporteMes) {
    return reporte.empleados.some((e) => e.dias.length > 0)
}

/** "1 falta" / "2 faltas" */
function contar(n: number, singular: string, plural: string) {
    return `${n} ${n === 1 ? singular : plural}`
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombreArchivo
    enlace.click()
    URL.revokeObjectURL(url)
}

/** CSV plano (una fila por día), pensado para importar en otros sistemas. */
export function descargarCSV(reporte: ReporteMes, nombreArchivo: string) {
    const escapar = (valor: string) => (/[",\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor)
    const lineas = [['Empleado', 'Área', ...COLUMNAS_DIA.map((c) => c.titulo)].join(',')]
    for (const e of reporte.empleados) {
        for (const d of e.dias) {
            lineas.push([e.nombre, e.area, ...COLUMNAS_DIA.map((c) => d[c.campo])].map(escapar).join(','))
        }
    }
    // El BOM hace que Excel abra el CSV como UTF-8 y respete acentos y ñ.
    descargarBlob(new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${nombreArchivo}.csv`)
}

/** Excel con dos hojas: "Resumen" (una fila por empleado) y "Detalle" (una fila por día). */
export async function descargarExcel(reporte: ReporteMes, nombreArchivo: string) {
    const { default: writeXlsxFile } = await import('write-excel-file/browser')
    const negrita = (value: string) => ({ value, fontWeight: 'bold' as const })

    const resumen = [
        COLUMNAS_RESUMEN.map((c) => negrita(c.titulo)),
        ...reporte.empleados.map((e) => COLUMNAS_RESUMEN.map((c) => ({ value: c.valor(e) }))),
    ]
    const detalle = [
        [negrita('Empleado'), negrita('Área'), ...COLUMNAS_DIA.map((c) => negrita(c.titulo))],
        ...reporte.empleados.flatMap((e) =>
            e.dias.map((d) => [{ value: e.nombre }, { value: e.area }, ...COLUMNAS_DIA.map((c) => ({ value: d[c.campo] }))]),
        ),
    ]

    await writeXlsxFile([
        { sheet: 'Resumen', data: resumen, columns: COLUMNAS_RESUMEN.map((c) => ({ width: c.ancho })), stickyRowsCount: 1 },
        {
            sheet: 'Detalle',
            data: detalle,
            columns: [{ width: 28 }, { width: 18 }, ...COLUMNAS_DIA.map((c) => ({ width: c.ancho }))],
            stickyRowsCount: 1,
        },
    ]).toFile(`${nombreArchivo}.xlsx`)
}

/** PDF con un resumen general (si hay más de un empleado) y después una sección por empleado. */
export async function descargarPDF(reporte: ReporteMes, nombreArchivo: string) {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

    const doc = new jsPDF()
    const margen = 14
    const altoPagina = doc.internal.pageSize.getHeight()
    const finTabla = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
    const estiloTabla = {
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [38, 38, 38] as [number, number, number] },
        alternateRowStyles: { fillColor: [245, 245, 245] as [number, number, number] },
        margin: { left: margen, right: margen },
    }

    doc.setFontSize(16)
    doc.text(reporte.titulo, margen, 18)
    doc.setFontSize(10)
    doc.setTextColor(110)
    const mes = nombreMes(reporte.mes)
    doc.text(`Mes: ${mes.charAt(0).toUpperCase() + mes.slice(1)}`, margen, 25)
    doc.text(`Generado el ${new Date().toLocaleString('es-MX')}`, margen, 30)
    doc.setTextColor(0)
    let y = 38

    if (reporte.empleados.length > 1) {
        doc.setFontSize(12)
        doc.text('Resumen del mes', margen, y)
        autoTable(doc, {
            ...estiloTabla,
            startY: y + 3,
            head: [COLUMNAS_RESUMEN.map((c) => c.titulo)],
            body: reporte.empleados.map((e) => COLUMNAS_RESUMEN.map((c) => c.valor(e))),
        })
        y = finTabla() + 12
    }

    for (const e of reporte.empleados) {
        // Si el encabezado de la sección no alcanza a entrar con al menos un par de filas, empieza en otra página.
        if (y > altoPagina - 40) {
            doc.addPage()
            y = 18
        }

        doc.setFontSize(12)
        doc.text(`${e.nombre} · ${e.area}`, margen, y)
        doc.setFontSize(9)
        doc.setTextColor(110)
        const r = e.resumen
        doc.text(
            [
                contar(r.dias, 'día', 'días'),
                contar(r.asistencias, 'asistencia', 'asistencias'),
                contar(r.retardos, 'retardo', 'retardos'),
                contar(r.faltas, 'falta', 'faltas'),
                `${r.horasExtra} extra`,
            ].join(' · '),
            margen,
            y + 5,
        )
        doc.setTextColor(0)

        if (e.dias.length === 0) {
            doc.setFontSize(9)
            doc.setTextColor(150)
            doc.text('Sin registros en este mes.', margen, y + 12)
            doc.setTextColor(0)
            y += 22
            continue
        }

        autoTable(doc, {
            ...estiloTabla,
            startY: y + 8,
            head: [COLUMNAS_DIA.map((c) => c.titulo)],
            body: e.dias.map((d) => COLUMNAS_DIA.map((c) => d[c.campo])),
        })
        y = finTabla() + 12
    }

    doc.save(`${nombreArchivo}.pdf`)
}
