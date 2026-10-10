import { useEffect, useState } from 'react'
import { cn } from 'cn'
import type { Perfil } from '@/auth/auth-context'
import Avatar from '@/components/Avatar'

/** Cuánto dura la línea de abajo (lo que tarda en cerrarse sola) y cuánto el desvanecido final. */
const DURACION_LINEA_MS = 2200
const SALIDA_MS = 700

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
 * Separa el nombre en palabras y letras, y le da a cada letra su turno para aparecer.
 * Las palabras van completas en una línea para que en el celular no se corten a la mitad.
 */
function letrasPorPalabra(nombre: string) {
  let turno = 0
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra) => [...palabra].map((letra) => ({ letra, turno: turno++ })))
}

/**
 * Presentación que aparece justo después de iniciar sesión: avatar, saludo, nombre y rol.
 *
 * Cómo se ve la transición:
 *   1. Al iniciar sesión, la pantalla blanca cubre el login (mientras llegan tus datos se ven tres puntos).
 *   2. Llegan tus datos: aparecen el avatar, el saludo, tu nombre letra por letra y tu rol.
 *   3. Se desvanece y queda la plataforma, que ya se cargó detrás.
 * Se puede saltar tocando la pantalla o con cualquier tecla. Las animaciones están en src/index.css.
 */
function Bienvenida({ perfil, onTerminar }: { perfil: Perfil | null; onTerminar: () => void }) {
  const [saliendo, setSaliendo] = useState(false)

  const nombre = perfil ? perfil.nombre?.trim() || perfil.correo : ''
  const palabras = letrasPorPalabra(nombre)
  const totalLetras = palabras.flat().length

  // Orden de aparición (en ms desde que llegan los datos).
  const inicioNombre = 500
  const inicioRol = inicioNombre + totalLetras * 40 + 150
  const inicioLinea = inicioRol + 150

  // Cuando ya están los datos, espera a que termine la línea y empieza a desvanecerse.
  useEffect(() => {
    if (!perfil) return
    const temporizador = setTimeout(() => setSaliendo(true), inicioLinea + DURACION_LINEA_MS)
    return () => clearTimeout(temporizador)
  }, [perfil, inicioLinea])

  // Al terminar el desvanecido, avisa para quitar esta pantalla.
  useEffect(() => {
    if (!saliendo) return
    const temporizador = setTimeout(onTerminar, SALIDA_MS)
    return () => clearTimeout(temporizador)
  }, [saliendo, onTerminar])

  // Solo se puede saltar cuando la plataforma ya está lista detrás.
  const saltar = () => {
    if (perfil) setSaliendo(true)
  }

  return (
    <div
      role="dialog"
      aria-label={perfil ? `Bienvenido, ${nombre}` : 'Entrando'}
      tabIndex={-1}
      autoFocus
      onClick={saltar}
      onKeyDown={saltar}
      className={cn(
        'bienvenida fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-white text-slate-950 outline-none',
        saliendo && 'bienvenida-salida',
      )}
    >
      {!perfil ? (
        // Mientras llegan los datos del usuario.
        <div className="flex flex-col items-center gap-4" aria-live="polite">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} style={despues(i * 150)} className="bienvenida-punto size-2.5 rounded-full bg-slate-950" />
            ))}
          </div>
          <p className="text-xs font-medium tracking-[0.3em] text-slate-400 uppercase">Entrando</p>
        </div>
      ) : (
        <div className="flex max-w-5xl flex-col items-center px-6 text-center">
          {/* Avatar con un arco negro que gira a su alrededor. */}
          <div className="bienvenida-avatar relative mb-10 flex items-center justify-center">
            <span
              aria-hidden
              className="bienvenida-arco absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,#0f172a_300deg,transparent_360deg)]"
            />
            <Avatar nombre={nombre} foto={perfil.avatar} className="relative size-28 text-4xl shadow-2xl shadow-slate-900/15 sm:size-32 sm:text-5xl" />
          </div>

          <p style={despues(350)} className="bienvenida-subir text-xs font-semibold tracking-[0.4em] text-slate-400 uppercase sm:text-sm">
            {saludoSegunLaHora()}
          </p>

          {/* El nombre en letras grandes: cada letra sube desde abajo de una línea invisible. */}
          <h1 className="mt-4 flex flex-wrap justify-center gap-x-[0.28em] text-5xl leading-none font-black tracking-tight sm:text-7xl lg:text-8xl">
            {palabras.map((letras, p) => (
              <span key={p} className="inline-block overflow-hidden pb-[0.1em] whitespace-nowrap">
                {letras.map(({ letra, turno }) => (
                  <span key={turno} style={despues(inicioNombre + turno * 40)} className="bienvenida-letra inline-block">
                    {letra}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p
            style={despues(inicioRol)}
            className="bienvenida-subir mt-6 rounded-full border border-slate-950 px-5 py-1.5 text-sm font-semibold sm:text-base"
          >
            {perfil.rol}
          </p>

          <div className="mt-12 flex w-40 flex-col items-center gap-3">
            <div className="h-px w-full overflow-hidden bg-slate-200">
              <div style={despues(inicioLinea)} className="bienvenida-linea h-full origin-left bg-slate-950" />
            </div>
            <p style={despues(inicioLinea)} className="bienvenida-subir text-xs whitespace-nowrap text-slate-400">
              Toca para entrar
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bienvenida
