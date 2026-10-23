import { pedirJson } from '@/lib/api'
import type { Asistencia, Calendario, Empleado, EmpleadoDetalle, PeriodoVacaciones, Vacaciones } from './types'

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

/** Vacaciones y prima vacacional según su antigüedad. Los montos en pesos requieren "gestionar DatosPersonales". */
export function getVacaciones(uuid: string): Promise<Vacaciones> {
  return pedirJson(`/api/empleados/${uuid}/vacaciones`)
}

/**
 * Registra una solicitud de vacaciones con sus días exactos (YYYY-MM-DD; pueden ser salteados, sin domingos).
 * Requiere "gestionar Vacaciones".
 */
export function registrarVacaciones(uuid: string, fechas: string[], nota?: string): Promise<PeriodoVacaciones> {
  return pedirJson('/api/vacaciones', { method: 'POST', body: { uuid, fechas, nota } })
}

/** Quita un periodo de vacaciones. Requiere "gestionar Vacaciones". */
export function quitarVacaciones(id: number): Promise<unknown> {
  return pedirJson(`/api/vacaciones/${id}`, { method: 'DELETE' })
}

/**
 * Da permiso para salir antes: abre 10 minutos para que cheque su salida. Solo hoy, si ya llegó.
 * Requiere "autorizar Salida".
 */
export function darPermisoSalida(uuid: string, motivo?: string): Promise<{ id: number; VenceEn: string }> {
  return pedirJson('/api/permisos-salida', { method: 'POST', body: { uuid, motivo } })
}

/** Cancela un permiso de salida que todavía no se usa. Requiere "autorizar Salida". */
export function cancelarPermisoSalida(id: number): Promise<unknown> {
  return pedirJson(`/api/permisos-salida/${id}`, { method: 'DELETE' })
}

/** Requiere el permiso "justificar Falta". Para justificar, `motivo` es obligatorio. */
export function justificarFalta(uuid: string, fecha: string, justificada: boolean, motivo?: string): Promise<unknown> {
  return pedirJson('/api/faltas/justificar', { method: 'POST', body: { uuid, fecha, justificada, motivo } })
}
