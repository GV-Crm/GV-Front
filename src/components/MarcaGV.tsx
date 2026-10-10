import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from 'cn'

const PARTES = [
  { texto: 'GV', clase: 'marca-gv' },
  { texto: 'One', clase: 'marca-one' },
]

/**
 * Nombre "GV One" escrito como marca (solo tipografía, sin ícono). Lleva al inicio.
 * - Al pasar el mouse: las letras suben una tras otra como una ola.
 * - Al hacer clic: las letras dan un salto en secuencia.
 * Las animaciones están en src/index.css (clases .marca-*).
 */
function MarcaGV({ onClick }: { onClick?: () => void }) {
  // Cambia en cada clic: al usarlo como `key`, la animación del salto vuelve a empezar.
  const [saltos, setSaltos] = useState(0)
  let turno = 0

  return (
    <Link
      to="/"
      aria-label="GV One, ir al inicio"
      onClick={() => {
        setSaltos((n) => n + 1)
        onClick?.()
      }}
      className="marca rounded-lg px-2 py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span key={saltos} aria-hidden className={cn('inline-flex items-baseline gap-[0.18em]', saltos > 0 && 'marca-saltando')}>
        {PARTES.map((parte) => (
          <span key={parte.texto} className={parte.clase}>
            {[...parte.texto].map((letra) => {
              const i = turno++
              return (
                <span key={i} className="marca-letra" style={{ '--i': i } as React.CSSProperties}>
                  {letra}
                </span>
              )
            })}
          </span>
        ))}
      </span>
    </Link>
  )
}

export default MarcaGV
