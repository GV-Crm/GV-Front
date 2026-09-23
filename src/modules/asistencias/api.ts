import type { Asistencia, Empleado, EmpleadoDetalle } from './types'

function apiUrl(ruta: string): string {
  const base = import.meta.env.VITE_API_URL
  if (!base) throw new Error('Falta VITE_API_URL (URL del backend) en el .env o en las variables de Vercel')
  return `${base.replace(/\/$/, '')}${ruta}`
}

export async function getAsistencias(): Promise<Asistencia[]> {
  const res = await fetch(apiUrl('/api/asistencias'))
  return res.json()
}

export async function getEmpleados(): Promise<Empleado[]> {
  const res = await fetch(apiUrl('/api/empleados'))
  return res.json()
}

export async function getDetalles(uuid: string): Promise<EmpleadoDetalle> {
  const res = await fetch(apiUrl(`/api/empleados/${uuid}`))
  return res.json()
}
