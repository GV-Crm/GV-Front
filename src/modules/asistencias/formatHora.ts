import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DiaCalendario, PeriodoVacaciones } from './types'

/** Solicitud de vacaciones que incluye un día futuro, si hay: vacaciones programadas. */
export function vacacionProgramada(vacaciones: PeriodoVacaciones[], fecha: string, hoy: string) {
  if (fecha <= hoy) return null
  return vacaciones.find((p) => p.Fechas.includes(fecha)) ?? null
}

/** Días laborables (lunes a sábado) entre dos fechas `YYYY-MM-DD`, incluidas. */
const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/
/** Tope para no congelar la pantalla con un rango absurdo (p. ej. mientras se escribe el año a mano). */
const MAX_DIAS_RANGO = 3660

export function diasLaborablesEntre(desde: string, hasta: string): string[] {
  const dias: string[] = []
  if (!FECHA_VALIDA.test(desde) || !FECHA_VALIDA.test(hasta) || desde > hasta) return dias
  let vueltas = 0
  for (let dia = fechaDesdeClave(desde); claveFecha(dia) <= hasta && vueltas < MAX_DIAS_RANGO; dia.setDate(dia.getDate() + 1)) {
    vueltas++
    if (dia.getDay() !== 0) dias.push(claveFecha(dia))
  }
  return dias
}

const MAX_FECHAS_EN_TEXTO = 6

/**
 * Las fechas de una solicitud de vacaciones en palabras:
 * - Seguidas (sin huecos, salvo domingos): "del 21 al 27 de oct".
 * - Salteadas: "lun 21, jue 24 y lun 28 de oct"; si son muchas, "8 días salteados entre el 3 y el 28 de oct".
 */
export function describirFechas(fechas: string[]): string {
  if (fechas.length === 0) return ''
  const primera = fechaDesdeClave(fechas[0])
  const ultima = fechaDesdeClave(fechas[fechas.length - 1])
  const diaMes = (d: Date) => format(d, "d 'de' MMM", { locale: es })
  if (fechas.length === 1) return format(primera, "EEEE d 'de' MMMM", { locale: es })

  const seguidas = diasLaborablesEntre(fechas[0], fechas[fechas.length - 1]).length === fechas.length
  if (seguidas) return `del ${format(primera, 'd', { locale: es })}${primera.getMonth() === ultima.getMonth() ? '' : ` de ${format(primera, 'MMM', { locale: es })}`} al ${diaMes(ultima)}`

  if (fechas.length > MAX_FECHAS_EN_TEXTO) return `${fechas.length} días salteados entre el ${diaMes(primera)} y el ${diaMes(ultima)}`
  const nombres = fechas.map((f) => format(fechaDesdeClave(f), "EEE d 'de' MMM", { locale: es }))
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

export function formatHora(timestamp: string | null) {
  if (!timestamp) return '—'

  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** `YYYY-MM-DD` como fecha local (con `new Date('YYYY-MM-DD')` sería medianoche UTC: el día anterior en México). */
export function fechaDesdeClave(clave: string) {
  const [anio, mes, dia] = clave.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

export function claveFecha(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

/** Día al que pertenece un registro: por su hora, o por `Fecha` si es una falta guardada. */
export function fechaDeRegistro(r: { HoraEntrada: string | null; HoraSalida: string | null; Fecha: string | null }) {
  const hora = r.HoraEntrada ?? r.HoraSalida
  if (hora) return new Date(hora)
  return r.Fecha ? fechaDesdeClave(r.Fecha) : null
}

/**
 * Horas del día. Entrada y salida las calcula el backend (incluyen las marcas del checador y no cuentan el
 * tiempo extra); la comida sale de los registros capturados.
 */
export function horasDelDia(dia: DiaCalendario | undefined) {
  const primera = (campo: 'InicioComida' | 'FinComida') => dia?.registros.find((r) => r[campo])?.[campo] ?? null
  return {
    entrada: dia?.entrada ?? null,
    inicioComida: primera('InicioComida'),
    finComida: primera('FinComida'),
    salida: dia?.salida ?? null,
  }
}

/**
 * Tiempo trabajado de un día, en minutos. null si no tiene entrada y salida.
 * - jornada: de la entrada a la salida normal, sin la comida.
 * - comida: entre las dos primeras checadas que hay entre la entrada y la salida (salió a comer y regresó).
 * - extra: el tiempo extra que calculó el backend. total = jornada + extra.
 */
export function minutosTrabajados(dia: DiaCalendario) {
  if (!dia.entrada || !dia.salida) return null
  const entrada = Date.parse(dia.entrada)
  const salida = Date.parse(dia.salida)
  if (!(salida > entrada)) return null
  const intermedias = dia.checadas.map(Date.parse).filter((ms) => ms > entrada && ms < salida)
  const comida = intermedias.length >= 2 ? Math.floor((intermedias[1] - intermedias[0]) / 60_000) : 0
  const jornada = Math.floor((salida - entrada) / 60_000) - comida
  return { jornada, comida, extra: dia.minutosExtra, total: jornada + dia.minutosExtra }
}

/** "8:30" (horas:minutos) para tablas y totales. */
export function formatHorasMinutos(minutos: number) {
  return `${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, '0')}`
}

/** "1 h 45 min", "2 h", "35 min", "0 min" */
export function formatDuracion(minutos: number) {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas === 0) return `${resto} min`
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}

export function formatFecha(timestamp: string | null) {
  if (!timestamp) return '—'

  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
