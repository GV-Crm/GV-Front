import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowDownUpIcon,
  CalendarDaysIcon,
  Loader2Icon,
  ScanFaceIcon,
  SearchIcon,
  TriangleAlertIcon,
  UserCogIcon,
  UserMinusIcon,
  UserRoundCheckIcon,
  UsersIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { cambiarActivo, getAreas, type Area } from './api'
import AsistenciaHoy from './AsistenciaHoy'
import DatosPersonalesTrabajador from './DatosPersonalesTrabajador'
import EditarTrabajador from './EditarTrabajador'
import FormularioTrabajador from './FormularioTrabajador'
import GestionAreas from './GestionAreas'
import { usePuede } from '@/auth/permisos'
import { SiPuede } from '@/auth/SiPuede'
import { getCalendario, getEmpleados } from '@/modules/asistencias/api'
import { EstatusBadge } from '@/modules/asistencias/componentes'
import { fechaDesdeClave } from '@/modules/asistencias/formatHora'
import type { DiaCalendario, Empleado } from '@/modules/asistencias/types'
import Avatar from '@/components/Avatar'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import Segmentos from '@/components/Segmentos'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { conTransicion } from '@/lib/transicion'
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

type Orden = 'nombre' | 'id' | 'ingreso_reciente' | 'ingreso_antiguo'

const ORDENES: { id: Orden; nombre: string }[] = [
  { id: 'nombre', nombre: 'Nombre (A–Z)' },
  { id: 'id', nombre: 'ID del checador' },
  { id: 'ingreso_reciente', nombre: 'Ingreso: más recientes' },
  { id: 'ingreso_antiguo', nombre: 'Ingreso: más antiguos' },
]

/** '' = cualquier fecha · 'mes' = este mes · 'sin' = sin fecha de ingreso · '2025' = ese año. */
type FiltroIngreso = string

const CLASES_SELECT =
  'h-9 min-w-0 rounded-lg border border-input bg-card px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

/** Ordena por `orden`; los que no tienen fecha de ingreso van al final, y los empates por nombre. */
function comparar(orden: Orden) {
  return (a: Empleado, b: Empleado) => {
    const porNombre = a.Nombre.localeCompare(b.Nombre, 'es')
    if (orden === 'id') return a.PinChecador - b.PinChecador
    if (orden === 'nombre') return porNombre
    if (!a.Ingreso || !b.Ingreso) return Number(!a.Ingreso) - Number(!b.Ingreso) || porNombre
    const porFecha = a.Ingreso.localeCompare(b.Ingreso)
    return (orden === 'ingreso_reciente' ? -porFecha : porFecha) || porNombre
  }
}

function cumpleIngreso(ingreso: string | null, filtro: FiltroIngreso, mesActual: string) {
  if (!filtro) return true
  if (filtro === 'sin') return !ingreso
  if (!ingreso) return false
  return filtro === 'mes' ? ingreso.startsWith(mesActual) : ingreso.startsWith(`${filtro}-`)
}

function fechaIngreso(ingreso: string | null) {
  return ingreso ? format(fechaDesdeClave(ingreso), 'd MMM yyyy', { locale: es }) : 'Sin fecha'
}

type PropsFila = {
  empleado: Empleado
  posicion: number
  areas: Area[]
  onAreaCreada: (area: Area) => void
  onCambio: (e: Empleado) => void
  /** Su asistencia de hoy (solo trabajadores activos y con el permiso "ver Asistencia"). */
  hoy?: DiaCalendario
}

/**
 * Un trabajador de la lista. A la derecha:
 * - Lápiz para editar su perfil (permiso "editar Empleado").
 * - Botón para dar de baja o reactivar (permiso "gestionar Empleado"); antes de guardar
 *   se despliega abajo una confirmación (sin ventanas emergentes).
 */
function FilaTrabajador({ empleado, posicion, areas, onAreaCreada, onCambio, hoy }: PropsFila) {
  const puedeDarDeBaja = usePuede('gestionar', 'Empleado')
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
    <li
      // Nombre único por fila: con él, la fila se desliza a su nuevo lugar al filtrar (ver src/lib/transicion.ts).
      style={{ ...retrasoEscalonado(posicion), viewTransitionName: `trabajador-${empleado.Uuid}` }}
      className={cn(ENTRADA, !empleado.Activo && 'bg-muted/30')}>
      <div className="flex items-center gap-3 p-3 sm:px-4">
        <Avatar nombre={empleado.Nombre} foto={empleado.Foto} className={cn(COLOR_SECCION.personas.suave, !empleado.Activo && 'grayscale')} />
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
            <span aria-hidden>·</span>
            <ScanFaceIcon className="size-3" />
            <span title="ID en el checador" className="font-mono">
              {empleado.PinChecador}
            </span>
          </p>
          {hoy && <AsistenciaHoy dia={hoy} className="mt-0.5" />}
        </div>
        <SiPuede accion="gestionar" recurso="DatosPersonales">
          <DatosPersonalesTrabajador empleado={empleado} />
        </SiPuede>
        <SiPuede accion="editar" recurso="Empleado">
          <EditarTrabajador empleado={empleado} areas={areas} onAreaCreada={onAreaCreada} onCambio={onCambio} hoy={hoy} />
        </SiPuede>
        {puedeDarDeBaja && !confirmando && (
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
              ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
            ENTRADA,
          )}
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <TriangleAlertIcon className={cn('size-4', darDeBaja ? 'text-red-700' : 'text-emerald-600')} />
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
              className={darDeBaja ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-emerald-700 text-white hover:bg-emerald-800'}
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
  const [orden, setOrden] = useState<Orden>('nombre')
  const [filtroIngreso, setFiltroIngreso] = useState<FiltroIngreso>('')
  const puedeVerAsistencia = usePuede('ver', 'Asistencia')
  const puedeGestionar = usePuede('gestionar', 'Empleado')
  const puedeEditar = usePuede('editar', 'Empleado')
  // Asistencia de hoy de cada trabajador activo, por Uuid.
  const [hoyPorEmpleado, setHoyPorEmpleado] = useState<Map<string, DiaCalendario>>(new Map())

  useEffect(() => {
    getEmpleados()
      .then(setEmpleados)
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (!puedeVerAsistencia) return
    // Es complementario: si falla, la lista se muestra igual, sin la asistencia de hoy.
    getCalendario()
      .then((c) => setHoyPorEmpleado(new Map(c.empleados.flatMap((e) => (e.dias[0] ? [[e.Uuid, e.dias[0]] as const] : [])))))
      .catch((err) => console.error('Error al obtener la asistencia de hoy:', err))
  }, [puedeVerAsistencia])

  // Catálogo de áreas. El conteo de trabajadores se recalcula aquí para que siga al día al dar altas, bajas o cambios.
  const [catalogoAreas, setCatalogoAreas] = useState<Area[]>([])
  useEffect(() => {
    getAreas()
      .then(setCatalogoAreas)
      .catch((err) => console.error('Error al obtener las áreas:', err))
  }, [])
  const areas = useMemo(() => {
    const clave = (nombre: string | null) => (nombre ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
    return catalogoAreas.map((a) => ({
      ...a,
      trabajadores: empleados.filter((e) => e.Activo && clave(e.Area) === clave(a.Nombre)).length,
    }))
  }, [catalogoAreas, empleados])
  const agregarArea = (area: Area) =>
    setCatalogoAreas((lista) => [...lista, area].sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es')))
  const activos = empleados.filter((e) => e.Activo).length

  const visibles = useMemo(() => {
    const texto = sinAcentos(busqueda.trim())
    // Un número (con o sin "#") es el ID del checador y se busca exacto; si no, por nombre o área.
    const id = /^#?\d+$/.test(texto) ? Number(texto.replace('#', '')) : null
    return empleados
      .filter((e) => (filtro === 'todos' ? true : filtro === 'activos' ? e.Activo : !e.Activo))
      .filter((e) =>
        !texto ? true : id !== null ? e.PinChecador === id : sinAcentos(`${e.Nombre} ${e.Area ?? ''}`).includes(texto),
      )
      .filter((e) => cumpleIngreso(e.Ingreso, filtroIngreso, format(new Date(), 'yyyy-MM')))
      .sort(comparar(orden))
  }, [empleados, filtro, busqueda, filtroIngreso, orden])

  // Años en los que ingresó alguien (del más reciente al más antiguo), para el filtro "Ingresó".
  const aniosDeIngreso = useMemo(
    () => [...new Set(empleados.flatMap((e) => (e.Ingreso ? [e.Ingreso.slice(0, 4)] : [])))].sort().reverse(),
    [empleados],
  )
  const haySinFecha = empleados.some((e) => !e.Ingreso)

  // Con transición: si al darlo de baja sale del filtro actual, las demás filas suben suavemente.
  const reemplazar = (actualizado: Empleado) =>
    conTransicion(() => setEmpleados((lista) => lista.map((e) => (e.Uuid === actualizado.Uuid ? actualizado : e))))

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        icono={UserCogIcon}
        titulo="Trabajadores"
        acciones={
          <>
            {(puedeGestionar || puedeEditar) && (
              <GestionAreas
                areas={areas}
                onAgregada={agregarArea}
                onQuitada={(id) => setCatalogoAreas((lista) => lista.filter((a) => a.id !== id))}
              />
            )}
            <SiPuede accion="gestionar" recurso="Empleado">
              <FormularioTrabajador
                areas={areas}
                onAreaCreada={agregarArea}
                onCreado={(nuevo) => setEmpleados((lista) => [...lista, nuevo])}
              />
            </SiPuede>
          </>
        }
      />

      {!cargando && !error && (
        <div className={cn('flex flex-wrap gap-2 text-sm', ENTRADA)}>
          <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 font-medium', COLOR_SECCION.indicadores.suave)}>
            <UserRoundCheckIcon className="size-4" />
            {activos} activos
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
            <UserMinusIcon className="size-4" />
            {empleados.length - activos} de baja
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o ID del checador"
              className="h-9 bg-card pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <label className="relative flex items-center">
              <span className="sr-only">Ordenar por</span>
              <ArrowDownUpIcon className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
              <select
                title="Ordenar por"
                className={cn(CLASES_SELECT, 'w-full pl-8')}
                value={orden}
                onChange={(e) => {
                  // Se lee ya: dentro de la transición (que corre después) el selector ya volvió a su valor anterior.
                  const valor = e.target.value as Orden
                  conTransicion(() => setOrden(valor))
                }}
              >
                {ORDENES.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative flex items-center">
              <span className="sr-only">Fecha de ingreso</span>
              <CalendarDaysIcon className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
              <select
                title="Cuándo ingresó"
                className={cn(CLASES_SELECT, 'w-full pl-8', filtroIngreso && 'border-primary/50 text-primary')}
                value={filtroIngreso}
                onChange={(e) => {
                  const valor = e.target.value
                  conTransicion(() => setFiltroIngreso(valor))
                }}
              >
                <option value="">Ingresó: cualquier fecha</option>
                <option value="mes">Ingresó este mes</option>
                {aniosDeIngreso.map((anio) => (
                  <option key={anio} value={anio}>
                    Ingresó en {anio}
                  </option>
                ))}
                {haySinFecha && <option value="sin">Sin fecha de ingreso</option>}
              </select>
            </label>
          </div>
        </div>
        <Segmentos etiqueta="Filtrar" opciones={FILTROS} valor={filtro} onCambio={(valor) => conTransicion(() => setFiltro(valor))} className="w-full sm:w-fit" />
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
          {(busqueda || filtroIngreso) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBusqueda('')
                setFiltroIngreso('')
              }}
            >
              Quitar filtros
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {visibles.map((e, i) => (
            <FilaTrabajador
              key={e.Uuid}
              empleado={e}
              posicion={i}
              areas={areas}
              onAreaCreada={agregarArea}
              onCambio={reemplazar}
              hoy={hoyPorEmpleado.get(e.Uuid)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default TrabajadoresPage
