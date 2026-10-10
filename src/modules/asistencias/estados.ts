import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  FileCheckIcon,
  LogInIcon,
  LogOutIcon,
  MoonIcon,
  type LucideIcon,
} from 'lucide-react'
import type { EstadoDia } from './types'

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
    descripcion: 'Día laboral sin ningún registro.',
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
  pendiente: {
    etiqueta: 'Pendiente',
    descripcion: 'Es hoy y todavía no registra nada.',
    icono: ClockIcon,
    celda: 'border-dashed bg-card border-slate-300 dark:border-slate-500/40',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
    punto: 'bg-slate-500',
    texto: 'text-slate-600 dark:text-slate-300',
  },
  descanso: {
    etiqueta: 'Descanso',
    descripcion: 'Sábado o domingo sin registros.',
    icono: MoonIcon,
    celda: 'bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:border-slate-500/20',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
    punto: 'bg-slate-400',
    texto: 'text-slate-500 dark:text-slate-400',
  },
}

export const ORDEN_ESTADOS: EstadoDia[] = [
  'asistio',
  'sin_salida',
  'sin_entrada',
  'falta',
  'justificada',
  'pendiente',
  'descanso',
]

/** Días sin entrada ni salida: los únicos que se pueden marcar (o desmarcar) como falta justificada. */
export const ESTADOS_JUSTIFICABLES: EstadoDia[] = ['falta', 'justificada', 'pendiente']
