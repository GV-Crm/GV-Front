import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  CameraIcon,
  CheckIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { cambiarMiNombre, quitarMiFoto, subirMiFoto } from './api'
import { useAuth } from '@/auth/auth-context'
import { crearAbility, PERMISOS } from '@/auth/permisos'
import Avatar from '@/components/Avatar'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import { ENTRADA } from '@/lib/animaciones'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { prepararFotoDePerfil } from '@/lib/imagen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Foto de perfil: se cambia tocándola o con el botón; antes de subirla se recorta en cuadrado. */
function SeccionFoto() {
  const { perfil, recargarPerfil } = useAuth()
  const entrada = useRef<HTMLInputElement>(null)
  // Vista previa mientras se sube, para que se vea la foto nueva de inmediato.
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!perfil) return null
  const nombre = perfil.nombre?.trim() || perfil.correo
  const foto = vistaPrevia ?? perfil.avatar

  async function alElegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = '' // para poder elegir el mismo archivo otra vez
    if (!archivo) return
    setError(null)
    setTrabajando(true)
    try {
      const imagen = await prepararFotoDePerfil(archivo)
      setVistaPrevia(imagen)
      await subirMiFoto(imagen)
      recargarPerfil()
    } catch (err) {
      setVistaPrevia(null)
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setTrabajando(false)
    }
  }

  async function quitar() {
    setError(null)
    setTrabajando(true)
    try {
      await quitarMiFoto()
      setVistaPrevia(null)
      recargarPerfil()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar la foto')
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <section aria-label="Foto de perfil" className="flex flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={trabajando}
        aria-label="Cambiar foto de perfil"
        className="group relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {/* La clave hace que la foto nueva aparezca con un desvanecido. */}
        <Avatar
          key={foto ?? 'iniciales'}
          nombre={nombre}
          foto={foto}
          className={cn('size-32 text-4xl', COLOR_SECCION.personas.suave, ENTRADA)}
        />
        {/* Al pasar el mouse aparece una cámara encima. */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <CameraIcon className="size-7" />
        </span>
        {trabajando && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/60">
            <Loader2Icon className="size-7 animate-spin text-primary" />
          </span>
        )}
      </button>

      <input ref={entrada} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={alElegirArchivo} />

      <div>
        <p className="font-heading text-xl font-bold tracking-tight">{nombre}</p>
        <p className="text-sm text-muted-foreground">{perfil.rol}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" disabled={trabajando} onClick={() => entrada.current?.click()}>
          <CameraIcon data-icon="inline-start" />
          {perfil.avatar ? 'Cambiar foto' : 'Subir foto'}
        </Button>
        {perfil.avatar && (
          <Button variant="ghost" disabled={trabajando} onClick={quitar}>
            <Trash2Icon data-icon="inline-start" />
            Quitar foto
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}

/** Datos de la cuenta: el nombre se puede cambiar; correo y rol solo se muestran. */
function SeccionDatos() {
  const { perfil, recargarPerfil } = useAuth()
  const [nombre, setNombre] = useState(perfil?.nombre ?? '')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  if (!perfil) return null
  const sinCambios = nombre.trim() === (perfil.nombre ?? '').trim()

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGuardando(true)
    setAviso(null)
    try {
      await cambiarMiNombre(nombre.trim())
      recargarPerfil()
      setAviso({ tipo: 'ok', texto: 'Nombre guardado' })
    } catch (err) {
      setAviso({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo guardar' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section aria-label="Datos de la cuenta" className="flex flex-col gap-5 rounded-xl border bg-card p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <UserRoundIcon className={cn('size-4', COLOR_SECCION.personas.texto)} />
        Datos de la cuenta
      </h2>

      <form onSubmit={guardar} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nombre
          <Input
            required
            maxLength={80}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setAviso(null)
            }}
            className="h-10"
          />
        </label>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={guardando || sinCambios || !nombre.trim()}>
            {guardando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <CheckIcon data-icon="inline-start" />}
            Guardar nombre
          </Button>
          {aviso && (
            <span
              role={aviso.tipo === 'error' ? 'alert' : 'status'}
              className={cn('text-sm', aviso.tipo === 'ok' ? 'text-emerald-700' : 'text-destructive', ENTRADA)}
            >
              {aviso.texto}
            </span>
          )}
        </div>
      </form>

      <dl className="grid gap-4 border-t pt-5 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <MailIcon className="mt-0.5 size-4 text-muted-foreground" />
          <div className="min-w-0">
            <dt className="text-sm text-muted-foreground">Correo</dt>
            <dd className="truncate font-medium">{perfil.correo}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <dt className="text-sm text-muted-foreground">Rol</dt>
            <dd className="font-medium">{perfil.rol}</dd>
          </div>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">El correo y el rol solo los puede cambiar un administrador.</p>
    </section>
  )
}

/** Lo que la persona puede hacer en el sistema según su rol. */
function SeccionPermisos() {
  const { perfil } = useAuth()
  if (!perfil) return null
  const ability = crearAbility(perfil.reglas)
  const esAdmin = ability.can('manage', 'all')
  const permitidos = PERMISOS.filter((p) => ability.can(p.accion, p.recurso))

  return (
    <section aria-label="Lo que puedes hacer" className="flex flex-col gap-4 rounded-xl border bg-card p-6 lg:col-span-2">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <KeyRoundIcon className={cn('size-4', COLOR_SECCION.control.texto)} />
        Lo que puedes hacer
      </h2>
      {esAdmin && (
        <p className={cn('flex items-center gap-2 text-sm font-medium', COLOR_SECCION.control.texto)}>
          <SparklesIcon className="size-4" />
          Acceso total al sistema
        </p>
      )}
      {permitidos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tu rol todavía no tiene permisos. Pide a un administrador que te los dé.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {permitidos.map((p) => (
            <li key={`${p.accion}:${p.recurso}`} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', COLOR_SECCION.control.suave)}>
                <p.icono className="size-4" />
              </span>
              {p.texto}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Módulo Mi perfil: cada persona ve y edita su propia información. No requiere permisos. */
function PerfilPage() {
  const { perfil } = useAuth()

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <EncabezadoPagina icono={UserRoundIcon} titulo="Mi perfil" />
      <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <SeccionFoto />
        {/* La clave reinicia el formulario si cambia la cuenta. */}
        <SeccionDatos key={perfil?.cuentaId} />
        <SeccionPermisos />
      </div>
    </div>
  )
}

export default PerfilPage
