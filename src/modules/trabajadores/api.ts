import { pedirJson } from '@/lib/api'
import type { Empleado } from '@/modules/asistencias/types'

export type NuevoTrabajador = { Nombre: string; Area: string; Ingreso: string }

export type ContactoEmergencia = { Nombre: string; Parentesco: string; Telefono: string }

/** Datos sensibles: solo los ve quien tiene el permiso "gestionar DatosPersonales". Los vacíos llegan como null. */
export type DatosPersonales = {
  FechaNacimiento: string | null
  Celular: string | null
  Correo: string | null
  CURP: string | null
  RFC: string | null
  NSS: string | null
  Domicilio: string | null
  ContactosEmergencia: ContactoEmergencia[]
  /** En pesos. Con él se calcula la prima vacacional. */
  SalarioDiario: number | null
}

export type DatosPersonalesGuardados = DatosPersonales & { ActualizadoEn: string | null; ActualizadoPor: string | null }

/**
 * Requiere el permiso "gestionar Empleado". `DatosPersonales` es opcional y requiere además
 * "gestionar DatosPersonales". El sistema le asigna su ID de checador (`PinChecador`).
 */
export function crearTrabajador(datos: NuevoTrabajador & { DatosPersonales?: DatosPersonales }): Promise<Empleado> {
  return pedirJson('/api/empleados', { method: 'POST', body: datos })
}

/** Requiere el permiso "gestionar DatosPersonales". */
export function getDatosPersonales(uuid: string): Promise<DatosPersonalesGuardados> {
  return pedirJson(`/api/empleados/${uuid}/datos-personales`)
}

/** Reemplaza todos los datos personales. Si la CURP, RFC o NSS ya es de otro trabajador, responde con error. */
export function guardarDatosPersonales(uuid: string, datos: DatosPersonales): Promise<DatosPersonalesGuardados> {
  return pedirJson(`/api/empleados/${uuid}/datos-personales`, { method: 'PUT', body: datos })
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
