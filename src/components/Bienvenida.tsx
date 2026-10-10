import { useEffect, useMemo, useState } from 'react'
import { ShieldCheckIcon, SparklesIcon } from 'lucide-react'
import { cn } from 'cn'
import type { Perfil } from '@/auth/auth-context'
import { crearAbility, PERMISOS } from '@/auth/permisos'
import Avatar from '@/components/Avatar'

/** Cuánto se queda en pantalla antes de cerrarse sola, y cuánto dura la animación de salida. */
const DURACION_MS = 3400
const SALIDA_MS = 800

/** "Buenos días" / "Buenas tardes" / "Buenas noches" según la hora. */
function saludoSegunLaHora() {
  const hora = new Date().getHours()
  if (hora >= 5 && hora < 12) return 'Buenos días'
  if (hora >= 12 && hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Retraso para que cada elemento entre después del anterior (en milisegundos). */
const despues = (ms: number) => ({ animationDelay: `${ms}ms` })

/**
 * Pantalla de presentación que aparece justo después de iniciar sesión:
 * avatar, saludo, nombre, rol y lo que la persona puede hacer.
 * Se cierra sola en unos segundos, o antes si tocas la pantalla o presionas una tecla.
 * Las animaciones están en src/index.css (clases .bienvenida-*).
 */
function Bienvenida({ perfil, onTerminar }: { perfil: Perfil; onTerminar: () => void }) {
  const ability = useMemo(() => crearAbility(perfil.reglas), [perfil])
  const [saliendo, setSaliendo] = useState(false)

  const nombre = perfil.nombre?.trim() || perfil.correo
  const letras = [...nombre]
  const permitidos = PERMISOS.filter((p) => ability.can(p.accion, p.recurso))
  const esAdmin = ability.can('manage', 'all')
  // El rol entra cuando ya terminaron de aparecer las letras del nombre.
  const finDelNombre = 700 + letras.length * 35

  // Se cierra sola después de unos segundos.
  useEffect(() => {
    const temporizador = setTimeout(() => setSaliendo(true), DURACION_MS)
    return () => clearTimeout(temporizador)
  }, [])

  // Cuando empieza a salir, espera a que termine la animación y avisa.
  useEffect(() => {
    if (!saliendo) return
    const temporizador = setTimeout(onTerminar, SALIDA_MS)
    return () => clearTimeout(temporizador)
  }, [saliendo, onTerminar])

  return (
    <div
      role="dialog"
      aria-label={`Bienvenido, ${nombre}`}
      tabIndex={-1}
      autoFocus
      onClick={() => setSaliendo(true)}
      onKeyDown={() => setSaliendo(true)}
      className={cn(
        'bienvenida fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-slate-950 text-white outline-none',
        saliendo && 'bienvenida-salida',
      )}
    >
      {/* Fondo: tres manchas de color difuminadas que flotan, y una cuadrícula de puntos encima. */}
      <div aria-hidden className="bienvenida-mancha absolute -top-24 -left-24 size-96 rounded-full bg-indigo-600/40 blur-3xl" />
      <div
        aria-hidden
        style={{ animationDelay: '-4s' }}
        className="bienvenida-mancha absolute -right-24 top-1/3 size-96 rounded-full bg-violet-600/35 blur-3xl"
      />
      <div
        aria-hidden
        style={{ animationDelay: '-8s' }}
        className="bienvenida-mancha absolute -bottom-32 left-1/4 size-96 rounded-full bg-sky-500/30 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgb(255_255_255/0.15)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Avatar con anillo que gira y ondas que salen de él. */}
        <div className="bienvenida-avatar relative mb-8 flex items-center justify-center">
          <span aria-hidden className="bienvenida-onda absolute inset-0 rounded-full border-2 border-indigo-400/60" />
          <span
            aria-hidden
            style={despues(1800)}
            className="bienvenida-onda absolute inset-0 rounded-full border-2 border-violet-400/60"
          />
          {/* Anillo de colores que gira; la copia difuminada de atrás le da un resplandor. */}
          <span
            aria-hidden
            className="bienvenida-anillo absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,#6366f1,#a855f7,#0ea5e9,#22c55e,#6366f1)] opacity-70 blur-xl"
          />
          <span
            aria-hidden
            className="bienvenida-anillo absolute -inset-2 rounded-full bg-[conic-gradient(from_0deg,#6366f1,#a855f7,#0ea5e9,#22c55e,#6366f1)]"
          />
          <Avatar nombre={nombre} className="relative size-28 text-4xl ring-4 ring-slate-950 sm:size-32 sm:text-5xl" />
        </div>

        <p style={despues(500)} className="bienvenida-subir text-xs font-medium tracking-[0.35em] text-indigo-200 uppercase sm:text-sm">
          {saludoSegunLaHora()}
        </p>

        {/* El nombre aparece letra por letra. */}
        <h1 className="mt-3 text-4xl font-bold tracking-tight [perspective:600px] sm:text-6xl">
          {letras.map((letra, i) => (
            <span key={i} style={despues(700 + i * 35)} className="bienvenida-letra inline-block">
              {letra === ' ' ? ' ' : letra}
            </span>
          ))}
        </h1>

        <div
          style={despues(finDelNombre)}
          className="bienvenida-subir relative mt-5 inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur"
        >
          {esAdmin ? <SparklesIcon className="size-4 text-amber-300" /> : <ShieldCheckIcon className="size-4 text-indigo-300" />}
          {perfil.rol}
          {/* Destello de luz que cruza la etiqueta. */}
          <span aria-hidden className="bienvenida-destello absolute inset-y-0 left-0 w-1/3 bg-white/30 blur-sm" />
        </div>

        {permitidos.length > 0 && (
          <ul className="mt-8 flex flex-wrap justify-center gap-3" aria-label="Lo que puedes hacer">
            {permitidos.map((p, i) => (
              <li
                key={`${p.accion}:${p.recurso}`}
                title={p.texto}
                style={despues(finDelNombre + 250 + i * 110)}
                className="bienvenida-icono flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-indigo-100 backdrop-blur"
              >
                <p.icono className="size-5" />
                <span className="sr-only">{p.texto}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="absolute bottom-12 flex w-48 flex-col items-center gap-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="bienvenida-progreso h-full origin-left rounded-full bg-linear-to-r from-indigo-400 via-violet-400 to-sky-400" />
        </div>
        <p style={despues(1500)} className="bienvenida-subir text-xs whitespace-nowrap text-white/50">
          Preparando tu espacio · toca para entrar
        </p>
      </div>
    </div>
  )
}

export default Bienvenida
