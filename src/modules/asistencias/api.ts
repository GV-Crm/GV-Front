import type { Asistencia, Empleado, EmpleadoDetalle } from './types'

export async function getAsistencias(): Promise<Asistencia[]> {
  const res = await fetch('http://localhost:3000/api/asistencias')
  return res.json()
}

export async function getEmpleados(): Promise<Empleado[]> {
  const res = await fetch('http://localhost:3000/api/empleados')
  return res.json()
}

export async function getDetalles(uuid: string): Promise<EmpleadoDetalle> {
  const res = await fetch(`http://localhost:3000/api/empleados/${uuid}`)
  return res.json()
}
