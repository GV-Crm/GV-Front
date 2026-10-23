import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlarmClockIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  DoorOpenIcon,
  MoonIcon,
  PalmtreeIcon,
  PartyPopperIcon,
  TimerIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { ESTADOS, puedePedirPermiso } from './estados'
import { formatDuracion, formatHora } from './formatHora'
import PermisoSalida from './PermisoSalida'
import { usePuede } from '@/auth/permisos'
import type { DiaCalendario, EmpleadoCalendario } from './types'
import Avatar from '@/components/Avatar'
import Cifra from '@/components/Cifra'
import { ELEVAR_AL_PASAR, ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Persona = { empleado: EmpleadoCalendario; dia: DiaCalendario }

const PRESENTE = new Set(['asistio', 'retardo', 'permiso', 'sin_salida', 'sin_entrada'])

/** Reparte a los trabajadores activos en los grupos del panel según su día de hoy. */
function agrupar(empleados: EmpleadoCalendario[]) {
  const personas: Persona[] = empleados.flatMap((empleado) => (empleado.dias[0] ? [{ empleado, dia: empleado.dias[0] }] : []))
  const porNombre = (a: Persona, b: Persona) => a.empleado.Nombre.localeCompare(b.empleado.Nombre, 'es')
  const presentes = personas.filter((p) => PRESENTE.has(p.dia.estado)).sort(porNombre)
  return {
    total: personas.length,
    presentes,
    // Quien ya salió con permiso va en su propio grupo.
    aTiempo: presentes.filter((p) => !p.dia.retardo && p.dia.estado !== 'permiso').sort(porNombre),
    conPermiso: personas.filter((p) => p.dia.estado === 'permiso').sort(porNombre),
    // Los que llegaron más tarde, primero.
    retardos: presentes.filter((p) => p.dia.retardo).sort((a, b) => b.dia.minutosTarde - a.dia.minutosTarde),
    faltas: personas.filter((p) => p.dia.estado === 'falta').sort(porNombre),
    pendientes: personas.filter((p) => p.dia.estado === 'pendiente').sort(porNombre),
    ausencias: personas.filter((p) => p.dia.estado === 'vacaciones' || p.dia.estado === 'justificada').sort(porNombre),
    extra: personas
      .filter((p) => p.dia.minutosExtra > 0 || (p.dia.extra && !p.dia.extra.fin))
      .sort((a, b) => b.dia.minutosExtra - a.dia.minutosExtra),
    descanso: personas.length > 0 && personas.every((p) => p.dia.estado === 'descanso'),
  }
}

type Indicador = {
  titulo: string
  /** Quiénes están en esta situación: se muestran al pasar el mouse. */
  personas: Persona[]
  icono: LucideIcon
  /** Clases de color: fondo y borde de la tarjeta, ícono y número. */
  tarjeta: string
  icon: string
  numero: string
}

/** Cuántos nombres caben en la ventanita; si hay más, se dice cuántos faltan. */
const MAX_NOMBRES = 12

/** Tarjeta chica: ícono, número y nombre en una sola línea. Al pasar el mouse muestra quiénes son. */
function TarjetaIndicador({ indicador, posicion }: { indicador: Indicador; posicion: number }) {
  const { titulo, personas, icono: Icono, tarjeta, icon, numero } = indicador
  const visibles = personas.slice(0, MAX_NOMBRES)
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            tabIndex={0}
            style={retrasoEscalonado(posicion)}
            className={cn(
              'flex cursor-default items-center gap-2 rounded-lg border px-2.5 py-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              tarjeta,
              ENTRADA,
              ELEVAR_AL_PASAR,
            )}
          />
        }
      >
        <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', icon)}>
          <Icono className="size-3.5" />
        </span>
        <Cifra valor={personas.length} className={cn('text-lg leading-none', numero)} />
        <span className="truncate text-xs font-medium">{titulo}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex-col items-start gap-1 py-2">
        <p className="font-semibold">{titulo}</p>
        {personas.length === 0 ? (
          <p className="opacity-80">Nadie por ahora</p>
        ) : (
          <ul className="space-y-0.5">
            {visibles.map((p) => (
              <li key={p.empleado.Uuid}>{p.empleado.Nombre}</li>
            ))}
            {personas.length > MAX_NOMBRES && <li className="opacity-80">y {personas.length - MAX_NOMBRES} más</li>}
          </ul>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

type PropsGrupo = {
  titulo: string
  icono: LucideIcon
  /** Color del encabezado del grupo (el del estado). */
  color: string
  personas: Persona[]
  detalle: (p: Persona) => ReactNode
  /** Qué decir si el grupo está vacío. */
  vacio: string
  posicion: number
  /** Algo que se puede hacer con cada persona (p. ej. darle permiso de salida). Va debajo de su renglón. */
  accion?: (p: Persona) => ReactNode
}

function Grupo({ titulo, icono: Icono, color, personas, detalle, vacio, posicion, accion }: PropsGrupo) {
  return (
    <section style={retrasoEscalonado(posicion)} className={cn('overflow-hidden rounded-xl border bg-card', ENTRADA)}>
      <h3 className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-semibold', color)}>
        <Icono className="size-4" />
        {titulo}
        <span className="ml-auto rounded-full bg-background/70 px-2 text-xs tabular-nums">{personas.length}</span>
      </h3>
      {personas.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
          <PartyPopperIcon className="size-4" />
          {vacio}
        </p>
      ) : (
        <ul className="max-h-80 divide-y overflow-y-auto">
          {personas.map((p) => (
            <li key={p.empleado.Uuid}>
              <Link
                to={`/asistencias/${p.empleado.Uuid}`}
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/50"
              >
                <Avatar nombre={p.empleado.Nombre} foto={p.empleado.Foto} className="size-8 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.empleado.Nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.empleado.Area?.trim() || 'Sin área'}</p>
                </div>
                <span className="shrink-0 text-right text-xs tabular-nums">{detalle(p)}</span>
              </Link>
              {/* Fuera del enlace: así un botón no abre el calendario del trabajador. */}
              {accion?.(p) && <div className="flex justify-end px-4 pb-2 empty:hidden">{accion(p)}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const horario = (d: DiaCalendario) =>
  d.entrada && d.salida ? `${formatHora(d.entrada)} – ${formatHora(d.salida)}` : d.entrada ? `entró ${formatHora(d.entrada)}` : '—'

/**
 * Panel del día: un conteo chico por situación (con el color de cada estado) y, sobre todo, la lista de quiénes son:
 * quién faltó, quién llegó tarde y por cuánto, quién no ha llegado, quién está de vacaciones y quién hace tiempo extra.
 */
function PanelDeHoy({ empleados, onCambio }: { empleados: EmpleadoCalendario[]; onCambio: () => void }) {
  const g = agrupar(empleados)
  const puedeAutorizar = usePuede('autorizar', 'Salida')
  // Botón de permiso de salida (o la cuenta regresiva si ya tiene uno activo) para quien llegó y no ha salido.
  const permisoDeSalida = (p: Persona) =>
    puedePedirPermiso(p.dia) && (puedeAutorizar || p.dia.permisoSalida?.situacion === 'activo') ? (
      <PermisoSalida uuid={p.empleado.Uuid} dia={p.dia} onCambio={onCambio} compacto />
    ) : null

  if (g.descanso) {
    return (
      <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-6', ESTADOS.descanso.celda, ENTRADA)}>
        <MoonIcon className={cn('size-6', ESTADOS.descanso.texto)} />
        <div>
          <p className="font-semibold">Hoy es día de descanso</p>
          <p className="text-sm text-muted-foreground">Se trabaja de lunes a sábado.</p>
        </div>
      </div>
    )
  }

  const indicadores: Indicador[] = [
    { titulo: 'Presentes', personas: g.presentes, icono: UsersIcon, tarjeta: ESTADOS.asistio.celda, icon: ESTADOS.asistio.badge, numero: ESTADOS.asistio.texto },
    { titulo: 'Retardos', personas: g.retardos, icono: AlarmClockIcon, tarjeta: ESTADOS.retardo.celda, icon: ESTADOS.retardo.badge, numero: ESTADOS.retardo.texto },
    { titulo: 'Con permiso', personas: g.conPermiso, icono: DoorOpenIcon, tarjeta: ESTADOS.permiso.celda, icon: ESTADOS.permiso.badge, numero: ESTADOS.permiso.texto },
    { titulo: 'Faltas', personas: g.faltas, icono: CircleXIcon, tarjeta: ESTADOS.falta.celda, icon: ESTADOS.falta.badge, numero: ESTADOS.falta.texto },
    { titulo: 'Aún no llegan', personas: g.pendientes, icono: ClockIcon, tarjeta: 'bg-card border-slate-200 dark:border-slate-500/30', icon: ESTADOS.pendiente.badge, numero: ESTADOS.pendiente.texto },
    { titulo: 'Vacaciones / justificadas', personas: g.ausencias, icono: PalmtreeIcon, tarjeta: ESTADOS.vacaciones.celda, icon: ESTADOS.vacaciones.badge, numero: ESTADOS.vacaciones.texto },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {indicadores.map((indicador, i) => (
          <TarjetaIndicador key={indicador.titulo} indicador={indicador} posicion={i} />
        ))}
      </div>

      <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Grupo
          posicion={0}
          titulo="Faltaron"
          icono={CircleXIcon}
          color={ESTADOS.falta.badge}
          personas={g.faltas}
          vacio="Nadie ha faltado hoy."
          detalle={(p) => (p.dia.entrada ? <span className={ESTADOS.falta.texto}>llegó {formatHora(p.dia.entrada)}</span> : 'sin registros')}
        />
        <Grupo
          posicion={1}
          titulo="Llegaron tarde"
          icono={AlarmClockIcon}
          color={ESTADOS.retardo.badge}
          personas={g.retardos}
          vacio="Nadie ha llegado tarde."
          detalle={(p) => (
            <>
              <span className="block">{formatHora(p.dia.entrada)}</span>
              <span className={cn('font-medium', ESTADOS.retardo.texto)}>{formatDuracion(p.dia.minutosTarde)} tarde</span>
            </>
          )}
          accion={permisoDeSalida}
        />
        <Grupo
          posicion={2}
          titulo="Aún no llegan"
          icono={ClockIcon}
          color={ESTADOS.pendiente.badge}
          personas={g.pendientes}
          vacio="Todos ya registraron su entrada."
          detalle={() => 'sin entrada'}
        />
        <Grupo
          posicion={3}
          titulo="Llegaron a tiempo"
          icono={CircleCheckIcon}
          color={ESTADOS.asistio.badge}
          personas={g.aTiempo}
          vacio="Todavía nadie ha llegado a tiempo."
          detalle={(p) => horario(p.dia)}
          accion={permisoDeSalida}
        />
        {g.conPermiso.length > 0 && (
          <Grupo
            posicion={4}
            titulo="Salieron con permiso"
            icono={DoorOpenIcon}
            color={ESTADOS.permiso.badge}
            personas={g.conPermiso}
            vacio=""
            detalle={(p) => (
              <>
                <span className="block">salió {formatHora(p.dia.salida)}</span>
                {p.dia.permisoSalida?.motivo && (
                  <span className="block max-w-40 truncate text-muted-foreground" title={p.dia.permisoSalida.motivo}>
                    {p.dia.permisoSalida.motivo}
                  </span>
                )}
              </>
            )}
          />
        )}
        {g.ausencias.length > 0 && (
          <Grupo
            posicion={4}
            titulo="Vacaciones y faltas justificadas"
            icono={PalmtreeIcon}
            color={ESTADOS.vacaciones.badge}
            personas={g.ausencias}
            vacio=""
            detalle={(p) => ESTADOS[p.dia.estado].etiqueta}
          />
        )}
        {g.extra.length > 0 && (
          <Grupo
            posicion={5}
            titulo="Tiempo extra"
            icono={TimerIcon}
            color="bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-200"
            personas={g.extra}
            vacio=""
            detalle={(p) =>
              p.dia.extra && !p.dia.extra.fin ? `desde ${formatHora(p.dia.extra.inicio)}` : `+${formatDuracion(p.dia.minutosExtra)}`
            }
          />
        )}
      </div>
    </div>
  )
}

export default PanelDeHoy
