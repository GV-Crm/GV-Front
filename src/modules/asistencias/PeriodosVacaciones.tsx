import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { es } from 'date-fns/locale'
import { CalendarPlusIcon, CalendarRangeIcon, ListChecksIcon, Loader2Icon, PalmtreeIcon, Trash2Icon, TriangleAlertIcon, XIcon } from 'lucide-react'
import { cn } from 'cn'
import { quitarVacaciones, registrarVacaciones } from './api'
import { claveFecha, describirFechas, diasLaborablesEntre, fechaDesdeClave } from './formatHora'
import type { PeriodoVacaciones, Vacaciones } from './types'
import { usePuede } from '@/auth/permisos'
import Segmentos from '@/components/Segmentos'
import { ENTRADA } from '@/lib/animaciones'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'

const textoDias = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`

type Modo = 'seguidos' | 'salteados'
const MODOS = [
  { id: 'seguidos', nombre: 'Días seguidos', icono: CalendarRangeIcon },
  { id: 'salteados', nombre: 'Días salteados', icono: ListChecksIcon },
] as const

function etapa(periodo: PeriodoVacaciones, hoy: string) {
  if (periodo.Desde > hoy) return { texto: 'Programadas', clase: 'bg-teal-100 text-teal-900 dark:bg-teal-500/20 dark:text-teal-200' }
  if (periodo.Hasta >= hoy) return { texto: 'En curso', clase: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' }
  return { texto: 'Tomadas', clase: 'bg-muted text-muted-foreground' }
}

function FilaPeriodo({ periodo, hoy, onQuitado }: { periodo: PeriodoVacaciones; hoy: string; onQuitado: () => void }) {
  const puedeGestionar = usePuede('gestionar', 'Vacaciones')
  const [confirmando, setConfirmando] = useState(false)
  const [quitando, setQuitando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { texto, clase } = etapa(periodo, hoy)

  async function quitar() {
    setQuitando(true)
    setError(null)
    try {
      await quitarVacaciones(periodo.id)
      onQuitado()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar')
      setQuitando(false)
    }
  }

  return (
    <li className={cn('p-3 sm:px-4', ENTRADA)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200">
          <PalmtreeIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <span className="first-letter:uppercase">{describirFechas(periodo.Fechas)}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', clase)}>{texto}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {textoDias(periodo.Dias)} laborables{periodo.RegistradoPor && ` · registró ${periodo.RegistradoPor}`}
          </p>
          {periodo.Nota && <p className="mt-1 text-xs break-words">{periodo.Nota}</p>}
        </div>
        {puedeGestionar && !confirmando && (
          <Button variant="ghost" size="icon-sm" aria-label="Quitar este periodo" title="Quitar" onClick={() => setConfirmando(true)}>
            <Trash2Icon />
          </Button>
        )}
      </div>

      {confirmando && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 sm:ml-11 dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-sm font-medium">¿Quitar estas vacaciones?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Esos días vuelven a contar normal: si no checó, aparecerán como falta.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={quitando} onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button size="sm" disabled={quitando} className="bg-red-700 text-white hover:bg-red-800" onClick={quitar}>
              {quitando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <Trash2Icon data-icon="inline-start" />}
              Sí, quitar
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </li>
  )
}

type PropsFormulario = {
  uuid: string
  /** Días disponibles: el máximo que se puede pedir. Mayor a 0. */
  maximo: number
  /** Fecha de ingreso: antes de ella no se pueden pedir vacaciones. */
  ingreso: string
  /** Días que ya están en otra solicitud suya. */
  ocupados: Set<string>
  onRegistrado: () => void
}

/** "lun 26 oct" */
const diaCorto = (clave: string) => fechaDesdeClave(clave).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

function AvisoMaximo({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

function FormularioPeriodo({ uuid, maximo, ingreso, ocupados, onRegistrado }: PropsFormulario) {
  const [modo, setModo] = useState<Modo>('seguidos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [salteados, setSalteados] = useState<string[]>([])
  // Se muestra cuando se recortó el rango o se intentó marcar un día de más.
  const [recortado, setRecortado] = useState(false)
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Los días que se van a pedir: los laborables del rango, o los que se marcaron uno por uno.
  const fechas = modo === 'seguidos' ? diasLaborablesEntre(desde, hasta) : salteados
  const yaPedidos = fechas.filter((f) => ocupados.has(f))
  const antesDeIngreso = fechas.length > 0 && fechas[0] < ingreso
  const dias = fechas.length
  const enElMaximo = dias >= maximo
  const seleccionados = useMemo(() => salteados.map(fechaDesdeClave), [salteados])

  /** Días seguidos: si el rango pasa del máximo, la fecha final se recorta al último día permitido. */
  function cambiarRango(nuevoDesde: string, nuevoHasta: string) {
    const hastaValido = !nuevoHasta || nuevoHasta < nuevoDesde ? nuevoDesde : nuevoHasta
    const laborables = diasLaborablesEntre(nuevoDesde, hastaValido)
    const pasa = laborables.length > maximo
    setDesde(nuevoDesde)
    setHasta(pasa ? laborables[maximo - 1] : hastaValido)
    setRecortado(pasa)
  }

  /** Días salteados: no deja marcar más del máximo. */
  function cambiarSalteados(elegidos: Date[] | undefined) {
    const claves = (elegidos ?? []).map(claveFecha).sort()
    if (claves.length > maximo) {
      setRecortado(true)
      return
    }
    setSalteados(claves)
    setRecortado(false)
  }

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo)
    setRecortado(false)
  }

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await registrarVacaciones(uuid, fechas, nota.trim() || undefined)
      onRegistrado()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron registrar las vacaciones')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={registrar} className="space-y-3">
      <Segmentos etiqueta="Cómo las pidió" opciones={MODOS} valor={modo} onCambio={cambiarModo} className="w-full" />
      <p className="text-xs text-muted-foreground">
        Puede pedir hasta <span className="font-semibold text-foreground">{textoDias(maximo)}</span> (los que tiene disponibles).
      </p>

      {modo === 'seguidos' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Desde
            <Input type="date" required min={ingreso} value={desde} onChange={(e) => cambiarRango(e.target.value, hasta)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Hasta (incluido)
            <Input
              type="date"
              required
              disabled={!desde}
              min={desde || ingreso}
              value={hasta}
              onChange={(e) => cambiarRango(desde, e.target.value)}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Toca cada día que pidió. Los domingos y los días que ya tiene pedidos no se pueden elegir.
          </p>
          <Calendar
            mode="multiple"
            locale={es}
            weekStartsOn={1}
            selected={seleccionados}
            onSelect={cambiarSalteados}
            disabled={[
              { dayOfWeek: [0] },
              { before: fechaDesdeClave(ingreso) },
              (dia) => ocupados.has(claveFecha(dia)),
              // En el máximo solo se pueden quitar días, no marcar nuevos.
              (dia) => enElMaximo && !salteados.includes(claveFecha(dia)),
            ]}
            className="mx-auto rounded-lg border p-3 [--cell-size:--spacing(9)]"
          />
          {salteados.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {salteados.map((f) => (
                <li key={f}>
                  <button
                    type="button"
                    onClick={() => {
                      setSalteados(salteados.filter((x) => x !== f))
                      setRecortado(false)
                    }}
                    aria-label={`Quitar ${describirFechas([f])}`}
                    className="flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900 hover:bg-teal-200 dark:bg-teal-500/20 dark:text-teal-200"
                  >
                    {diaCorto(f)}
                    <XIcon className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Nota (opcional)
        <Input maxLength={300} placeholder="Ej. las pidió por escrito el 15 de octubre" value={nota} onChange={(e) => setNota(e.target.value)} />
      </label>

      {dias > 0 && (
        <p className="text-sm">
          Son <span className="font-semibold">{textoDias(dias)}</span>
          {modo === 'seguidos' ? ' laborables (de lunes a sábado; los domingos no cuentan).' : `: ${describirFechas(fechas)}.`}
        </p>
      )}
      {yaPedidos.length > 0 && (
        <p className="text-sm text-destructive">
          {describirFechas(yaPedidos)} ya {yaPedidos.length === 1 ? 'está pedido' : 'están pedidos'} en otra solicitud.
        </p>
      )}
      {antesDeIngreso && <p className="text-sm text-destructive">Hay días antes de su fecha de ingreso.</p>}
      {recortado && modo === 'seguidos' && (
        <AvisoMaximo>
          Se colocó el máximo de días ({textoDias(maximo)}): el periodo termina el {diaCorto(hasta)}. No le quedan más días
          disponibles.
        </AvisoMaximo>
      )}
      {enElMaximo && modo === 'salteados' && (
        <AvisoMaximo>
          Se colocó el máximo de días ({textoDias(maximo)}). Para cambiar un día, quita primero uno de los elegidos.
        </AvisoMaximo>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={enviando || dias === 0 || yaPedidos.length > 0 || antesDeIngreso}>
          {enviando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <CalendarPlusIcon data-icon="inline-start" />}
          Registrar vacaciones
        </Button>
      </div>
    </form>
  )
}

/**
 * Saldo de vacaciones, registro de los periodos que pide el trabajador y la lista de los ya registrados.
 * Registrar y quitar requieren el permiso "gestionar Vacaciones". En el calendario esos días quedan como
 * "Vacaciones" en vez de falta.
 */
function PeriodosVacaciones({ uuid, datos, onCambio }: { uuid: string; datos: Vacaciones; onCambio: () => void }) {
  const puedeGestionar = usePuede('gestionar', 'Vacaciones')
  const { ganados, tomados, disponibles } = datos.saldo
  const ocupados = useMemo(() => new Set(datos.periodos.flatMap((p) => p.Fechas)), [datos.periodos])

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <section className={cn('space-y-4 rounded-xl border bg-card p-4', ENTRADA)}>
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Saldo de vacaciones</h2>
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <dt className="text-xs text-muted-foreground">Ganadas</dt>
            <dd className="text-xl font-bold tabular-nums">{ganados}</dd>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <dt className="text-xs text-muted-foreground">Pedidas</dt>
            <dd className="text-xl font-bold tabular-nums">{tomados}</dd>
          </div>
          <div className={cn('rounded-lg p-2', disponibles < 0 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-teal-100 dark:bg-teal-500/20')}>
            <dt className="text-xs text-muted-foreground">Disponibles</dt>
            <dd className="text-xl font-bold tabular-nums">{disponibles}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Ganadas: la suma de todos sus años cumplidos. Pedidas: todos los periodos registrados, incluidos los
          programados. No se pueden pedir más días de los disponibles.
        </p>

        {puedeGestionar ? (
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold">Registrar vacaciones que pidió</h3>
            {disponibles > 0 ? (
              <FormularioPeriodo
                uuid={uuid}
                maximo={disponibles}
                ingreso={datos.ingreso}
                ocupados={ocupados}
                onRegistrado={onCambio}
              />
            ) : (
              <AvisoMaximo>
                No tiene días de vacaciones disponibles:{' '}
                {datos.antiguedad.anios === 0
                  ? `todavía no cumple 1 año. Gana sus primeros ${textoDias(datos.siguiente.dias)} el ${describirFechas([datos.siguiente.aniversario])}.`
                  : `ya pidió todos los que ha ganado. En su próximo aniversario (${describirFechas([datos.siguiente.aniversario])}) gana ${textoDias(datos.siguiente.dias)} más.`}
              </AvisoMaximo>
            )}
          </div>
        ) : (
          <p className="border-t pt-3 text-xs text-muted-foreground">
            Para registrar vacaciones se necesita el permiso "Registrar vacaciones de los trabajadores".
          </p>
        )}
      </section>

      <section className={cn('overflow-hidden rounded-xl border bg-card', ENTRADA)}>
        <h2 className="border-b px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Periodos registrados
        </h2>
        {datos.periodos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Todavía no tiene vacaciones registradas.</p>
        ) : (
          <ul className="divide-y">
            {datos.periodos.map((p) => (
              <FilaPeriodo key={p.id} periodo={p} hoy={datos.hoy} onQuitado={onCambio} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default PeriodosVacaciones
