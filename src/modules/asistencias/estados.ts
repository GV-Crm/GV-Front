import {
  AlarmClockIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  DoorOpenIcon,
  FileCheckIcon,
  LogInIcon,
  LogOutIcon,
  MoonIcon,
  PalmtreeIcon,
  type LucideIcon,
} from 'lucide-react'
import type { DiaCalendario, EstadoDia } from './types'

type Estilo = {
  etiqueta: string
  /** Qué significa, en palabras simples (se muestra en leyendas y ayudas). */
  descripcion: string
  icono: LucideIcon
  /** Fondo y borde de la celda del calendario. */
  celda: string
  badge: string
  punto: string
  texto: string
}

export const ESTADOS: Record<EstadoDia, Estilo> = {
  asistio: {
    etiqueta: 'Asistió',
    descripcion: 'Registró entrada y salida.',
    icono: CircleCheckIcon,
    celda: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    punto: 'bg-emerald-600',
    texto: 'text-emerald-700 dark:text-emerald-300',
  },
  retardo: {
    etiqueta: 'Retardo',
    descripcion: 'Registró entrada y salida, pero llegó después de las 8:15.',
    icono: AlarmClockIcon,
    celda: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30',
    badge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200',
    punto: 'bg-yellow-500',
    texto: 'text-yellow-800 dark:text-yellow-300',
  },
  permiso: {
    etiqueta: 'Salió con permiso',
    descripcion: 'Salió antes de su hora con permiso: checó dentro de los 10 minutos que se le dieron.',
    icono: DoorOpenIcon,
    celda: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30',
    badge: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-200',
    punto: 'bg-indigo-600',
    texto: 'text-indigo-700 dark:text-indigo-300',
  },
  sin_salida: {
    etiqueta: 'Falta registrar salida',
    descripcion: 'Registró su entrada, pero no su salida.',
    icono: LogOutIcon,
    celda: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    punto: 'bg-amber-500',
    texto: 'text-amber-700 dark:text-amber-300',
  },
  sin_entrada: {
    etiqueta: 'Falta registrar entrada',
    descripcion: 'Registró su salida, pero no su entrada.',
    icono: LogInIcon,
    celda: 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    punto: 'bg-orange-500',
    texto: 'text-orange-700 dark:text-orange-300',
  },
  falta: {
    etiqueta: 'Falta',
    descripcion: 'Día laboral sin ningún registro, o llegó después de las 9:00.',
    icono: CircleXIcon,
    celda: 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30',
    badge: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    punto: 'bg-red-600',
    texto: 'text-red-700 dark:text-red-300',
  },
  justificada: {
    etiqueta: 'Falta justificada',
    descripcion: 'Faltó, pero un administrador lo justificó con un motivo.',
    icono: FileCheckIcon,
    celda: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30',
    badge: 'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200',
    punto: 'bg-blue-800',
    texto: 'text-blue-800 dark:text-blue-300',
  },
  vacaciones: {
    etiqueta: 'Vacaciones',
    descripcion: 'Día laboral dentro de un periodo de vacaciones que pidió: no cuenta como falta.',
    icono: PalmtreeIcon,
    celda: 'bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/30',
    badge: 'bg-teal-100 text-teal-900 dark:bg-teal-500/20 dark:text-teal-200',
    punto: 'bg-teal-600',
    texto: 'text-teal-800 dark:text-teal-300',
  },
  pendiente: {
    etiqueta: 'Pendiente',
    descripcion: 'Es hoy, todavía no registra nada y aún no dan las 9:00.',
    icono: ClockIcon,
    celda: 'border-dashed bg-card border-slate-300 dark:border-slate-500/40',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
    punto: 'bg-slate-500',
    texto: 'text-slate-600 dark:text-slate-300',
  },
  descanso: {
    etiqueta: 'Descanso',
    descripcion: 'Domingo sin registros. Se trabaja de lunes a sábado.',
    icono: MoonIcon,
    celda: 'bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:border-slate-500/20',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
    punto: 'bg-slate-400',
    texto: 'text-slate-500 dark:text-slate-400',
  },
}

export const ORDEN_ESTADOS: EstadoDia[] = [
  'asistio',
  'retardo',
  'permiso',
  'sin_salida',
  'sin_entrada',
  'falta',
  'justificada',
  'vacaciones',
  'pendiente',
  'descanso',
]

/** Los días que cuentan como falta (sin registros, o con entrada después de las 9:00) se pueden justificar. */
export const ESTADOS_JUSTIFICABLES: EstadoDia[] = ['falta', 'justificada', 'pendiente']

/** Hoy, ya llegó y todavía no sale: el único caso en el que se le puede dar permiso de salida. */
export function puedePedirPermiso(dia: DiaCalendario) {
  return dia.estado === 'sin_salida' && Boolean(dia.entrada) && dia.permisoSalida?.situacion !== 'usado'
}
