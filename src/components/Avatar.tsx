import { cn } from 'cn'

const COLORES = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300',
]

/** El mismo nombre siempre sale del mismo color. */
function colorDe(nombre: string) {
  let hash = 0
  for (const letra of nombre) hash = (hash * 31 + letra.charCodeAt(0)) | 0
  return COLORES[Math.abs(hash) % COLORES.length]
}

/** "Martin Lopez" → "ML" */
function inicialesDe(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('')
}

/** Círculo de color con las iniciales de una persona. */
function Avatar({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold select-none',
        colorDe(nombre),
        className,
      )}
    >
      {inicialesDe(nombre)}
    </span>
  )
}

export default Avatar
