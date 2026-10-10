/*
 * Clases de animación reutilizables (vienen de tw-animate-css y de src/index.css).
 * "motion-safe:" hace que no se animen si la persona activó "reducir movimiento" en su sistema.
 *
 * Regla del diseño "Turno": el movimiento acompaña lo que hace la persona (filtrar, cambiar de mes,
 * elegir un día) y casi todo lo demás solo aparece con un desvanecido corto.
 */

/** Aparece con un desvanecido corto, sin desplazarse. */
export const ENTRADA = 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-safe:fill-mode-both'

/** Para listas: cada elemento entra un poco después del anterior (máximo medio segundo). */
export function retrasoEscalonado(posicion: number) {
  return { animationDelay: `${Math.min(posicion, 12) * 40}ms` }
}

/** Al pasar el mouse solo se marca el borde (sin levantar la tarjeta). */
export const ELEVAR_AL_PASAR = 'transition-colors duration-200 hover:border-foreground/25'

/** Barra que se llena de izquierda a derecha (barras de distribución, bandas de horario). */
export const LLENAR_DESDE_IZQUIERDA = 'bandas-crecen'
