import { useEffect, useState } from 'react'
import { CheckCheckIcon, CheckIcon, Loader2Icon, LockIcon, ShieldCheckIcon, XIcon } from 'lucide-react'
import { cn } from 'cn'
import { getPermisos, guardarPermisosDeRol, type Permiso, type PermisoDelCatalogo, type RolConPermisos } from './api'
import { PERMISOS } from '@/auth/permisos'
import Avatar from '@/components/Avatar'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { ENTRADA } from '@/lib/animaciones'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** "ver:Asistencia" — para comparar permisos fácilmente. */
const clave = (p: Permiso) => `${p.accion}:${p.recurso}`

/** El ícono y el título corto que se usan en el menú de usuario para ese permiso. */
const infoDe = (p: Permiso) => PERMISOS.find((x) => clave(x) === clave(p))

/** Barra delgada que muestra qué tanto del total está activo. */
function BarraProgreso({ valor, total }: { valor: number; total: number }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <span
        className={cn('block h-full rounded-full transition-[width] duration-500 ease-out', COLOR_SECCION.control.fuerte)}
        style={{ width: `${total ? (valor / total) * 100 : 0}%` }}
      />
    </span>
  )
}

/** Tarjeta de un permiso: ícono, título, descripción, módulo e interruptor. Toda la tarjeta se puede tocar. */
function TarjetaPermiso({
  permiso,
  marcado,
  bloqueado,
  onAlternar,
}: {
  permiso: PermisoDelCatalogo
  marcado: boolean
  bloqueado: boolean
  onAlternar: () => void
}) {
  const info = infoDe(permiso)
  const Icono = info?.icono ?? ShieldCheckIcon

  return (
    <label
      className={cn(
        'flex gap-3 rounded-xl border p-4 transition-colors duration-200',
        marcado ? COLOR_SECCION.control.marcado : 'bg-card',
        bloqueado ? 'opacity-70' : 'cursor-pointer hover:border-foreground/25',
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
          marcado ? COLOR_SECCION.control.fuerte : 'bg-muted text-muted-foreground',
        )}
      >
        <Icono className="size-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{info?.texto ?? permiso.descripcion}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{permiso.descripcion}</span>
        <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {permiso.modulo}
        </span>
      </span>

      {/* La casilla real está oculta; lo que se ve es un interruptor de encendido/apagado. */}
      <input type="checkbox" className="peer sr-only" checked={marcado} disabled={bloqueado} onChange={onAlternar} />
      <span
        aria-hidden
        className={cn(
          'relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50',
          marcado ? 'bg-amber-700' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200',
            marcado && 'translate-x-5',
          )}
        />
      </span>
    </label>
  )
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

  /** "Activar todos" o "Quitar todos" de una vez (igual hay que guardar). */
  function marcarTodos(activar: boolean) {
    setBorrador({ rol: rol.rol, claves: activar ? catalogo.map(clave) : [] })
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
    <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Lista de roles: en móvil es una fila que se desliza de lado. */}
      <nav aria-label="Roles" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {roles.map((r) => {
          const elegido = r.rol === rol.rol
          return (
            <button
              key={r.rol}
              type="button"
              aria-pressed={elegido}
              onClick={() => elegirRol(r.rol)}
              className={cn(
                'flex w-56 shrink-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors lg:w-full',
                elegido
                  ? COLOR_SECCION.control.marcado
                  : 'bg-card hover:border-foreground/25',
              )}
            >
              {/* Iniciales con color propio: varios roles empiezan con "A", así se distinguen. */}
              <Avatar nombre={r.rol} className={cn('rounded-lg', COLOR_SECCION.control.suave)} />
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{r.rol}</span>
                  {r.bloqueado ? (
                    <LockIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {r.permisos.length}/{catalogo.length}
                    </span>
                  )}
                </span>
                <BarraProgreso valor={r.permisos.length} total={catalogo.length} />
              </span>
            </button>
          )
        })}
      </nav>

      {/* La clave repite la animación de entrada al elegir otro rol. */}
      <section key={rol.rol} className={cn('overflow-hidden rounded-xl border bg-card', ENTRADA)}>
        <header className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="font-heading text-2xl font-bold tracking-tight">{rol.rol}</h2>
            <div className="flex max-w-xs items-center gap-3">
              <BarraProgreso valor={marcadas.length} total={catalogo.length} />
              <span className="shrink-0 text-sm text-muted-foreground">
                {marcadas.length} de {catalogo.length} permisos
              </span>
            </div>
          </div>
          {!rol.bloqueado && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={marcadas.length === catalogo.length} onClick={() => marcarTodos(true)}>
                <CheckCheckIcon data-icon="inline-start" />
                Activar todos
              </Button>
              <Button variant="ghost" size="sm" disabled={marcadas.length === 0} onClick={() => marcarTodos(false)}>
                <XIcon data-icon="inline-start" />
                Quitar todos
              </Button>
            </div>
          )}
        </header>

        {rol.bloqueado && (
          <p className="flex items-center gap-2 border-b bg-amber-50 px-5 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <LockIcon className="size-4 shrink-0" />
            {rol.bloqueado}
          </p>
        )}

        <div className="grid gap-3 p-5 md:grid-cols-2">
          {catalogo.map((permiso) => (
            <TarjetaPermiso
              key={clave(permiso)}
              permiso={permiso}
              marcado={marcadas.includes(clave(permiso))}
              bloqueado={Boolean(rol.bloqueado)}
              onAlternar={() => alternar(permiso)}
            />
          ))}
        </div>

        {!rol.bloqueado && (
          // Pegado abajo de la pantalla para que "Guardar" siempre esté a la mano en el celular.
          <footer className="sticky bottom-0 flex flex-col gap-2 border-t bg-card/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
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
