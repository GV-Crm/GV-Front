import { useCallback, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AsteriskIcon,
  BookOpenIcon,
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  FingerprintIcon,
  HandIcon,
  Loader2Icon,
  PencilIcon,
  RefreshCwIcon,
  ScanFaceIcon,
  ServerIcon,
  ShieldQuestionIcon,
  WifiIcon,
  WifiOffIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { actualizarChecador, getChecadores, type Checador, type EstadoChecadores, type Marca } from './api'
import Ayuda from '@/components/Ayuda'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { conTransicion } from '@/lib/transicion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

/** Cada cuánto se vuelve a preguntar el estado al backend. */
const SEGUNDOS_ENTRE_ACTUALIZACIONES = 15

/** Qué significa cada "Estado" de una marca (lo manda el checador). Todas van en el color de la sección. */
const TIPOS_DE_MARCA: Record<number, { texto: string }> = {
  0: { texto: 'Entrada' },
  1: { texto: 'Salida' },
  2: { texto: 'Sale a descanso' },
  3: { texto: 'Regresa de descanso' },
  4: { texto: 'Entrada extra' },
  5: { texto: 'Salida extra' },
}

/** Cómo se identificó la persona en el checador. */
const VERIFICACIONES: Record<number, { texto: string; icono: LucideIcon }> = {
  0: { texto: 'Contraseña', icono: AsteriskIcon },
  1: { texto: 'Huella', icono: FingerprintIcon },
  4: { texto: 'Tarjeta', icono: CreditCardIcon },
  15: { texto: 'Rostro', icono: ScanFaceIcon },
  25: { texto: 'Palma', icono: HandIcon },
}

/** "hace 8 s", "hace 3 min", "hace 2 h", "hace 4 días" */
function haceCuanto(iso: string | null) {
  if (!iso) return 'nunca'
  const segundos = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000))
  if (segundos < 60) return `hace ${segundos} s`
  if (segundos < 3600) return `hace ${Math.round(segundos / 60)} min`
  if (segundos < 86400) return `hace ${Math.round(segundos / 3600)} h`
  return `hace ${Math.round(segundos / 86400)} días`
}

/** Dirección que se escribe en el checador (la del backend, sin https://). */
const DIRECCION_SERVIDOR = (() => {
  try {
    return new URL(import.meta.env.VITE_API_URL ?? '').host
  } catch {
    return 'tu-backend.vercel.app'
  }
})()

function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(texto).then(() => {
          setCopiado(true)
          setTimeout(() => setCopiado(false), 1500)
        })
      }}
    >
      {copiado ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      {copiado ? 'Copiado' : 'Copiar'}
    </Button>
  )
}

