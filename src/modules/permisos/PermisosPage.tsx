import { useState } from 'react'
import { ArrowRightIcon, CircleHelpIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react'
import { cn } from 'cn'
import CuentasLista from './CuentasLista'
import PermisosPorRol from './PermisosPorRol'
import Desplegable from '@/components/Desplegable'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import Segmentos from '@/components/Segmentos'
import { COLOR_SECCION } from '@/lib/colores-seccion'

const VISTAS = [
  { id: 'roles', nombre: 'Roles y permisos', icono: ShieldCheckIcon },
  { id: 'cuentas', nombre: 'Cuentas', icono: UsersIcon },
] as const

type Vista = (typeof VISTAS)[number]['id']

/** Explicación en tres pasos de cómo se relacionan cuentas, roles y permisos. */
function ComoFunciona() {
  const pasos = [
    { titulo: 'Cuenta', texto: 'La persona que inicia sesión (su correo).' },
    { titulo: 'Rol', texto: 'Cada cuenta tiene un rol, p. ej. "Legal".' },
    { titulo: 'Permisos', texto: 'El rol decide qué puede ver y hacer.' },
  ]
  return (
    <div className="space-y-3 text-sm">
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {pasos.map((paso, i) => (
          <li key={paso.titulo} className="flex items-center gap-2 sm:flex-1">
            <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', COLOR_SECCION.control.suave)}>
              {i + 1}
            </span>
            <span>
              <span className="font-medium">{paso.titulo}:</span> <span className="text-muted-foreground">{paso.texto}</span>
            </span>
            {i < pasos.length - 1 && <ArrowRightIcon className="hidden size-4 shrink-0 text-muted-foreground sm:block" />}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Por seguridad nadie puede cambiar su propio rol ni el rol Admin, que siempre tiene acceso total. Los cambios se
        aplican de inmediato.
      </p>
    </div>
  )
}

/** Módulo Permisos: requiere el permiso "gestionar Permiso" (Admin y Admin Legal). */
function PermisosPage() {
  const [vista, setVista] = useState<Vista>('roles')

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        icono={ShieldCheckIcon}
        titulo="Permisos"
      />

      <Desplegable titulo="¿Cómo funciona?" icono={CircleHelpIcon} resumen="Cuenta → Rol → Permisos">
        <ComoFunciona />
      </Desplegable>

      <Segmentos etiqueta="Sección" opciones={VISTAS} valor={vista} onCambio={setVista} className="w-full sm:w-fit" />

      {vista === 'roles' ? <PermisosPorRol /> : <CuentasLista />}
    </div>
  )
}

export default PermisosPage
