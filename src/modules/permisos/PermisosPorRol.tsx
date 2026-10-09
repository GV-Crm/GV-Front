import { useEffect, useState } from 'react'
import { CheckIcon, Loader2Icon, LockIcon, ShieldCheckIcon } from 'lucide-react'
import { cn } from 'cn'
import { getPermisos, guardarPermisosDeRol, type Permiso, type PermisoDelCatalogo, type RolConPermisos } from './api'
import { PERMISOS } from '@/auth/permisos'
import { ENTRADA } from '@/lib/animaciones'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** "ver:Asistencia" — para comparar permisos fácilmente. */
const clave = (p: Permiso) => `${p.accion}:${p.recurso}`

/** El mismo ícono que se usa en el menú de usuario para ese permiso. */
const iconoDe = (p: Permiso) => PERMISOS.find((x) => clave(x) === clave(p))?.icono ?? ShieldCheckIcon

/** Agrupa el catálogo por módulo: { Asistencias: [...], Trabajadores: [...] } */
function agruparPorModulo(catalogo: PermisoDelCatalogo[]) {
  const grupos: Record<string, PermisoDelCatalogo[]> = {}
  for (const permiso of catalogo) {
    grupos[permiso.modulo] = [...(grupos[permiso.modulo] ?? []), permiso]
  }
  return Object.entries(grupos)
}

/** Pantalla "Roles y permisos": a la izquierda se elige el rol, a la derecha se marcan sus permisos. */
function PermisosPorRol() {
  const [catalogo, setCatalogo] = useState<PermisoDelCatalogo[]>([])
  const [roles, setRoles] = useState<RolConPermisos[]>([])
  const [error, setError] = useState<string | null>(null)
  const [rolElegido, setRolElegido] = useState<string | null>(null)
  // Cambios sin guardar del rol elegido (lista de claves "accion:recurso").
  const [borrador, setBorrador] = useState<{ rol: string; claves: string[] } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    getPermisos()
      .then((datos) => {
        setCatalogo(datos.catalogo)
        setRoles(datos.roles)
        // Se abre el primer rol que sí se puede editar.
        setRolElegido((datos.roles.find((r) => !r.bloqueado) ?? datos.roles[0])?.rol ?? null)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{error}</p>
  if (!rolElegido) return <Skeleton className="h-80 rounded-xl" />

  const rol = roles.find((r) => r.rol === rolElegido)!
  const guardadas = rol.permisos.map(clave)
  const marcadas = borrador?.rol === rol.rol ? borrador.claves : guardadas
  const hayCambios = marcadas.length !== guardadas.length || marcadas.some((c) => !guardadas.includes(c))

  function elegirRol(nombre: string) {
    setRolElegido(nombre)
    setBorrador(null)
    setAviso(null)
  }

  function alternar(permiso: Permiso) {
    const c = clave(permiso)
    const nuevas = marcadas.includes(c) ? marcadas.filter((x) => x !== c) : [...marcadas, c]
    setBorrador({ rol: rol.rol, claves: nuevas })
    setAviso(null)
  }

  async function guardar() {
    const permisos = catalogo.filter((p) => marcadas.includes(clave(p))).map(({ accion, recurso }) => ({ accion, recurso }))
    setGuardando(true)
    setAviso(null)
    try {
      await guardarPermisosDeRol(rol.rol, permisos)
      setRoles((lista) => lista.map((r) => (r.rol === rol.rol ? { ...r, permisos } : r)))
      setBorrador(null)
      setAviso('Cambios guardados. Las personas con este rol los verán al volver a abrir la app.')
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'No se pudieron guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Lista de roles: en móvil es una fila que se desliza de lado. */}
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {roles.map((r) => (
          <button
            key={r.rol}
            type="button"
            onClick={() => elegirRol(r.rol)}
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              r.rol === rol.rol ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10' : 'bg-card hover:bg-muted',
            )}
          >
            <span>
              <span className="block font-medium">{r.rol}</span>
              <span className="block text-xs text-muted-foreground">
                {r.permisos.length} de {catalogo.length} permisos
              </span>
            </span>
            {r.bloqueado && <LockIcon className="size-3.5 text-muted-foreground" />}
          </button>
        ))}
      </nav>

      {/* La clave repite la animación de entrada al elegir otro rol. */}
      <section key={rol.rol} className={cn('rounded-xl border bg-card shadow-xs', ENTRADA)}>
        <header className="flex items-center gap-3 border-b p-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            <ShieldCheckIcon className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">{rol.rol}</h2>
            <p className="text-xs text-muted-foreground">Marca lo que pueden ver y hacer las cuentas con este rol.</p>
          </div>
        </header>

        {rol.bloqueado && (
          <p className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <LockIcon className="size-4 shrink-0" />
            {rol.bloqueado}
          </p>
        )}

        <div className="divide-y">
          {agruparPorModulo(catalogo).map(([modulo, permisos]) => (
            <fieldset key={modulo} className="space-y-1 p-4">
              <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{modulo}</legend>
              {permisos.map((permiso) => {
                const marcado = marcadas.includes(clave(permiso))
                const Icono = iconoDe(permiso)
                return (
                  <label
                    key={clave(permiso)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-2.5 text-sm transition-all duration-200',
                      marcado
                        ? 'border-indigo-200 bg-indigo-50/70 dark:border-indigo-500/30 dark:bg-indigo-500/10'
                        : 'border-transparent hover:bg-muted/60',
                      rol.bloqueado ? 'opacity-70' : 'cursor-pointer',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
                        marcado ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icono className="size-4" />
                    </span>
                    <span className="flex-1">{permiso.descripcion}</span>

                    {/* La casilla real está oculta; lo que se ve es un interruptor de encendido/apagado. */}
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={marcado}
                      disabled={Boolean(rol.bloqueado)}
                      onChange={() => alternar(permiso)}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50',
                        marcado ? 'bg-indigo-600' : 'bg-input',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200',
                          marcado && 'translate-x-4',
                        )}
                      />
                    </span>
                  </label>
                )
              })}
            </fieldset>
          ))}
        </div>

        {!rol.bloqueado && (
          // Pegado abajo de la pantalla para que "Guardar" siempre esté a la mano en el celular.
          <footer className="sticky bottom-0 flex flex-col gap-2 rounded-b-xl border-t bg-card/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{aviso ?? (hayCambios ? 'Tienes cambios sin guardar.' : '')}</p>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={!hayCambios || guardando} onClick={() => setBorrador(null)}>
                Descartar
              </Button>
              <Button disabled={!hayCambios || guardando} onClick={guardar}>
                {guardando ? (
                  <Loader2Icon data-icon="inline-start" className="animate-spin" />
                ) : (
                  <CheckIcon data-icon="inline-start" />
                )}
                Guardar cambios
              </Button>
            </div>
          </footer>
        )}
      </section>
    </div>
  )
}

export default PermisosPorRol
