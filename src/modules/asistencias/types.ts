export interface Empleado {
  id: number
  Uuid: string
  Nombre: string
  Area: string
  Activo: boolean
  Ingreso: string | null
}

export interface EstadoAsistencia {
  id: number
  Motivo: string
}

export interface Asistencia {
  id: number
  Empleados: Empleado
  HoraEntrada: string | null
  InicioComida: string | null
  FinComida: string | null
  HoraSalida: string | null
  Estado: EstadoAsistencia | null
}

export interface Registro {
  HoraEntrada: string | null
  InicioComida: string | null
  FinComida: string | null
  HoraSalida: string | null
  /** Solo en faltas guardadas por el sistema (no tienen horas). */
  Fecha: string | null
  Estado: EstadoAsistencia | null
}

export interface EmpleadoDetalle {
  Uuid: string
  Nombre: string
  Area: string
  Activo: boolean
  Ingreso: string | null
  Asistencias: Registro[]
}

/** Calculado por el backend (ver `estadoDelDia` en gv-one). */
export type EstadoDia = 'asistio' | 'sin_salida' | 'sin_entrada' | 'falta' | 'justificada' | 'pendiente' | 'descanso'

export interface DiaCalendario {
  fecha: string
  estado: EstadoDia
  registros: Registro[]
}

export interface EmpleadoCalendario {
  id: number
  Uuid: string
  Nombre: string
  Area: string
  Ingreso: string | null
  dias: DiaCalendario[]
}

export interface Calendario {
  hoy: string
  desde: string
  hasta: string
  empleados: EmpleadoCalendario[]
}
