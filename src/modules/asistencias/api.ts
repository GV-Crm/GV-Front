import { pedirJson } from '@/lib/api'
import type { Asistencia, Calendario, Empleado, EmpleadoDetalle } from './types'

export function getAsistencias(): Promise<Asistencia[]> {
  return pedirJson('/api/asistencias')
}

export function getEmpleados(): Promise<Empleado[]> {
  return pedirJson('/api/empleados')
}

export function getDetalles(uuid: string): Promise<EmpleadoDetalle> {
  return pedirJson(`/api/empleados/${uuid}`)
}

/** Estado de cada día (máx. 31). Sin `desde` el backend usa hoy; los días futuros no se devuelven. */
export function getCalendario(filtro: { desde?: string; hasta?: string; uuid?: string } = {}): Promise<Calendario> {
  const params = new URLSearchParams(Object.entries(filtro).filter((par): par is [string, string] => Boolean(par[1])))
  return pedirJson(`/api/calendario?${params}`)
}

/** Requiere el permiso "justificar Falta". Para justificar, `motivo` es obligatorio. */
export function justificarFalta(uuid: string, fecha: string, justificada: boolean, motivo?: string): Promise<unknown> {
  return pedirJson('/api/faltas/justificar', { method: 'POST', body: { uuid, fecha, justificada, motivo } })
}
