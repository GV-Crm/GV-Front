import { pedirJson } from '@/lib/api'

/** Cambia el nombre de tu propia cuenta. */
export function cambiarMiNombre(nombre: string): Promise<unknown> {
  return pedirJson('/api/yo', { method: 'PATCH', body: { Nombre: nombre } })
}

/** Sube tu foto. `imagen` es el "data:image/webp;base64,..." que da prepararFotoDePerfil (src/lib/imagen.ts). */
export function subirMiFoto(imagen: string): Promise<{ avatar: string }> {
  return pedirJson('/api/yo/avatar', { method: 'POST', body: { imagen } })
}

/** Quita tu foto; vuelven a mostrarse tus iniciales. */
export function quitarMiFoto(): Promise<{ avatar: null }> {
  return pedirJson('/api/yo/avatar', { method: 'DELETE' })
}
