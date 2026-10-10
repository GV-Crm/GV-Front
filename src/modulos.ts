import type { ComponentType } from 'react'
import { useLocation } from 'react-router-dom'
import { useAbility } from '@casl/react'
import { CalendarCheck, Package, ScanFaceIcon, ShieldCheckIcon, UserCogIcon, UserRoundIcon, type LucideIcon } from 'lucide-react'
import type { Accion, AppAbility, Recurso } from '@/auth/permisos'
import AsistenciasModulo from '@/modules/asistencias/AsistenciasModulo'
import ChecadorPage from '@/modules/checador/ChecadorPage'
import InventarioPage from '@/modules/inventario/InventarioPage'
import PerfilPage from '@/modules/perfil/PerfilPage'
import PermisosPage from '@/modules/permisos/PermisosPage'
import TrabajadoresPage from '@/modules/trabajadores/TrabajadoresPage'

/*
 * Lista de módulos del sistema.
 * Un módulo aparece en el menú, y su ruta existe, solo si el usuario tiene su permiso
 * (los que no tienen `permiso`, como Mi perfil, los ve todo el mundo).
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
  /**
   * Lo que se necesita para verlo. Sin permiso = lo ve cualquier usuario con sesión.
   * Si es una lista, basta con tener UNO de esos permisos.
   */
  permiso?: Permiso | Permiso[]
}

type Permiso = { accion: Accion; recurso: Recurso }

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
    // Entra quien da de alta/baja o quien solo edita perfiles.
    permiso: [
      { accion: 'gestionar', recurso: 'Empleado' },
      { accion: 'editar', recurso: 'Empleado' },
    ],
  },
  {
    nombre: 'Permisos',
    ruta: '/permisos',
    icono: ShieldCheckIcon,
    pagina: PermisosPage,
    permiso: { accion: 'gestionar', recurso: 'Permiso' },
  },
  {
    nombre: 'Checador',
    ruta: '/checador',
    icono: ScanFaceIcon,
    pagina: ChecadorPage,
    permiso: { accion: 'gestionar', recurso: 'Checador' },
  },
  {
    nombre: 'Inventario',
    ruta: '/inventario',
    icono: Package,
    pagina: InventarioPage,
    permiso: { accion: 'ver', recurso: 'Inventario' },
  },
  {
    nombre: 'Mi perfil',
    ruta: '/perfil',
    icono: UserRoundIcon,
    pagina: PerfilPage,
  },
]

/** Los módulos que el usuario actual puede abrir. */
export function useModulosPermitidos(): Modulo[] {
  const ability = useAbility<AppAbility>()
  return MODULOS.filter((modulo) => {
    if (!modulo.permiso) return true
    const permisos = Array.isArray(modulo.permiso) ? modulo.permiso : [modulo.permiso]
    return permisos.some((p) => ability.can(p.accion, p.recurso))
  })
}

/** El módulo en el que está el usuario ahora, según la dirección de la página. */
export function useModuloActual(): Modulo | undefined {
  const { pathname } = useLocation()
  return MODULOS.find((modulo) => pathname.startsWith(modulo.ruta))
}