/** Lo que se ve cuando todavía no se conecta ningún checador: los pasos y la dirección del servidor. */
function SinChecadores() {
  const pasos = [
    'Conecta el checador a internet (cable o Wi-Fi).',
    'En el checador: Menú → Comunicación → Servidor en la nube (ADMS). Escribe la dirección de abajo, puerto 443 y activa HTTPS.',
    'En menos de un minuto aparecerá aquí como "equipo nuevo". Autorízalo y listo.',
  ]
  return (
    <section className={cn('rounded-xl border border-dashed bg-card p-5 sm:p-6', ENTRADA)}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className={cn('flex size-14 items-center justify-center rounded-full motion-safe:animate-pulse', COLOR_SECCION.dispositivos.suave)}>
          <ScanFaceIcon className="size-7" />
        </span>
        <p className="font-medium">Todavía no se ha conectado ningún checador</p>
      </div>

      <ol className="mx-auto mt-5 max-w-lg space-y-3">
        {pasos.map((paso, i) => (
          <li key={i} style={retrasoEscalonado(i + 1)} className={cn('flex gap-3 text-sm', ENTRADA)}>
            <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', COLOR_SECCION.dispositivos.suave)}>
              {i + 1}
            </span>
            <span className="text-muted-foreground">{paso}</span>
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-5 flex max-w-lg flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 p-3">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <ServerIcon className="size-4 shrink-0 text-muted-foreground" />
          <code className="truncate font-semibold">{DIRECCION_SERVIDOR}</code>
        </span>
        <BotonCopiar texto={DIRECCION_SERVIDOR} />
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <BookOpenIcon className="size-3.5" />
        Paso a paso completo: INSTRUCTIVO-CHECADOR.txt (pídelo al administrador del sistema)
      </p>
    </section>
  )
}

/** Tarjeta de un checador: si está conectado, cuándo habló por última vez, y botón para autorizarlo. */
function TarjetaChecador({ checador, onCambio }: { checador: Checador; onCambio: (c: Checador) => void }) {
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombre, setNombre] = useState(checador.Nombre ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(cambios: { Autorizado?: boolean; Nombre?: string }) {
    setGuardando(true)
    setError(null)
    try {
      const actualizado = await actualizarChecador(checador.id, cambios)
      onCambio({ ...checador, ...actualizado })
      setEditandoNombre(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  const firmware = checador.Info?.split(',')[0]

  return (
    <article className={cn('overflow-hidden rounded-xl border bg-card', ENTRADA)}>
      <div className="flex items-center gap-4 p-4">
        {/* Indicador: verde y "latiendo" si está conectado; gris si no. */}
        <span className="relative flex size-12 shrink-0 items-center justify-center">
          {checador.conectado && (
            <span className="absolute inset-0 rounded-full bg-emerald-400/40 motion-safe:animate-ping" />
          )}
          <span
            className={cn(
              'relative flex size-12 items-center justify-center rounded-full',
              checador.conectado
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {checador.conectado ? <WifiIcon className="size-6" /> : <WifiOffIcon className="size-6" />}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          {editandoNombre ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                guardar({ Nombre: nombre })
              }}
            >
              <Input autoFocus value={nombre} maxLength={80} placeholder="Ej. Entrada principal" onChange={(e) => setNombre(e.target.value)} />
              <Button type="submit" size="sm" disabled={guardando}>
                Guardar
              </Button>
            </form>
          ) : (
            <p className="flex items-center gap-2 font-semibold">
              <span className="truncate">{checador.Nombre ?? 'Checador sin nombre'}</span>
              <button
                type="button"
                aria-label="Cambiar nombre"
                title="Cambiar nombre"
                className="text-muted-foreground transition-colors hover:text-primary"
                onClick={() => setEditandoNombre(true)}
              >
                <PencilIcon className="size-3.5" />
              </button>
            </p>
          )}
          <p
            className={cn(
              'text-sm font-medium',
              checador.conectado ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground',
            )}
          >
            {checador.conectado ? 'Conectado' : 'Sin conexión'}
            <span className="font-normal text-muted-foreground"> · último contacto {haceCuanto(checador.UltimaConexion)}</span>
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t px-4 py-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Número de serie</dt>
          <dd className="font-mono font-medium">{checador.SN}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">IP</dt>
          <dd className="font-mono">{checador.IP ?? '—'}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-muted-foreground">Versión del equipo</dt>
          <dd className="truncate" title={checador.Info ?? undefined}>
            {firmware ?? '—'}
          </dd>
        </div>
      </dl>

      {!checador.Autorizado && (
        <div className="flex flex-col gap-3 border-t bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-500/10">
          <p className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
            <ShieldQuestionIcon className="mt-0.5 size-4 shrink-0" />
            Equipo nuevo: sus marcas no se guardan hasta que lo autorices. Confirma que el número de serie es el de tu checador.
          </p>
          <Button className="shrink-0" disabled={guardando} onClick={() => guardar({ Autorizado: true })}>
            {guardando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <CheckIcon data-icon="inline-start" />}
            Autorizar
          </Button>
        </div>
      )}
      {error && <p className="border-t px-4 py-2 text-xs text-destructive">{error}</p>}
    </article>
  )
}

function FilaMarca({ marca, posicion, nombreChecador }: { marca: Marca; posicion: number; nombreChecador?: string }) {
  const tipo = marca.Estado !== null ? TIPOS_DE_MARCA[marca.Estado] : undefined
  const verificacion = marca.Verificacion !== null ? VERIFICACIONES[marca.Verificacion] : undefined
  const IconoVerificacion = verificacion?.icono ?? ScanFaceIcon

  return (
    <li style={{ ...retrasoEscalonado(posicion), viewTransitionName: `marca-${marca.id}` }} className={cn('flex items-center gap-3 p-3 sm:px-4', ENTRADA)}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold', COLOR_SECCION.dispositivos.suave)}>
        #{marca.PIN}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Usuario {marca.PIN}</p>
        <p className="truncate text-xs text-muted-foreground">
          {format(new Date(marca.FechaHora), "EEE d 'de' MMM · HH:mm:ss", { locale: es })}
          {nombreChecador && ` · ${nombreChecador}`}
        </p>
      </div>
      <span title={verificacion?.texto ?? `Código ${marca.Verificacion}`} className="text-muted-foreground">
        <IconoVerificacion className="size-4" />
      </span>
      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', COLOR_SECCION.dispositivos.suave)}>
        {tipo?.texto ?? 'Marca'}
      </span>
    </li>
  )
}

/** Módulo Checador: requiere el permiso "gestionar Checador". */
function ChecadorPage() {
  const [datos, setDatos] = useState<EstadoChecadores | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actualizando, setActualizando] = useState(false)
  // Id de la marca más reciente que ya se mostró, para saber si llegaron nuevas.
  const ultimaMarca = useRef<number | null>(null)

  const pedirEstado = useCallback(() => {
    getChecadores()
      .then((nuevos) => {
        const masReciente = nuevos.marcas[0]?.id ?? null
        const llegaronNuevas = ultimaMarca.current !== null && masReciente !== ultimaMarca.current
        ultimaMarca.current = masReciente
        // Solo se anima si llegaron marcas: las anteriores bajan deslizándose y la nueva aparece arriba.
        if (llegaronNuevas) conTransicion(() => setDatos(nuevos))
        else setDatos(nuevos)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setActualizando(false))
  }, [])

  // Se pregunta al abrir la pantalla y luego cada 15 segundos, para ver el estado "en vivo".
  useEffect(() => {
    pedirEstado()
    const intervalo = setInterval(pedirEstado, SEGUNDOS_ENTRE_ACTUALIZACIONES * 1000)
    return () => clearInterval(intervalo)
  }, [pedirEstado])

  const reemplazar = (actualizado: Checador) =>
    setDatos((d) => d && { ...d, checadores: d.checadores.map((c) => (c.id === actualizado.id ? actualizado : c)) })

  const nombrePorSN = new Map(datos?.checadores.map((c) => [c.SN, c.Nombre ?? c.SN]))
  const variosChecadores = (datos?.checadores.length ?? 0) > 1

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <EncabezadoPagina
        icono={ScanFaceIcon}
        titulo="Checador"
        acciones={
          <Button
            variant="outline"
            disabled={actualizando}
            onClick={() => {
              setActualizando(true)
              pedirEstado()
            }}
          >
            <RefreshCwIcon data-icon="inline-start" className={cn(actualizando && 'animate-spin')} />
            Actualizar
          </Button>
        }
      />

      {!datos && !error ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : error && !datos ? (
        <p className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">{error}</p>
      ) : datos && datos.checadores.length === 0 ? (
        <SinChecadores />
      ) : (
        datos && (
          <>
            <section className="grid gap-4 lg:grid-cols-2">
              {datos.checadores.map((c) => (
                <TarjetaChecador key={c.id} checador={c} onCambio={reemplazar} />
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <FingerprintIcon className={cn('size-4', COLOR_SECCION.dispositivos.texto)} />
                Últimas marcas recibidas
                <Ayuda>
                  Así llegan del checador, antes de convertirse en asistencias. "Usuario" es el número que tiene la
                  persona dentro del checador. Se actualiza solo cada {SEGUNDOS_ENTRE_ACTUALIZACIONES} segundos.
                </Ayuda>
              </h2>
              {datos.marcas.length === 0 ? (
                <p className="rounded-xl border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
                  Todavía no llega ninguna marca. Haz una prueba en el checador (con el equipo ya autorizado).
                </p>
              ) : (
                <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                  {datos.marcas.map((m, i) => (
                    <FilaMarca
                      key={m.id}
                      marca={m}
                      posicion={i}
                      nombreChecador={variosChecadores ? nombrePorSN.get(m.SN) : undefined}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )
      )}
    </div>
  )
}

export default ChecadorPage
