import { useEffect, useState } from 'react'

/**
 * Número que "cuenta" desde 0 hasta `valor` en `duracionMs` (como en el tablero de la maqueta Turno).
 * Si la persona pidió "reducir movimiento", devuelve el valor de una vez.
 *
 *   const total = useContador(5)   // 0, 1, 2 … 5
 */
export function useContador(valor: number, duracionMs = 900): number {
  const [mostrado, setMostrado] = useState(0)

  useEffect(() => {
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const inicio = performance.now()
    let cuadro = 0

    const paso = (ahora: number) => {
      const avance = sinMovimiento ? 1 : Math.min(1, (ahora - inicio) / duracionMs)
      // Arranca rápido y frena al final.
      const suavizado = 1 - Math.pow(1 - avance, 3)
      setMostrado(Math.round(valor * suavizado))
      if (avance < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor, duracionMs])

  return mostrado
}
