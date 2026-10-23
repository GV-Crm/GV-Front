import { cn } from 'cn'
import { ESTADOS } from '@/modules/asistencias/estados'
import { formatDuracion, formatHora } from '@/modules/asistencias/formatHora'
import type { DiaCalendario } from '@/modules/asistencias/types'

/** "08:02 – 18:05", "entró 08:02" o "salió 18:00"; null si no checó. */
function horario(dia: DiaCalendario) {
  if (dia.entrada && dia.salida) return `${formatHora(dia.entrada)} – ${formatHora(dia.salida)}`
  if (dia.entrada) return `entró ${formatHora(dia.entrada)}`
  if (dia.salida) return `salió ${formatHora(dia.salida)}`
  return null
}

/**
 * Resumen corto de la asistencia de hoy de un trabajador: estado, horario y tiempo extra.
 * Ejemplo: "Hoy · ● Retardo · 08:25 – 18:02 · +1 h 10 min extra".
 */
function AsistenciaHoy({ dia, className }: { dia: DiaCalendario; className?: string }) {
  const estilo = ESTADOS[dia.estado]
  const horas = horario(dia)
  // Si todavía no sale, el retardo no se ve en el estado ("Falta registrar salida"): se agrega aparte.
  const retardoAparte = dia.retardo && dia.estado === 'sin_salida'

  return (
    <p className={cn('flex min-w-0 items-center gap-1.5 truncate text-xs', className)} title={estilo.descripcion}>
      <span className="font-medium text-muted-foreground">Hoy</span>
      <span aria-hidden className="text-muted-foreground">·</span>
      <span className={cn('flex shrink-0 items-center gap-1 font-medium', estilo.texto)}>
        <estilo.icono className="size-3.5" />
        {estilo.etiqueta}
      </span>
      {retardoAparte && <span className={ESTADOS.retardo.texto}>· retardo</span>}
      {horas && <span className="truncate text-muted-foreground tabular-nums">· {horas}</span>}
      {dia.minutosExtra > 0 && (
        <span className="shrink-0 text-violet-700 dark:text-violet-300">· +{formatDuracion(dia.minutosExtra)} extra</span>
      )}
      {dia.extra && !dia.extra.fin && <span className="shrink-0 text-violet-700 dark:text-violet-300">· en tiempo extra</span>}
    </p>
  )
}

export default AsistenciaHoy
