import { pedirJson } from '@/lib/api'

export type Checador = {
  id: number
  /** Número de serie del equipo; así se identifica al conectarse. */
  SN: string
  Nombre: string | null
  /** Si es false, el equipo ya se conectó pero sus marcas todavía no se guardan. */
  Autorizado: boolean
  UltimaConexion: string | null
  IP: string | null
  /** Texto del equipo: "Ver 8.0.4,usuarios,huellas,marcas,IP,..." */
  Info: string | null
  conectado: boolean
}

export type Marca = {
  id: number
  SN: string
  /** Número del usuario dentro del checador. */
  PIN: string
  FechaHora: string
  Estado: number | null
  Verificacion: number | null
}

export type EstadoChecadores = {
  ahora: string
  segundosParaDesconectado: number
  checadores: Checador[]
  marcas: Marca[]
}

/** Requiere el permiso "gestionar Checador". */
export function getChecadores(): Promise<EstadoChecadores> {
  return pedirJson('/api/checadores')
}

export function actualizarChecador(id: number, cambios: { Autorizado?: boolean; Nombre?: string }): Promise<Checador> {
  return pedirJson(`/api/checadores/${id}`, { method: 'PATCH', body: cambios })
}
