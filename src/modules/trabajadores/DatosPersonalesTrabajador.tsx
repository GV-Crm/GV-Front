import { useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckIcon, IdCardIcon, Loader2Icon } from 'lucide-react'
import { getDatosPersonales, guardarDatosPersonales, type DatosPersonalesGuardados } from './api'
import CamposDatosPersonales from './CamposDatosPersonales'
import { aDatos, aFormulario, FORM_VACIO, type FormDatosPersonales } from './datosPersonales'
import PinChecador from './PinChecador'
import { cn } from 'cn'
import { EstatusBadge } from '@/modules/asistencias/componentes'
import type { Empleado } from '@/modules/asistencias/types'
import Avatar from '@/components/Avatar'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/**
 * Botón que abre el apartado de información personal de un trabajador (CURP, RFC, NSS, contacto,
 * domicilio y contactos de emergencia). Solo se muestra con el permiso "gestionar DatosPersonales".
 * Se abre en una ventana centrada; los datos se piden al abrirla, para no traer datos sensibles en la lista.
 */
function DatosPersonalesTrabajador({ empleado }: { empleado: Empleado }) {
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState<FormDatosPersonales>(FORM_VACIO)
  const [guardado, setGuardado] = useState<DatosPersonalesGuardados | null>(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cambiarAbierto(valor: boolean) {
    setAbierto(valor)
    if (!valor) return
    setError(null)
    setGuardado(null)
    setForm(FORM_VACIO)
    setCargando(true)
    try {
      const datos = await getDatosPersonales(empleado.Uuid)
      setGuardado(datos)
      setForm(aFormulario(datos))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos personales')
    } finally {
      setCargando(false)
    }
  }

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      await guardarDatosPersonales(empleado.Uuid, aDatos(form))
      setAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los datos personales')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={cambiarAbierto}>
      <DialogTrigger
        render={<Button variant="outline" size="icon" aria-label={`Información personal de ${empleado.Nombre}`} title="Información personal" />}
      >
        <IdCardIcon />
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <form onSubmit={guardar} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Información personal</DialogTitle>
            <DialogDescription>CURP, RFC, NSS, contacto, domicilio y contactos de emergencia.</DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4">
            {/* Ficha del trabajador: foto grande para reconocerlo de un vistazo, y su ID del checador. */}
            <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <Avatar
                  nombre={empleado.Nombre}
                  foto={empleado.Foto}
                  className={cn('size-20 text-2xl', COLOR_SECCION.personas.suave, !empleado.Activo && 'grayscale')}
                />
                <div className="min-w-0 space-y-1">
                  <p className="text-lg leading-tight font-semibold">{empleado.Nombre}</p>
                  <p className="truncate text-sm text-muted-foreground">{empleado.Area?.trim() || 'Sin área'}</p>
                  <EstatusBadge activo={empleado.Activo} />
                </div>
              </div>
              <PinChecador pin={empleado.PinChecador} className="bg-card md:w-80" />
            </div>

            {cargando ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <CamposDatosPersonales valor={form} onCambio={setForm} disabled={guardando} enColumnas />
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </DialogBody>

          <DialogFooter className="sm:items-center">
            {guardado?.ActualizadoEn && (
              <p className="text-xs text-muted-foreground sm:mr-auto">
                Última actualización: {format(new Date(guardado.ActualizadoEn), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                {guardado.ActualizadoPor && ` · ${guardado.ActualizadoPor}`}
              </p>
            )}
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={guardando || cargando}>
              {guardando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <CheckIcon data-icon="inline-start" />}
              Guardar datos personales
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DatosPersonalesTrabajador
