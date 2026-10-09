import type { ComponentType } from 'react'
import { useAbility } from '@casl/react'
import { CalendarCheck, Package, ShieldCheckIcon, UserCogIcon, type LucideIcon } from 'lucide-react'
import type { Accion, AppAbility, Recurso } from '@/auth/permisos'
import AsistenciasModulo from '@/modules/asistencias/AsistenciasModulo'
import InventarioPage from '@/modules/inventario/InventarioPage'
import PermisosPage from '@/modules/permisos/PermisosPage'
import TrabajadoresPage from '@/modules/trabajadores/TrabajadoresPage'

/*
 * Lista de módulos del sistema.
 * Un módulo aparece en el menú, y su ruta existe, solo si el usuario tiene su permiso.
 *
 * Para agregar un módulo nuevo:
 *   1. Crea su carpeta en src/modules/ con su página.
 *   2. Agrégalo a esta lista con el permiso que necesita.
 */

export type Modulo = {
  /** Texto en el menú. */
  nombre: string
  /** Dirección base, p. ej. '/asistencias'. Las sub-rutas las maneja la página del módulo. */
  ruta: string
  icono: LucideIcon
  pagina: ComponentType
  permiso: { accion: Accion; recurso: Recurso }
}

export const MODULOS: Modulo[] = [
  {
    nombre: 'Asistencias',
    ruta: '/asistencias',
    icono: CalendarCheck,
    pagina: AsistenciasModulo,
    permiso: { accion: 'ver', recurso: 'Asistencia' },
  },
  {
    nombre: 'Trabajadores',
    ruta: '/trabajadores',
    icono: UserCogIcon,
    pagina: TrabajadoresPage,
    permiso: { accion: 'gestionar', recurso: 'Empleado' },
  },
  {
    nombre: 'Permisos',
    ruta: '/permisos',
    icono: ShieldCheckIcon,
    pagina: PermisosPage,
    permiso: { accion: 'gestionar', recurso: 'Permiso' },
  },
  {
    nombre: 'Inventario',
    ruta: '/inventario',
    icono: Package,
    pagina: InventarioPage,
    permiso: { accion: 'ver', recurso: 'Inventario' },
  },
]

/** Los módulos que el usuario actual puede abrir. */
export function useModulosPermitidos(): Modulo[] {
  const ability = useAbility<AppAbility>()
  return MODULOS.filter((modulo) => ability.can(modulo.permiso.accion, modulo.permiso.recurso))
}
