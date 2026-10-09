import { useState } from 'react'
import { FileCheckIcon, Loader2Icon, Undo2Icon } from 'lucide-react'
import { justificarFalta } from './api'
import type { DiaCalendario } from './types'
import { Button } from '@/components/ui/button'

function JustificarFalta({ uuid, dia, onCambio }: { uuid: string; dia: DiaCalendario; onCambio: () => void }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const justificada = dia.estado === 'justificada'

  async function cambiar() {
    setEnviando(true)
    setError(null)
    try {
      await justificarFalta(uuid, dia.fecha, !justificada)
      onCambio()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio')
    } finally {
      setEnviando(false)
    }
  }

  const Icono = enviando ? Loader2Icon : justificada ? Undo2Icon : FileCheckIcon

  return (
    <div className="space-y-2 border-t pt-4">
      <Button
        size="lg"
        variant={justificada ? 'outline' : 'default'}
        className={justificada ? 'w-full' : 'w-full bg-violet-600 text-white hover:bg-violet-700'}
        disabled={enviando}
        onClick={cambiar}
      >
        <Icono data-icon="inline-start" className={enviando ? 'animate-spin' : undefined} />
        {justificada ? 'Quitar justificación' : 'Marcar como falta justificada'}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default JustificarFalta
