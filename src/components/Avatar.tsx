import { cn } from 'cn'

/** "Martin Lopez" → "ML" */
function inicialesDe(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('')
}

/** Círculo con las iniciales de una persona. Todos usan el mismo color (el principal) para no saturar de colores. */
function Avatar({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary select-none',
        className,
      )}
    >
      {inicialesDe(nombre)}
    </span>
  )
}

export default Avatar
