import { supabase } from '@/lib/supabase'

export class ErrorApi extends Error {
  readonly status: number

  constructor(mensaje: string, status: number) {
    super(mensaje)
    this.status = status
  }
}

function apiUrl(ruta: string): string {
  const base = import.meta.env.VITE_API_URL
  if (!base) throw new Error('Falta VITE_API_URL (URL del backend) en el .env o en las variables de Vercel')
  return `${base.replace(/\/$/, '')}${ruta}`
}

/** Llama al backend con el token de la sesión. Lanza `ErrorApi` con el mensaje del backend si la respuesta no es 2xx. */
export async function pedirJson<T>(ruta: string, opciones: { method?: string; body?: unknown } = {}): Promise<T> {
  // getSession refresca el token si ya expiró.
  const { data } = await supabase.auth.getSession()
  const res = await fetch(apiUrl(ruta), {
    method: opciones.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      ...(opciones.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
  })

  if (res.status === 401) {
    // Sesión inválida en el backend (p. ej. usuario eliminado): al cerrarla, la app regresa al login.
    await supabase.auth.signOut()
    throw new ErrorApi('La sesión expiró. Vuelve a iniciar sesión.', 401)
  }

  const cuerpo = await res.json().catch(() => null)
  if (!res.ok) throw new ErrorApi(cuerpo?.error ?? `Error ${res.status} del servidor`, res.status)
  return cuerpo as T
}
