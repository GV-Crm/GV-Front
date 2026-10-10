import { flushSync } from 'react-dom'

/**
 * Hace un cambio en pantalla con animación de "reacomodo": los elementos que tienen
 * `viewTransitionName` se deslizan de su lugar viejo al nuevo (View Transitions del navegador).
 *
 *   conTransicion(() => setFiltro('bajas'))
 *
 * Si el navegador no lo soporta, o la persona pidió "reducir movimiento", el cambio se hace sin animación.
 */
export function conTransicion(cambio: () => void) {
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || sinMovimiento) {
    cambio()
    return
  }
  // flushSync aplica el cambio de React de inmediato, para que el navegador vea el "después".
  document.startViewTransition(() => flushSync(cambio))
}
