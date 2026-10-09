import { pedirJson } from '@/lib/api'
import type { Empleado } from '@/modules/asistencias/types'

export type NuevoTrabajador = { Nombre: string; Area: string; Ingreso: string }

/** Requiere el permiso `gestionar_empleados`. */
export function crearTrabajador(datos: NuevoTrabajador): Promise<Empleado> {
  return pedirJson('/api/empleados', { method: 'POST', body: datos })
}

/** `false` = dar de baja, `true` = reactivar. Requiere el permiso `gestionar_empleados`. */
export function cambiarActivo(uuid: string, activo: boolean): Promise<Empleado> {
  return pedirJson(`/api/empleados/${uuid}`, { method: 'PATCH', body: { Activo: activo } })
}
