import type { ComponentType } from 'react'
import { useLocation } from 'react-router-dom'
import { useAbility } from '@casl/react'
import { CalendarCheck, Package, ScanFaceIcon, ShieldCheckIcon, UserCogIcon, type LucideIcon } from 'lucide-react'
import type { Accion, AppAbility, Recurso } from '@/auth/permisos'
import AsistenciasModulo from '@/modules/asistencias/AsistenciasModulo'
import ChecadorPage from '@/modules/checador/ChecadorPage'
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
  /** Frase corta que explica para qué sirve (se ve debajo del nombre en el menú). */
  descripcion: string
  /** Dirección base, p. ej. '/asistencias'. Las sub-rutas las maneja la página del módulo. */
  ruta: string
  icono: LucideIcon
  /** Clases de color del cuadro del ícono. */
  color: string
  pagina: ComponentType
  permiso: { accion: Accion; recurso: Recurso }
}

export const MODULOS: Modulo[] = [
  {
    nombre: 'Asistencias',
    descripcion: 'Quién vino, quién faltó',
    ruta: '/asistencias',
    icono: CalendarCheck,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
    pagina: AsistenciasModulo,
    permiso: { accion: 'ver', recurso: 'Asistencia' },
  },
  {
    nombre: 'Trabajadores',
    descripcion: 'Altas y bajas',
    ruta: '/trabajadores',
    icono: UserCogIcon,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
    pagina: TrabajadoresPage,
    permiso: { accion: 'gestionar', recurso: 'Empleado' },
  },
  {
    nombre: 'Permisos',
    descripcion: 'Roles y cuentas',
    ruta: '/permisos',
    icono: ShieldCheckIcon,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    pagina: PermisosPage,
    permiso: { accion: 'gestionar', recurso: 'Permiso' },
  },
  {
    nombre: 'Checador',
    descripcion: 'Conexión y marcas',
    ruta: '/checador',
    icono: ScanFaceIcon,
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    pagina: ChecadorPage,
    permiso: { accion: 'gestionar', recurso: 'Checador' },
  },
  {
    nombre: 'Inventario',
    descripcion: 'Próximamente',
    ruta: '/inventario',
    icono: Package,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    pagina: InventarioPage,
    permiso: { accion: 'ver', recurso: 'Inventario' },
  },
]

/** Los módulos que el usuario actual puede abrir. */
export function useModulosPermitidos(): Modulo[] {
  const ability = useAbility<AppAbility>()
  return MODULOS.filter((modulo) => ability.can(modulo.permiso.accion, modulo.permiso.recurso))
}

/** El módulo en el que está el usuario ahora, según la dirección de la página. */
export function useModuloActual(): Modulo | undefined {
  const { pathname } = useLocation()
  return MODULOS.find((modulo) => pathname.startsWith(modulo.ruta))
}
