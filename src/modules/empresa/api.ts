import { pedirJson } from '@/lib/api'

export type DatosEmpresa = {
  RazonSocial: string | null
  NombreComercial: string | null
  RFC: string | null
  RegimenFiscal: string | null
  RegistroPatronal: string | null
  DomicilioFiscal: string | null
  CodigoPostal: string | null
  Telefono: string | null
  Correo: string | null
  RepresentanteLegal: string | null
  /** Porcentaje de prima vacacional (mínimo 25% por ley). */
  PrimaVacacional: number
}

export type EmpresaGuardada = DatosEmpresa & { ActualizadoEn: string | null; ActualizadoPor: string | null }

/** Requiere el permiso "ver Empresa" (o "editar Empresa"). */
export function getEmpresa(): Promise<EmpresaGuardada | null> {
  return pedirJson('/api/empresa')
}

/** Reemplaza todos los datos. Requiere el permiso "editar Empresa". */
export function guardarEmpresa(datos: DatosEmpresa): Promise<EmpresaGuardada> {
  return pedirJson('/api/empresa', { method: 'PUT', body: datos })
}
