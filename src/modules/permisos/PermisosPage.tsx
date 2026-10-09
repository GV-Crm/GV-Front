import { useState } from 'react'
import { ShieldCheckIcon, UsersIcon } from 'lucide-react'
import CuentasLista from './CuentasLista'
import PermisosPorRol from './PermisosPorRol'
import Segmentos from '@/components/Segmentos'

const VISTAS = [
  { id: 'roles', nombre: 'Roles y permisos', icono: ShieldCheckIcon },
  { id: 'cuentas', nombre: 'Cuentas', icono: UsersIcon },
] as const

type Vista = (typeof VISTAS)[number]['id']

/** Módulo Permisos: requiere el permiso "gestionar Permiso" (Admin y Admin Legal). */
function PermisosPage() {
  const [vista, setVista] = useState<Vista>('roles')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Permisos</h1>
        <p className="text-sm text-muted-foreground">Decide qué puede ver y hacer cada rol, y qué rol tiene cada cuenta.</p>
      </div>

      <Segmentos etiqueta="Sección" opciones={VISTAS} valor={vista} onCambio={setVista} />

      {vista === 'roles' ? <PermisosPorRol /> : <CuentasLista />}
    </div>
  )
}

export default PermisosPage
