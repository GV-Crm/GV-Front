import { pedirJson } from '@/lib/api'
import type { Accion, Recurso } from '@/auth/permisos'

export type PermisoDelCatalogo = { accion: Accion; recurso: Recurso; modulo: string; descripcion: string }
export type Permiso = { accion: Accion; recurso: Recurso }

/** `bloqueado` trae el motivo si el usuario no puede editar ese rol (p. ej. es su propio rol). */
export type RolConPermisos = { rol: string; permisos: Permiso[]; bloqueado: string | null }

/**
 * `Avatar` es la URL de su foto de perfil (o null si usa sus iniciales).
 * `bloqueado` / `contrasenaBloqueada`: por qué no se le puede cambiar el rol / la contraseña (null = sí se puede).
 */
export type Cuenta = {
  id: number
  Nombre: string | null
  Correo: string
  Rol: string
  Avatar: string | null
  bloqueado: string | null
  contrasenaBloqueada: string | null
}

/** Mínimo de caracteres de una contraseña (igual que en el backend). */
export const MIN_CONTRASENA = 8

export function getPermisos(): Promise<{ catalogo: PermisoDelCatalogo[]; roles: RolConPermisos[] }> {
  return pedirJson('/api/permisos')
}

export function guardarPermisosDeRol(rol: string, permisos: Permiso[]): Promise<unknown> {
  return pedirJson('/api/permisos', { method: 'PUT', body: { rol, permisos } })
}

export function getCuentas(): Promise<{ cuentas: Cuenta[]; rolesAsignables: string[] }> {
  return pedirJson('/api/cuentas')
}

/** Crea la cuenta y su usuario de inicio de sesión con `Contrasena` (si el correo ya tenía usuario, conserva la suya). */
export function crearCuenta(datos: {
  Nombre: string
  Correo: string
  Rol: string
  Contrasena: string
}): Promise<Cuenta & { usaContrasenaExistente: boolean }> {
  return pedirJson('/api/cuentas', { method: 'POST', body: datos })
}

/** Requiere "cambiar Contrasena". */
export function cambiarContrasena(id: number, contrasena: string): Promise<{ ok: true; usuarioCreado: boolean }> {
  return pedirJson(`/api/cuentas/${id}/contrasena`, { method: 'POST', body: { Contrasena: contrasena } })
}

export function cambiarRolDeCuenta(id: number, rol: string): Promise<Cuenta> {
  return pedirJson(`/api/cuentas/${id}`, { method: 'PATCH', body: { Rol: rol } })
}
