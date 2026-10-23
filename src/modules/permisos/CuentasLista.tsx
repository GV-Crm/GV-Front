import { useEffect, useState } from 'react'
import { CheckIcon, CircleCheckIcon, KeyRoundIcon, Loader2Icon, LockIcon, XIcon } from 'lucide-react'
import { cn } from 'cn'
import { cambiarRolDeCuenta, getCuentas, type Cuenta } from './api'
import { CLASES_SELECT } from './estilos'
import CambiarContrasena from './CambiarContrasena'
import NuevaCuenta from './NuevaCuenta'
import { usePuede } from '@/auth/permisos'
import Avatar from '@/components/Avatar'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { Skeleton } from '@/components/ui/skeleton'

/** Selector del rol de una cuenta: guarda en cuanto se elige otro rol. */
function SelectorRol({ cuenta, roles, onCambio }: { cuenta: Cuenta; roles: string[]; onCambio: (c: Cuenta) => void }) {
  const [estado, setEstado] = useState<'normal' | 'guardando' | 'guardado'>('normal')
  const [error, setError] = useState<string | null>(null)

  async function cambiar(rolNuevo: string) {
    setEstado('guardando')
    setError(null)
    try {
      onCambio(await cambiarRolDeCuenta(cuenta.id, rolNuevo))
      setEstado('guardado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el rol')
      setEstado('normal')
    }
  }

  return (
    <div className="flex flex-col gap-1 sm:w-56">
      <div className="flex items-center gap-2">
        <select
          aria-label={`Rol de ${cuenta.Correo}`}
          className={CLASES_SELECT}
          value={cuenta.Rol}
          disabled={estado === 'guardando'}
          onChange={(e) => cambiar(e.target.value)}
        >
          {roles.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </select>
        {estado === 'guardando' && <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        {estado === 'guardado' && <CheckIcon className="size-4 shrink-0 text-emerald-600" />}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** Pantalla "Cuentas": quién tiene acceso al sistema y con qué rol. */
function CuentasLista() {
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  // Aviso tras crear una cuenta o cambiar una contraseña.
  const [aviso, setAviso] = useState<string | null>(null)
  const gestionaPermisos = usePuede('gestionar', 'Permiso')
  const cambiaContrasenas = usePuede('cambiar', 'Contrasena')

  useEffect(() => {
    getCuentas()
      .then((datos) => {
        setCuentas(datos.cuentas)
        setRoles(datos.rolesAsignables)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{error}</p>
  if (!cuentas) return <Skeleton className="h-64 rounded-xl" />

  const reemplazar = (actualizada: Cuenta) =>
    setCuentas((lista) => lista!.map((c) => (c.id === actualizada.id ? actualizada : c)))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <KeyRoundIcon className={cn('size-4', COLOR_SECCION.personas.texto)} />
          {cuentas.length} cuentas con acceso
        </p>
        {gestionaPermisos && (
          <NuevaCuenta
            roles={roles}
            onCreada={(nueva, usaContrasenaExistente) => {
              setCuentas((lista) => [...lista!, nueva])
              // Si se creó con un área nueva, ya se puede elegir en las demás cuentas.
              setRoles((lista) => (lista.includes(nueva.Rol) ? lista : [...lista, nueva.Rol]))
              setAviso(
                usaContrasenaExistente
                  ? `${nueva.Correo} ya tenía usuario para iniciar sesión: sigue entrando con su contraseña de antes.`
                  : `Listo: ${nueva.Correo} ya puede entrar con la contraseña inicial.`,
              )
            }}
          />
        )}
      </div>

      {aviso && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{aviso}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setAviso(null)} className="opacity-70 hover:opacity-100">
            <XIcon className="size-4" />
          </button>
        </p>
      )}

      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {cuentas.map((cuenta, i) => (
          <li
            key={cuenta.id}
            style={retrasoEscalonado(i)}
            className={cn('flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:px-4', ENTRADA)}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar nombre={cuenta.Nombre ?? cuenta.Correo} foto={cuenta.Avatar} className={COLOR_SECCION.personas.suave} />
              <div className="min-w-0">
                <p className="truncate font-medium">{cuenta.Nombre ?? 'Sin nombre'}</p>
                <p className="truncate text-xs text-muted-foreground">{cuenta.Correo}</p>
              </div>
            </div>

            {cuenta.bloqueado ? (
              // No se puede cambiar (es tu cuenta o una cuenta Admin): se muestra el rol y el motivo.
              <div className="text-sm sm:w-56">
                <p className="font-medium">{cuenta.Rol}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <LockIcon className="size-3" />
                  {cuenta.bloqueado}
                </p>
              </div>
            ) : (
              <SelectorRol cuenta={cuenta} roles={roles} onCambio={reemplazar} />
            )}

            {cambiaContrasenas && !cuenta.contrasenaBloqueada && <CambiarContrasena cuenta={cuenta} onCambiada={setAviso} />}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CuentasLista
