export interface Empleado {
  id: number
  Uuid: string
  Nombre: string
  Area: string
  Activo: boolean
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

export interface EmpleadoDetalle {
  Nombre: string
  Area: string
  Asistencias: { HoraEntrada: string | null; InicioComida: string | null; FinComida: string | null; HoraSalida: string | null; Estado: EstadoAsistencia | null }[]
}
