import { useState } from 'react'
import { CheckIcon, Loader2Icon, XIcon } from 'lucide-react'
import { crearArea, type Area } from './api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const NUEVA = '__nueva__'

type Props = {
  areas: Area[]
  valor: string
  onCambio: (nombre: string) => void
  /** Se llama con el área recién agregada al catálogo, para sumarla a la lista. */
  onAreaCreada: (area: Area) => void
  disabled?: boolean
}

/**
 * Lista para elegir el área del trabajador. La última opción, "+ Agregar nueva área…", muestra un campo
 * para escribirla: se guarda en el catálogo y queda elegida.
 */
function SelectorArea({ areas, valor, onCambio, onAreaCreada, disabled }: Props) {
  const [agregando, setAgregando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Si el trabajador tiene un área que ya no está en el catálogo, se muestra igual para no perderla.
  const fueraDelCatalogo = valor && !areas.some((a) => a.Nombre === valor)

  async function agregar() {
    setGuardando(true)
    setError(null)
    try {
      const area = await crearArea(nombre)
      onAreaCreada(area)
      onCambio(area.Nombre)
      setAgregando(false)
      setNombre('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el área')
    } finally {
      setGuardando(false)
    }
  }

  if (agregando) {
    return (
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            autoFocus
            maxLength={60}
            placeholder="Nombre de la nueva área"
            value={nombre}
            disabled={guardando}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              // Enter agrega el área sin enviar el formulario del trabajador.
              if (e.key === 'Enter') {
                e.preventDefault()
                if (nombre.trim()) agregar()
              }
            }}
          />
          <Button type="button" size="icon" aria-label="Agregar área" title="Agregar" disabled={guardando || !nombre.trim()} onClick={agregar}>
            {guardando ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cancelar"
            title="Cancelar"
            disabled={guardando}
            onClick={() => {
              setAgregando(false)
              setError(null)
            }}
          >
            <XIcon />
          </Button>
        </div>
        {error && <p className="text-xs font-normal text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <select
      required
      disabled={disabled}
      value={valor}
      onChange={(e) => {
        if (e.target.value === NUEVA) setAgregando(true)
        else onCambio(e.target.value)
      }}
      className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
    >
      <option value="" disabled>
        Elige un área
      </option>
      {fueraDelCatalogo && <option value={valor}>{valor}</option>}
      {areas.map((a) => (
        <option key={a.id} value={a.Nombre}>
          {a.Nombre}
        </option>
      ))}
      <option value={NUEVA}>＋ Agregar nueva área…</option>
    </select>
  )
}

export default SelectorArea
