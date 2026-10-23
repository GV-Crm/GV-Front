import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DoorOpenIcon, Loader2Icon, TimerIcon, XIcon } from 'lucide-react'
import { cn } from 'cn'
import { cancelarPermisoSalida, darPermisoSalida } from './api'
import { ESTADOS, puedePedirPermiso } from './estados'
import { formatHora } from './formatHora'
import type { DiaCalendario } from './types'
import { usePuede } from '@/auth/permisos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** "9:41" a partir de milisegundos. */
function mmss(ms: number) {
  const segundos = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}

/** Cuenta regresiva hasta `venceEn`. Al llegar a 0 llama `onVencido` una vez. */
function CuentaRegresiva({ venceEn, onVencido }: { venceEn: string; onVencido: () => void }) {
  const [ahora, setAhora] = useState(() => Date.now())
  const avisado = useRef(false)
  const restante = Date.parse(venceEn) - ahora

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (restante <= 0 && !avisado.current) {
      avisado.current = true
      onVencido()
    }
  }, [restante, onVencido])

  return <span className="font-mono font-semibold tabular-nums">{mmss(restante)}</span>
}

type Props = {
  uuid: string
  /** Su día de hoy. */
  dia: DiaCalendario
  /** Se llama al dar, cancelar o vencer el permiso, para volver a pedir los datos. */
  onCambio: () => void
  /** Versión chica para las listas del panel de hoy. */
  compacto?: boolean
}

/**
 * Permiso para salir antes. Con el permiso "autorizar Salida", el botón abre 10 minutos para que el trabajador
 * cheque su salida; esa checada queda en el calendario como "Salió con permiso".
 * Mientras el permiso está activo se ve la cuenta regresiva (y se puede cancelar).
 */
function PermisoSalida({ uuid, dia, onCambio, compacto = false }: Props) {
  const puedeAutorizar = usePuede('autorizar', 'Salida')
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const permiso = dia.permisoSalida

  async function dar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await darPermisoSalida(uuid, motivo.trim() || undefined)
      setAbierto(false)
      setMotivo('')
      onCambio()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo dar el permiso')
    } finally {
      setEnviando(false)
    }
  }

  async function cancelar(id: number) {
    setEnviando(true)
    setError(null)
    try {
      await cancelarPermisoSalida(id)
      onCambio()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar')
    } finally {
      setEnviando(false)
    }
  }

  // Permiso activo: cuenta regresiva.
  if (permiso?.situacion === 'activo') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2 text-xs', !compacto && 'text-sm')}>
        <span className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium', ESTADOS.permiso.badge)}>
          <TimerIcon className="size-3.5" />
          Puede checar su salida · <CuentaRegresiva venceEn={permiso.venceEn} onVencido={onCambio} />
        </span>
        {puedeAutorizar && (
          <Button type="button" variant="ghost" size="xs" disabled={enviando} onClick={() => cancelar(permiso.id)}>
            {enviando ? <Loader2Icon className="animate-spin" /> : <XIcon />}
            Cancelar
          </Button>
        )}
        {error && <p className="basis-full text-destructive">{error}</p>}
      </div>
    )
  }

  if (!puedeAutorizar || !puedePedirPermiso(dia)) return null

  if (!abierto) {
    return (
      <Button
        type="button"
        variant="outline"
        size={compacto ? 'xs' : 'sm'}
        title="Darle 10 minutos para checar su salida antes de su hora"
        onClick={() => setAbierto(true)}
      >
        <DoorOpenIcon data-icon="inline-start" />
        Permiso de salida
      </Button>
    )
  }

  return (
    <form onSubmit={dar} className={cn('w-full space-y-2 rounded-lg border p-3', ESTADOS.permiso.celda)}>
      <p className="text-sm font-medium">
        Permiso de salida{dia.entrada && <span className="font-normal text-muted-foreground"> · entró {formatHora(dia.entrada)}</span>}
      </p>
      <Input
        autoFocus
        maxLength={200}
        placeholder="Motivo (opcional), ej. cita médica"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="bg-background"
      />
      <p className="text-xs text-muted-foreground">Tendrá 10 minutos para checar su salida en el checador.</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={enviando} onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={enviando} className="bg-indigo-700 text-white hover:bg-indigo-800">
          {enviando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <DoorOpenIcon data-icon="inline-start" />}
          Habilitar 10 min
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}

export default PermisoSalida
