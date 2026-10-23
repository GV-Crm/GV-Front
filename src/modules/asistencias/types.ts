export interface Empleado {
  id: number
  Uuid: string
  Nombre: string
  Area: string
  Activo: boolean
  Ingreso: string | null
  /** URL de la foto del trabajador, o null si se muestran sus iniciales. */
  Foto: string | null
  /** ID con el que se registra en el checador (lo genera el sistema). Las marcas traen este número como PIN. */
  PinChecador: number
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
  /** Solo en faltas justificadas: el motivo y quién lo escribió. */
  Justificacion: string | null
  JustificadoPor: string | null
}

export interface EmpleadoDetalle {
  Uuid: string
  Nombre: string
  Area: string
  Activo: boolean
  Ingreso: string | null
  Foto: string | null
  Asistencias: Registro[]
}

/** Calculado por el backend con las reglas del horario (ver src/lib/asistencias/jornada.ts en gv-one). */
export type EstadoDia =
  | 'asistio'
  | 'retardo'
  | 'permiso'
  | 'sin_salida'
  | 'sin_entrada'
  | 'falta'
  | 'justificada'
  | 'vacaciones'
  | 'pendiente'
  | 'descanso'

/** Permiso para salir antes: abre 10 min (autorizadoEn → venceEn) para que cheque su salida. */
export interface PermisoSalida {
  id: number
  autorizadoEn: string
  venceEn: string
  motivo: string | null
  autorizadoPor: string | null
  /** usado: checó dentro de la ventana · activo: todavía puede checar · vencido: pasaron los 10 min sin checar. */
  situacion: 'usado' | 'activo' | 'vencido'
}

/**
 * Solicitud de vacaciones. `Fechas` son los días exactos (laborables), que pueden ser salteados;
 * `Desde`/`Hasta` son el primero y el último; `Dias` = cuántas fechas son.
 */
export interface PeriodoVacaciones {
  id: number
  Desde: string
  Hasta: string
  Fechas: string[]
  Dias: number
  Nota: string | null
  RegistradoPor?: string | null
  RegistradoEn?: string
}

export interface DiaCalendario {
  fecha: string
  estado: EstadoDia
  registros: Registro[]
  /** Entrada y salida de la jornada normal (sin el tiempo extra). Incluyen las marcas del checador. */
  entrada: string | null
  salida: string | null
  /** Todas las checadas del día en orden (registros y checador). */
  checadas: string[]
  /** Minutos después de las 8:00 (0 si llegó a tiempo). */
  minutosTarde: number
  /** Llegó después de las 8:15. Si además fue después de las 8:30, el día es falta. */
  retardo: boolean
  /** Tiempo extra: desde que volvió a checar después de las 18:10 (sábado 14:10). `fin` null = sin cerrar. */
  extra: { inicio: string; fin: string | null } | null
  minutosExtra: number
  /** Periodo de vacaciones que incluye este día, o null. */
  vacaciones: PeriodoVacaciones | null
  /** Permiso de salida del día (el que usó, o el último que se le dio), o null. */
  permisoSalida: PermisoSalida | null
}

export interface TotalesCalendario {
  asistencias: number
  retardos: number
  faltas: number
  vacaciones: number
  permisos: number
  minutosExtra: number
}

export interface EmpleadoCalendario {
  id: number
  Uuid: string
  Nombre: string
  Area: string
  Ingreso: string | null
  /** URL de su foto, o null si se muestran sus iniciales. */
  Foto: string | null
  PinChecador: number
  totales: TotalesCalendario
  /** Periodos de vacaciones que tocan el rango pedido, aunque sean futuros (vacaciones programadas). */
  vacaciones: PeriodoVacaciones[]
  dias: DiaCalendario[]
}

/** Calculado por el backend según la Ley Federal del Trabajo (ver src/lib/empleados/vacaciones.ts en gv-one). */
export interface Vacaciones {
  ingreso: string
  antiguedad: { anios: number; meses: number; dias: number }
  /** Último año de servicio cumplido. null si todavía no cumple 1 año. */
  periodoActual: {
    anioDeServicio: number
    aniversario: string
    disfrutarAntesDe: string
    dias: number
    vencido: boolean
  } | null
  siguiente: { anioDeServicio: number; aniversario: string; dias: number; faltanDias: number }
  /** Días acumulados del año de servicio en curso, en proporción a lo trabajado. */
  proporcionales: number
  prima: { porcentaje: number; diasDeSalario: number }
  /** null si no tiene salario diario capturado o si no puedes verlo (`puedeVerSalario`). */
  montos: { salarioDiario: number; pagoVacaciones: number; primaVacacional: number } | null
  puedeVerSalario: boolean
  /** Ganados por todos sus años cumplidos, tomados (todos los periodos registrados) y los que le quedan. */
  saldo: { ganados: number; tomados: number; disponibles: number }
  /** Periodos registrados, del más reciente al más antiguo. */
  periodos: PeriodoVacaciones[]
  hoy: string
}

export interface Calendario {
  hoy: string
  desde: string
  hasta: string
  empleados: EmpleadoCalendario[]
}
