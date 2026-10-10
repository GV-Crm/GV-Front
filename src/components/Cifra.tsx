import { cn } from 'cn'
import { useContador } from '@/hooks/use-contador'

/**
 * Cifra grande con la letra de títulos que "cuenta" desde 0 al aparecer.
 * Acepta textos como "92%" o "5": anima el número y conserva lo demás. Si no empieza con número ("—"), lo muestra tal cual.
 */
function Cifra({ valor, className }: { valor: string | number; className?: string }) {
  const texto = String(valor)
  const partes = texto.match(/^(\d+)(.*)$/)
  const contado = useContador(partes ? Number(partes[1]) : 0)

  return (
    <span className={cn('font-heading font-bold tracking-tight tabular-nums', className)}>
      {partes ? `${contado}${partes[2]}` : texto}
    </span>
  )
}

export default Cifra
