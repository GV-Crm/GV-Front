import { useState, type FormEvent } from 'react'
import { FileCheckIcon, Loader2Icon, Undo2Icon } from 'lucide-react'
import { justificarFalta } from './api'
import type { DiaCalendario } from './types'
import { Button } from '@/components/ui/button'

const MAX_MOTIVO = 300

/**
 * Acciones sobre una falta (solo para quien tiene el permiso "justificar Falta"):
 * - Si no está justificada: escribir el motivo y justificarla.
 * - Si ya está justificada: quitar la justificación.
 */
function JustificarFalta({ uuid, dia, onCambio }: { uuid: string; dia: DiaCalendario; onCambio: () => void }) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const justificada = dia.estado === 'justificada'

  async function enviar(justificar: boolean) {
    setEnviando(true)
    setError(null)
    try {
      await justificarFalta(uuid, dia.fecha, justificar, justificar ? motivo.trim() : undefined)
      onCambio()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio')
    } finally {
      setEnviando(false)
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    enviar(true)
  }

  const mensajeError = error && (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  )

  if (justificada) {
    return (
      <div className="space-y-2 border-t pt-4">
        <Button size="lg" variant="outline" className="w-full" disabled={enviando} onClick={() => enviar(false)}>
          {enviando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <Undo2Icon data-icon="inline-start" />}
          Quitar justificación
        </Button>
        {mensajeError}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-t pt-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Motivo de la justificación
        <textarea
          required
          rows={3}
          maxLength={MAX_MOTIVO}
          placeholder="Ej. Incapacidad médica del IMSS"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm font-normal outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <span className="text-right text-xs font-normal text-muted-foreground">
          {motivo.length}/{MAX_MOTIVO}
        </span>
      </label>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={enviando || !motivo.trim()}
      >
        {enviando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <FileCheckIcon data-icon="inline-start" />}
        Justificar falta
      </Button>
      {mensajeError}
    </form>
  )
}

export default JustificarFalta
