import { createMongoAbility, type MongoAbility } from '@casl/ability'
import { useAbility } from '@casl/react'

/*
 * Permisos con CASL.
 *
 * Un permiso es una ACCIÓN sobre un RECURSO, por ejemplo: "justificar" + "Falta".
 * El backend decide qué puede hacer cada rol y lo manda en /api/yo como `reglas`;
 * aquí solo se usan para mostrar u ocultar pantallas y botones.
 *
 * Si agregas un permiso, agrégalo también en el backend (gv-one: src/lib/permisos/catalogo.ts).
 */

export type Accion = 'ver' | 'justificar' | 'gestionar'
export type Recurso = 'Asistencia' | 'Falta' | 'Empleado' | 'Permiso' | 'Inventario'

/** 'manage' y 'all' son palabras especiales de CASL: "cualquier acción" y "cualquier recurso" (rol Admin). */
export type AppAbility = MongoAbility<[Accion | 'manage', Recurso | 'all']>

export type Regla = { action: Accion | 'manage'; subject: Recurso | 'all' }

export function crearAbility(reglas: Regla[]): AppAbility {
  return createMongoAbility<AppAbility>(reglas)
}

/**
 * ¿El usuario puede hacer esta acción? Ejemplo:
 *
 *   const puedeJustificar = usePuede('justificar', 'Falta')
 */
export function usePuede(accion: Accion, recurso: Recurso): boolean {
  return useAbility<AppAbility>().can(accion, recurso)
}
