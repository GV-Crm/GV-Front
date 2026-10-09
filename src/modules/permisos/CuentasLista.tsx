import { useEffect, useState } from 'react'
import { CheckIcon, KeyRoundIcon, Loader2Icon, LockIcon } from 'lucide-react'
import { cn } from 'cn'
import { cambiarRolDeCuenta, getCuentas, type Cuenta } from './api'
import { CLASES_SELECT } from './estilos'
import NuevaCuenta from './NuevaCuenta'
import Avatar from '@/components/Avatar'
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
          <KeyRoundIcon className="size-4 text-violet-500" />
          {cuentas.length} cuentas con acceso
        </p>
        <NuevaCuenta roles={roles} onCreada={(nueva) => setCuentas((lista) => [...lista!, nueva])} />
      </div>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
        {cuentas.map((cuenta, i) => (
          <li
            key={cuenta.id}
            style={retrasoEscalonado(i)}
            className={cn('flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:px-4', ENTRADA)}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar nombre={cuenta.Nombre ?? cuenta.Correo} />
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
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CuentasLista
