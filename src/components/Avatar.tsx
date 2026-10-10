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

type Props = {
  nombre: string
  /** URL de la foto de perfil. Si no hay, se muestran las iniciales. */
  foto?: string | null
  className?: string
}

/** Círculo con la foto de la persona o, si no tiene, sus iniciales. */
function Avatar({ nombre, foto, className }: Props) {
  if (foto) {
    return (
      <img
        src={foto}
        alt=""
        aria-hidden
        className={cn('size-9 shrink-0 rounded-full bg-muted object-cover', className)}
      />
    )
  }

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
