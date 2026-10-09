import { pedirJson } from '@/lib/api'
import type { Accion, Recurso } from '@/auth/permisos'

export type PermisoDelCatalogo = { accion: Accion; recurso: Recurso; modulo: string; descripcion: string }
export type Permiso = { accion: Accion; recurso: Recurso }

/** `bloqueado` trae el motivo si el usuario no puede editar ese rol (p. ej. es su propio rol). */
export type RolConPermisos = { rol: string; permisos: Permiso[]; bloqueado: string | null }

export type Cuenta = { id: number; Nombre: string | null; Correo: string; Rol: string; bloqueado: string | null }

export function getPermisos(): Promise<{ catalogo: PermisoDelCatalogo[]; roles: RolConPermisos[] }> {
  return pedirJson('/api/permisos')
}

export function guardarPermisosDeRol(rol: string, permisos: Permiso[]): Promise<unknown> {
  return pedirJson('/api/permisos', { method: 'PUT', body: { rol, permisos } })
}

export function getCuentas(): Promise<{ cuentas: Cuenta[]; rolesAsignables: string[] }> {
  return pedirJson('/api/cuentas')
}

export function crearCuenta(datos: { Nombre: string; Correo: string; Rol: string }): Promise<Cuenta> {
  return pedirJson('/api/cuentas', { method: 'POST', body: datos })
}

export function cambiarRolDeCuenta(id: number, rol: string): Promise<Cuenta> {
  return pedirJson(`/api/cuentas/${id}`, { method: 'PATCH', body: { Rol: rol } })
}
