import type { DiaCalendario } from './types'

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

/** Horas del día; si hay varios registros, toma la primera que exista de cada una. */
export function horasDelDia(dia: DiaCalendario | undefined) {
  const primera = (campo: 'HoraEntrada' | 'InicioComida' | 'FinComida' | 'HoraSalida') =>
    dia?.registros.find((r) => r[campo])?.[campo] ?? null
  return {
    entrada: primera('HoraEntrada'),
    inicioComida: primera('InicioComida'),
    finComida: primera('FinComida'),
    salida: primera('HoraSalida'),
  }
}

export function formatFecha(timestamp: string | null) {
  if (!timestamp) return '—'

  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
