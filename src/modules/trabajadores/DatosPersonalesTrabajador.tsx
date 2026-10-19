import { useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckIcon, IdCardIcon, Loader2Icon } from 'lucide-react'
import { getDatosPersonales, guardarDatosPersonales, type DatosPersonalesGuardados } from './api'
import CamposDatosPersonales from './CamposDatosPersonales'
import { aDatos, aFormulario, FORM_VACIO, type FormDatosPersonales } from './datosPersonales'
import PinChecador from './PinChecador'
import type { Empleado } from '@/modules/asistencias/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

/**
 * Botón que abre el apartado de información personal de un trabajador (CURP, RFC, NSS, contacto,
 * domicilio y contactos de emergencia). Solo se muestra con el permiso "gestionar DatosPersonales".
 * Los datos se piden al abrir el panel, para no traer datos sensibles en la lista.
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
    <Sheet open={abierto} onOpenChange={cambiarAbierto}>
      <SheetTrigger
        render={<Button variant="outline" size="icon" aria-label={`Información personal de ${empleado.Nombre}`} title="Información personal" />}
      >
        <IdCardIcon />
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <form onSubmit={guardar} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Información personal</SheetTitle>
            <SheetDescription>{empleado.Nombre}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
            <PinChecador pin={empleado.PinChecador} />

            {cargando ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <CamposDatosPersonales valor={form} onCambio={setForm} disabled={guardando} />
            )}

            {guardado?.ActualizadoEn && (
              <p className="text-xs text-muted-foreground">
                Última actualización: {format(new Date(guardado.ActualizadoEn), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                {guardado.ActualizadoPor && ` · ${guardado.ActualizadoPor}`}
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <SheetFooter>
            <Button type="submit" size="lg" disabled={guardando || cargando}>
              {guardando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <CheckIcon data-icon="inline-start" />}
              Guardar datos personales
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default DatosPersonalesTrabajador
