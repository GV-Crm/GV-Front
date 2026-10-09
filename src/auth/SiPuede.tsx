import type { ReactNode } from 'react'
import { usePuede, type Accion, type Recurso } from './permisos'

/**
 * Muestra su contenido solo si el usuario tiene el permiso. Ejemplo:
 *
 *   <SiPuede accion="justificar" recurso="Falta">
 *     <BotonJustificar />
 *   </SiPuede>
 */
export function SiPuede({ accion, recurso, children }: { accion: Accion; recurso: Recurso; children: ReactNode }) {
  return usePuede(accion, recurso) ? children : null
}
