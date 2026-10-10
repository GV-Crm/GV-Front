import { pedirJson } from '@/lib/api'
import type { Empleado } from '@/modules/asistencias/types'

export type NuevoTrabajador = { Nombre: string; Area: string; Ingreso: string }

/** Requiere el permiso "gestionar Empleado". */
export function crearTrabajador(datos: NuevoTrabajador): Promise<Empleado> {
  return pedirJson('/api/empleados', { method: 'POST', body: datos })
}

/** `false` = dar de baja, `true` = reactivar. Requiere el permiso "gestionar Empleado". */
export function cambiarActivo(uuid: string, activo: boolean): Promise<Empleado> {
  return pedirJson(`/api/empleados/${uuid}`, { method: 'PATCH', body: { Activo: activo } })
}

/** Cambia nombre, área y fecha de ingreso. Requiere el permiso "editar Empleado". */
export function editarTrabajador(uuid: string, datos: NuevoTrabajador): Promise<Empleado> {
  return pedirJson(`/api/empleados/${uuid}/perfil`, { method: 'PATCH', body: datos })
}

/** Cambia la foto. `imagen` viene de prepararFotoDePerfil (src/lib/imagen.ts). Requiere "editar Empleado". */
export function subirFotoTrabajador(uuid: string, imagen: string): Promise<{ Foto: string }> {
  return pedirJson(`/api/empleados/${uuid}/foto`, { method: 'POST', body: { imagen } })
}

/** Quita la foto (vuelven a verse las iniciales). Requiere "editar Empleado". */
export function quitarFotoTrabajador(uuid: string): Promise<{ Foto: null }> {
  return pedirJson(`/api/empleados/${uuid}/foto`, { method: 'DELETE' })
}
