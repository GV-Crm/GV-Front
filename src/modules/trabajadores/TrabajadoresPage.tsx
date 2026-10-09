import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarDaysIcon,
  Loader2Icon,
  SearchIcon,
  TriangleAlertIcon,
  UserCogIcon,
  UserMinusIcon,
  UserRoundCheckIcon,
  UsersIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { cambiarActivo } from './api'
import FormularioTrabajador from './FormularioTrabajador'
import { getEmpleados } from '@/modules/asistencias/api'
import { EstatusBadge } from '@/modules/asistencias/componentes'
import { fechaDesdeClave } from '@/modules/asistencias/formatHora'
import type { Empleado } from '@/modules/asistencias/types'
import Avatar from '@/components/Avatar'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import Segmentos from '@/components/Segmentos'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { sinAcentos } from '@/lib/texto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

type Filtro = 'activos' | 'bajas' | 'todos'

const FILTROS: { id: Filtro; nombre: string; icono: typeof UsersIcon }[] = [
  { id: 'activos', nombre: 'Activos', icono: UserRoundCheckIcon },
  { id: 'bajas', nombre: 'Bajas', icono: UserMinusIcon },
  { id: 'todos', nombre: 'Todos', icono: UsersIcon },
]

function fechaIngreso(ingreso: string | null) {
  return ingreso ? format(fechaDesdeClave(ingreso), 'd MMM yyyy', { locale: es }) : 'Sin fecha'
}

/**
 * Un trabajador de la lista. El botón de la derecha da de baja o reactiva;
 * antes de guardar se despliega abajo una confirmación (sin ventanas emergentes).
 */
function FilaTrabajador({ empleado, posicion, onCambio }: { empleado: Empleado; posicion: number; onCambio: (e: Empleado) => void }) {
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

  const textoAccion = darDeBaja ? 'Dar de baja' : 'Reactivar'
  const IconoAccion = darDeBaja ? UserMinusIcon : UserRoundCheckIcon

  return (
    <li style={retrasoEscalonado(posicion)} className={cn(ENTRADA, !empleado.Activo && 'bg-muted/30')}>
      <div className="flex items-center gap-3 p-3 sm:px-4">
        <Avatar nombre={empleado.Nombre} className={cn(!empleado.Activo && 'grayscale')} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{empleado.Nombre}</p>
            <EstatusBadge activo={empleado.Activo} />
          </div>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            {empleado.Area?.trim() || 'Sin área'}
            <span aria-hidden>·</span>
            <CalendarDaysIcon className="size-3" />
            {fechaIngreso(empleado.Ingreso)}
          </p>
        </div>
        {!confirmando && (
          // En el celular solo el ícono; en pantallas grandes, ícono y texto.
          <Button
            variant={darDeBaja ? 'destructive' : 'outline'}
            aria-label={`${textoAccion} a ${empleado.Nombre}`}
            title={textoAccion}
            onClick={() => setConfirmando(true)}
          >
            <IconoAccion data-icon="inline-start" />
            <span className="hidden sm:inline">{textoAccion}</span>
          </Button>
        )}
      </div>

      {confirmando && (
        <div
          className={cn(
            'mx-3 mb-3 rounded-lg border p-3 sm:ml-16',
            darDeBaja
              ? 'border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
            ENTRADA,
          )}
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <TriangleAlertIcon className={cn('size-4', darDeBaja ? 'text-rose-600' : 'text-emerald-600')} />
            ¿{textoAccion} a {empleado.Nombre}?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {darDeBaja
              ? 'Dejará de generar faltas y ya no aparecerá en el resumen de hoy. Su historial se conserva.'
              : 'Volverá a contar en asistencias. Los días laborales sin registro mientras estuvo de baja contarán como faltas.'}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" disabled={enviando} onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button
              disabled={enviando}
              className={darDeBaja ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
              onClick={confirmar}
            >
              {enviando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <IconoAccion data-icon="inline-start" />}
              Sí, {textoAccion.toLowerCase()}
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </li>
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
      <EncabezadoPagina
        icono={UserCogIcon}
        color="bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
        titulo="Trabajadores"
        descripcion="Da de alta a personas nuevas o da de baja a quien ya no trabaja aquí."
        acciones={<FormularioTrabajador areas={areas} onCreado={(nuevo) => setEmpleados((lista) => [...lista, nuevo])} />}
      />

      {!cargando && !error && (
        <div className={cn('flex flex-wrap gap-2 text-sm', ENTRADA)}>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
            <UserRoundCheckIcon className="size-4" />
            {activos} activos
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
            <UserMinusIcon className="size-4" />
            {empleados.length - activos} de baja
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o área"
            className="h-9 bg-card pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Segmentos etiqueta="Filtrar" opciones={FILTROS} valor={filtro} onCambio={setFiltro} className="w-full sm:w-fit" />
      </div>

      {cargando ? (
        <div className="space-y-2 rounded-xl border bg-card p-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">{error}</p>
      ) : visibles.length === 0 ? (
        <div className={cn('flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center', ENTRADA)}>
          <span className="rounded-full bg-muted p-3">
            <UsersIcon className="size-6 text-muted-foreground" />
          </span>
          <p className="text-sm text-muted-foreground">No hay trabajadores con ese filtro.</p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
          {visibles.map((e, i) => (
            <FilaTrabajador key={e.Uuid} empleado={e} posicion={i} onCambio={reemplazar} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default TrabajadoresPage
