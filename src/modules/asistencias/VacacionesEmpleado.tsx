import { useEffect, useState, type ReactNode } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BadgePercentIcon,
  CalendarClockIcon,
  CalendarHeartIcon,
  HourglassIcon,
  PalmtreeIcon,
  ScaleIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { getVacaciones } from './api'
import PeriodosVacaciones from './PeriodosVacaciones'
import { fechaDesdeClave } from './formatHora'
import type { Vacaciones } from './types'
import Ayuda from '@/components/Ayuda'
import Cifra from '@/components/Cifra'
import { ELEVAR_AL_PASAR, ENTRADA, retrasoEscalonado } from '@/lib/animaciones'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { Skeleton } from '@/components/ui/skeleton'

const fecha = (clave: string) => format(fechaDesdeClave(clave), "d 'de' MMMM yyyy", { locale: es })
const pesos = (monto: number) => monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const dias = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} ${n === 1 ? 'día' : 'días'}`

function antiguedadEnTexto({ anios, meses, dias: d }: Vacaciones['antiguedad']) {
  const partes = [
    anios && `${anios} ${anios === 1 ? 'año' : 'años'}`,
    meses && `${meses} ${meses === 1 ? 'mes' : 'meses'}`,
    `${d} ${d === 1 ? 'día' : 'días'}`,
  ].filter(Boolean)
  return partes.join(', ')
}

function Tarjeta({ titulo, valor, detalle, icono: Icono, posicion }: { titulo: string; valor: string; detalle: ReactNode; icono: LucideIcon; posicion: number }) {
  return (
    <div style={retrasoEscalonado(posicion)} className={cn('flex items-start gap-3 rounded-xl border bg-card p-3 sm:p-4', ENTRADA, ELEVAR_AL_PASAR)}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10', COLOR_SECCION.indicadores.suave)}>
        <Icono className="size-5" />
      </span>
      <div className="min-w-0">
        <p>
          <Cifra valor={valor} className="text-2xl sm:text-3xl" />
        </p>
        <p className="text-xs font-medium">{titulo}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detalle}</p>
      </div>
    </div>
  )
}

/**
 * Pestaña "Vacaciones" del trabajador: antigüedad, días que le corresponden según la Ley Federal del Trabajo,
 * su prima vacacional, su saldo y los periodos que pidió (ver PeriodosVacaciones).
 * `onCambio` se llama al registrar o quitar un periodo, para que el calendario se actualice.
 */
function VacacionesEmpleado({ uuid, onCambio }: { uuid: string; onCambio: () => void }) {
  const [datos, setDatos] = useState<Vacaciones | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getVacaciones(uuid)
      .then(setDatos)
      .catch((err: Error) => setError(err.message))
  }, [uuid])

  if (error) return <p className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">{error}</p>
  if (!datos) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  const { periodoActual, siguiente, prima, montos } = datos
  const diasDelPeriodo = periodoActual?.dias ?? datos.proporcionales

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta
          posicion={0}
          icono={HourglassIcon}
          titulo="Antigüedad"
          valor={String(datos.antiguedad.anios ? `${datos.antiguedad.anios} ${datos.antiguedad.anios === 1 ? 'año' : 'años'}` : `${datos.antiguedad.meses} meses`)}
          detalle={`${antiguedadEnTexto(datos.antiguedad)} · desde el ${fecha(datos.ingreso)}`}
        />
        <Tarjeta
          posicion={1}
          icono={PalmtreeIcon}
          titulo={periodoActual ? `Vacaciones de su año ${periodoActual.anioDeServicio}` : 'Vacaciones'}
          valor={periodoActual ? dias(periodoActual.dias) : 'Aún no'}
          detalle={
            periodoActual
              ? `Las ganó el ${fecha(periodoActual.aniversario)}`
              : `Las gana al cumplir 1 año: ${fecha(siguiente.aniversario)}`
          }
        />
        <Tarjeta
          posicion={2}
          icono={CalendarHeartIcon}
          titulo="Acumuladas del año en curso"
          valor={dias(datos.proporcionales)}
          detalle={`De ${siguiente.dias} días que gana el ${fecha(siguiente.aniversario)} (faltan ${siguiente.faltanDias} días)`}
        />
        <Tarjeta
          posicion={3}
          icono={BadgePercentIcon}
          titulo={`Prima vacacional (${prima.porcentaje}%)`}
          valor={montos ? pesos(montos.primaVacacional) : dias(prima.diasDeSalario)}
          detalle={
            montos
              ? `${dias(prima.diasDeSalario)} de salario sobre ${dias(diasDelPeriodo)}`
              : datos.puedeVerSalario
                ? `De salario. Captura su salario diario en Trabajadores → Información personal para verla en pesos.`
                : `Equivale a ${dias(prima.diasDeSalario)} de salario`
          }
        />
      </section>

      <PeriodosVacaciones uuid={uuid} datos={datos} onCambio={onCambio} />

      {periodoActual && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
            periodoActual.vencido
              ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
            ENTRADA,
          )}
        >
          {periodoActual.vencido ? (
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-red-700 dark:text-red-300" />
          ) : (
            <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
          )}
          <p>
            {periodoActual.vencido ? 'Se debían dar antes del ' : 'Hay que darle sus '}
            {periodoActual.vencido ? (
              <span className="font-semibold">{fecha(periodoActual.disfrutarAntesDe)}</span>
            ) : (
              <>
                <span className="font-semibold">{dias(periodoActual.dias)}</span> de vacaciones antes del{' '}
                <span className="font-semibold">{fecha(periodoActual.disfrutarAntesDe)}</span>
              </>
            )}
            {periodoActual.vencido
              ? ` (6 meses después de su aniversario). Si todavía no las tomó, hay que dárselas cuanto antes.`
              : ' (6 meses después de su aniversario, art. 81).'}
          </p>
        </div>
      )}

      {montos && (
        <section className={cn('rounded-xl border bg-card p-4', ENTRADA)}>
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Cálculo {periodoActual ? `de su año ${periodoActual.anioDeServicio}` : 'proporcional'}
          </h2>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Salario diario</dt>
              <dd className="font-semibold tabular-nums">{pesos(montos.salarioDiario)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pago de {dias(diasDelPeriodo)} de vacaciones</dt>
              <dd className="font-semibold tabular-nums">{pesos(montos.pagoVacaciones)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Prima vacacional ({prima.porcentaje}%)</dt>
              <dd className="font-semibold tabular-nums">{pesos(montos.primaVacacional)}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className={cn('rounded-xl border bg-card p-4 text-sm', ENTRADA)}>
        <h2 className="mb-2 flex items-center gap-2 font-semibold">
          <ScaleIcon className={cn('size-4', COLOR_SECCION.indicadores.texto)} />
          Cómo se calcula
          <Ayuda>Reforma "Vacaciones dignas" de la Ley Federal del Trabajo, vigente desde 2023.</Ayuda>
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Al cumplir 1 año: 12 días; luego 2 más por año hasta 20 días al 5.º año (art. 76).</li>
          <li>Desde el 6.º año, 2 días más por cada 5 años: 22 días (6 a 10 años), 24 (11 a 15), 26 (16 a 20)…</li>
          <li>Prima vacacional de al menos 25% del salario de esos días (art. 80). El porcentaje se cambia en Empresa.</li>
          <li>Se deben dar dentro de los 6 meses siguientes a cada aniversario (art. 81).</li>
          <li>Si deja de trabajar antes de cumplir el año, le corresponden las acumuladas en proporción (art. 79).</li>
        </ul>
      </section>
    </div>
  )
}

export default VacacionesEmpleado
