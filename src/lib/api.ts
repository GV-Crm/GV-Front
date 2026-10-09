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

/**
 * Evento que se lanza cuando el backend niega algo por permisos (403).
 * AuthProvider lo escucha para volver a pedir los permisos: si a alguien le quitaron uno,
 * el menú y los botones se actualizan solos.
 */
export const EVENTO_PERMISO_NEGADO = 'gv:permiso-negado'

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

  // /api/yo es justo la ruta que pide los permisos: avisar desde ahí haría un ciclo infinito.
  if (res.status === 403 && ruta !== '/api/yo') window.dispatchEvent(new Event(EVENTO_PERMISO_NEGADO))

  const cuerpo = await res.json().catch(() => null)
  if (!res.ok) throw new ErrorApi(cuerpo?.error ?? `Error ${res.status} del servidor`, res.status)
  return cuerpo as T
}
