import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2Icon, SearchIcon, UserMinusIcon, UserRoundCheckIcon, UsersIcon } from 'lucide-react'
import { cn } from 'cn'
import { cambiarActivo } from './api'
import FormularioTrabajador from './FormularioTrabajador'
import { getEmpleados } from '@/modules/asistencias/api'
import { AvatarEmpleado, EstatusBadge } from '@/modules/asistencias/componentes'
import { fechaDesdeClave } from '@/modules/asistencias/formatHora'
import type { Empleado } from '@/modules/asistencias/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

type Filtro = 'activos' | 'bajas' | 'todos'

const FILTROS: { id: Filtro; nombre: string }[] = [
  { id: 'activos', nombre: 'Activos' },
  { id: 'bajas', nombre: 'Bajas' },
  { id: 'todos', nombre: 'Todos' },
]

const sinAcentos = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

function fechaIngreso(ingreso: string | null) {
  return ingreso ? format(fechaDesdeClave(ingreso), 'd MMM yyyy', { locale: es }) : 'Sin fecha'
}

/** Botón de baja/reactivación con confirmación en el mismo lugar (sin ventanas emergentes). */
function AccionEstatus({ empleado, onCambio }: { empleado: Empleado; onCambio: (e: Empleado) => void }) {
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const darDeBaja = empleado.Activo

  async function confirmar() {
    setEnviando(true)
    setError(null)
    try {
      onCambio(await cambiarActivo(empleado.Uuid, !darDeBaja))
      setConfirmando(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio')
    } finally {
      setEnviando(false)
    }
  }

  if (!confirmando) {
    return (
      <Button
        variant={darDeBaja ? 'destructive' : 'outline'}
        onClick={(e) => {
          e.stopPropagation()
          setConfirmando(true)
        }}
      >
        {darDeBaja ? <UserMinusIcon data-icon="inline-start" /> : <UserRoundCheckIcon data-icon="inline-start" />}
        {darDeBaja ? 'Dar de baja' : 'Reactivar'}
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
      <p className="text-xs text-muted-foreground sm:text-right">
        {darDeBaja
          ? 'Dejará de generar faltas y no aparecerá en el resumen de hoy.'
          : 'Los días laborales sin registro mientras estuvo de baja contarán como faltas.'}
      </p>
      <div className="flex gap-2 sm:justify-end">
        <Button variant="ghost" disabled={enviando} onClick={() => setConfirmando(false)}>
          Cancelar
        </Button>
        <Button
          disabled={enviando}
          className={darDeBaja ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
          onClick={confirmar}
        >
          {enviando && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
          {darDeBaja ? 'Confirmar baja' : 'Confirmar'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function TrabajadoresPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('activos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    getEmpleados()
      .then(setEmpleados)
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  const areas = useMemo(
    () => [...new Set(empleados.map((e) => e.Area?.trim()).filter(Boolean))].sort(),
    [empleados],
  )
  const activos = empleados.filter((e) => e.Activo).length

  const visibles = useMemo(() => {
    const texto = sinAcentos(busqueda.trim())
    return empleados
      .filter((e) => (filtro === 'todos' ? true : filtro === 'activos' ? e.Activo : !e.Activo))
      .filter((e) => !texto || sinAcentos(`${e.Nombre} ${e.Area ?? ''}`).includes(texto))
      .sort((a, b) => a.Nombre.localeCompare(b.Nombre))
  }, [empleados, filtro, busqueda])

  const reemplazar = (actualizado: Empleado) =>
    setEmpleados((lista) => lista.map((e) => (e.Uuid === actualizado.Uuid ? actualizado : e)))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Trabajadores</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-emerald-700 dark:text-emerald-300">{activos} activos</span>
            {' · '}
            <span>{empleados.length - activos} de baja</span>
          </p>
        </div>
        <FormularioTrabajador areas={areas} onCreado={(nuevo) => setEmpleados((lista) => [...lista, nuevo])} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o área"
            className="h-9 pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div role="tablist" aria-label="Filtrar" className="flex w-fit rounded-lg border bg-muted/60 p-0.5">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filtro === f.id ? 'bg-background shadow-xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.nombre}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="space-y-2 rounded-xl border p-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">{error}</p>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
          <UsersIcon className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No hay trabajadores con ese filtro.</p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
          {visibles.map((e) => (
            <li
              key={e.Uuid}
              className={cn(
                'flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4',
                !e.Activo && 'bg-muted/30',
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <AvatarEmpleado nombre={e.Nombre} className={cn(!e.Activo && 'grayscale')} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{e.Nombre}</p>
                    <EstatusBadge activo={e.Activo} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.Area?.trim() || 'Sin área'} · Ingreso {fechaIngreso(e.Ingreso)}
                  </p>
                </div>
              </div>
              <AccionEstatus empleado={e} onCambio={reemplazar} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TrabajadoresPage
