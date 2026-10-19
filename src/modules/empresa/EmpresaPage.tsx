import { useEffect, useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2Icon, CheckIcon, CopyIcon, Loader2Icon, PencilIcon, XIcon } from 'lucide-react'
import { cn } from 'cn'
import { getEmpresa, guardarEmpresa, type DatosEmpresa, type EmpresaGuardada } from './api'
import { usePuede } from '@/auth/permisos'
import EncabezadoPagina from '@/components/EncabezadoPagina'
import { ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

type Campo = keyof DatosEmpresa

type DefinicionCampo = {
  campo: Campo
  etiqueta: string
  ayuda?: string
  /** Texto en mayúsculas y letra de ancho fijo (claves como el RFC). */
  clave?: boolean
  largo?: boolean
  tipo?: 'email' | 'tel'
  maximo: number
  /** Porcentaje: se captura como número y se muestra con "%". */
  porcentaje?: boolean
}

const SECCIONES: { titulo: string; campos: DefinicionCampo[] }[] = [
  {
    titulo: 'Datos fiscales',
    campos: [
      { campo: 'RazonSocial', etiqueta: 'Razón social', maximo: 200 },
      { campo: 'NombreComercial', etiqueta: 'Nombre comercial', maximo: 120 },
      { campo: 'RFC', etiqueta: 'RFC', ayuda: '12 caracteres (persona moral) o 13 (persona física).', clave: true, maximo: 13 },
      { campo: 'RegimenFiscal', etiqueta: 'Régimen fiscal', ayuda: 'Por ejemplo: 601 General de Ley Personas Morales.', maximo: 120 },
      { campo: 'RegistroPatronal', etiqueta: 'Registro patronal (IMSS)', ayuda: 'Una letra y 10 dígitos.', clave: true, maximo: 11 },
    ],
  },
  {
    titulo: 'Domicilio y contacto',
    campos: [
      { campo: 'DomicilioFiscal', etiqueta: 'Domicilio fiscal', ayuda: 'Calle y número, colonia, municipio y estado.', largo: true, maximo: 300 },
      { campo: 'CodigoPostal', etiqueta: 'Código postal', clave: true, maximo: 5 },
      { campo: 'Telefono', etiqueta: 'Teléfono', ayuda: '10 dígitos.', tipo: 'tel', maximo: 20 },
      { campo: 'Correo', etiqueta: 'Correo', tipo: 'email', maximo: 120 },
      { campo: 'RepresentanteLegal', etiqueta: 'Representante legal', maximo: 120 },
    ],
  },
  {
    titulo: 'Prestaciones',
    campos: [
      {
        campo: 'PrimaVacacional',
        etiqueta: 'Prima vacacional (%)',
        ayuda: 'La ley pide al menos 25% del salario de los días de vacaciones (art. 80 LFT).',
        porcentaje: true,
        maximo: 6,
      },
    ],
  },
]

const CAMPOS = SECCIONES.flatMap((s) => s.campos.map((c) => c.campo))

const aFormulario = (empresa: EmpresaGuardada | null) =>
  Object.fromEntries(
    CAMPOS.map((campo) => [campo, campo === 'PrimaVacacional' ? String(empresa?.PrimaVacacional ?? 25) : (empresa?.[campo] ?? '')]),
  ) as Record<Campo, string>

const aDatos = (form: Record<Campo, string>) =>
  Object.fromEntries(
    CAMPOS.map((campo) => [campo, campo === 'PrimaVacacional' ? Number(form[campo] || 25) : form[campo].trim() || null]),
  ) as unknown as DatosEmpresa

function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Copiar"
      title="Copiar"
      onClick={() =>
        navigator.clipboard.writeText(texto).then(() => {
          setCopiado(true)
          setTimeout(() => setCopiado(false), 1500)
        })
      }
    >
      {copiado ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}

/** Vista de solo lectura: cada dato con un botón para copiarlo. */
function Ficha({ empresa }: { empresa: EmpresaGuardada | null }) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      {SECCIONES.map((seccion, i) => (
        <section key={seccion.titulo} style={retrasoEscalonado(i)} className={cn('rounded-xl border bg-card p-4 sm:p-5', ENTRADA)}>
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{seccion.titulo}</h2>
          <dl className="divide-y">
            {seccion.campos.map(({ campo, etiqueta, clave, porcentaje }) => {
              const guardado = empresa?.[campo]
              const valor = porcentaje ? `${guardado ?? 25}%` : (guardado as string | null | undefined)
              return (
                <div key={campo} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
                    <dd className={cn('break-words whitespace-pre-line', clave && 'font-mono', !valor && 'text-muted-foreground italic')}>
                      {valor || 'Sin capturar'}
                    </dd>
                  </div>
                  {valor && <BotonCopiar texto={valor} />}
                </div>
              )
            })}
          </dl>
        </section>
      ))}
    </div>
  )
}

type PropsFormulario = { empresa: EmpresaGuardada | null; onGuardado: (e: EmpresaGuardada) => void; onCancelar: () => void }

function Formulario({ empresa, onGuardado, onCancelar }: PropsFormulario) {
  const [form, setForm] = useState(() => aFormulario(empresa))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      onGuardado(await guardarEmpresa(aDatos(form)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los datos')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <fieldset disabled={guardando} className="grid items-start gap-4 lg:grid-cols-2">
        {SECCIONES.map((seccion) => (
          <section key={seccion.titulo} className={cn('flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5', ENTRADA)}>
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{seccion.titulo}</h2>
            {seccion.campos.map(({ campo, etiqueta, ayuda, clave, largo, tipo, maximo, porcentaje }) => (
              <label key={campo} className="flex flex-col gap-1.5 text-sm font-medium">
                {etiqueta}
                {largo ? (
                  <textarea
                    rows={3}
                    maxLength={maximo}
                    value={form[campo]}
                    onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                    className="w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
                  />
                ) : (
                  <Input
                    type={porcentaje ? 'number' : (tipo ?? 'text')}
                    {...(porcentaje ? { min: 25, max: 100, step: 0.01, inputMode: 'decimal' as const } : { maxLength: maximo })}
                    autoComplete="off"
                    spellCheck={clave ? false : undefined}
                    className={cn(clave && 'font-mono uppercase')}
                    value={form[campo]}
                    onChange={(e) => setForm({ ...form, [campo]: clave ? e.target.value.toUpperCase() : e.target.value })}
                  />
                )}
                {ayuda && <span className="text-xs font-normal text-muted-foreground">{ayuda}</span>}
              </label>
            ))}
          </section>
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="lg" disabled={guardando} onClick={onCancelar}>
          <XIcon data-icon="inline-start" />
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={guardando}>
          {guardando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <CheckIcon data-icon="inline-start" />}
          Guardar
        </Button>
      </div>
    </form>
  )
}

/**
 * Módulo Empresa: los datos importantes de la empresa a la mano (razón social, RFC, registro patronal...).
 * Lo ve quien tenga "ver Empresa"; quien tenga "editar Empresa" también puede cambiarlos. El Admin decide
 * quién tiene cada permiso en Permisos.
 */
function EmpresaPage() {
  const puedeEditar = usePuede('editar', 'Empresa')
  const [empresa, setEmpresa] = useState<EmpresaGuardada | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    getEmpresa()
      .then(setEmpresa)
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        icono={Building2Icon}
        titulo="Empresa"
        acciones={
          puedeEditar &&
          !editando &&
          !cargando &&
          !error && (
            <Button size="lg" onClick={() => setEditando(true)}>
              <PencilIcon data-icon="inline-start" />
              Editar datos
            </Button>
          )
        }
      />

      {cargando ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : error ? (
        <p className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">{error}</p>
      ) : editando ? (
        <Formulario
          empresa={empresa}
          onCancelar={() => setEditando(false)}
          onGuardado={(guardada) => {
            setEmpresa(guardada)
            setEditando(false)
          }}
        />
      ) : (
        <>
          <Ficha empresa={empresa} />
          {empresa?.ActualizadoEn && (
            <p className="text-xs text-muted-foreground">
              Última actualización: {format(new Date(empresa.ActualizadoEn), "d MMM yyyy 'a las' HH:mm", { locale: es })}
              {empresa.ActualizadoPor && ` · ${empresa.ActualizadoPor}`}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default EmpresaPage
