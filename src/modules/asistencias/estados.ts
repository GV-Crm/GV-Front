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
    icono: CircleCheckIcon,
    celda: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    punto: 'bg-emerald-500',
    texto: 'text-emerald-700 dark:text-emerald-300',
  },
  sin_salida: {
    etiqueta: 'Falta registrar salida',
    icono: LogOutIcon,
    celda: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    punto: 'bg-amber-500',
    texto: 'text-amber-700 dark:text-amber-300',
  },
  sin_entrada: {
    etiqueta: 'Falta registrar entrada',
    icono: LogInIcon,
    celda: 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    punto: 'bg-orange-500',
    texto: 'text-orange-700 dark:text-orange-300',
  },
  falta: {
    etiqueta: 'Falta',
    icono: CircleXIcon,
    celda: 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
    punto: 'bg-rose-500',
    texto: 'text-rose-700 dark:text-rose-300',
  },
  justificada: {
    etiqueta: 'Falta justificada',
    icono: FileCheckIcon,
    celda: 'bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/30',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
    punto: 'bg-violet-500',
    texto: 'text-violet-700 dark:text-violet-300',
  },
  pendiente: {
    etiqueta: 'Pendiente',
    icono: ClockIcon,
    celda: 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/30',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
    punto: 'bg-sky-500',
    texto: 'text-sky-700 dark:text-sky-300',
  },
  descanso: {
    etiqueta: 'Descanso',
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

const COLORES_AVATAR = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300',
]

/** El mismo nombre siempre sale del mismo color. */
export function colorDeAvatar(nombre: string) {
  let hash = 0
  for (const letra of nombre) hash = (hash * 31 + letra.charCodeAt(0)) | 0
  return COLORES_AVATAR[Math.abs(hash) % COLORES_AVATAR.length]
}

export function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('')
}
