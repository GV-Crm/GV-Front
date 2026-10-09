/*
 * Clases de animación reutilizables (vienen de tw-animate-css).
 * "motion-safe:" hace que no se animen si la persona activó "reducir movimiento" en su sistema.
 */

/** Aparece desde abajo con un desvanecido suave. */
export const ENTRADA =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both'

/** Para listas: cada elemento entra un poco después del anterior (máximo medio segundo). */
export function retrasoEscalonado(posicion: number) {
  return { animationDelay: `${Math.min(posicion, 12) * 40}ms` }
}

/** Tarjeta que se eleva un poco al pasar el mouse. */
export const ELEVAR_AL_PASAR = 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'
