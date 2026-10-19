import { useState, type FormEvent } from 'react'
import { CircleCheckIcon, IdCardIcon, Loader2Icon, UserPlusIcon } from 'lucide-react'
import { crearTrabajador } from './api'
import CamposDatosPersonales from './CamposDatosPersonales'
import { aDatos, FORM_VACIO, tieneDatos, type FormDatosPersonales } from './datosPersonales'
import PinChecador from './PinChecador'
import { usePuede } from '@/auth/permisos'
import type { Empleado } from '@/modules/asistencias/types'
import { claveFecha } from '@/modules/asistencias/formatHora'
import Desplegable from '@/components/Desplegable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type Props = { areas: string[]; onCreado: (empleado: Empleado) => void }

/**
 * Botón "Nuevo trabajador" que abre un panel lateral con el formulario de alta.
 * Con el permiso "gestionar DatosPersonales" se pueden capturar también sus datos personales.
 * Al terminar se muestra el ID que el sistema le asignó para registrarlo en el checador.
 */
function FormularioTrabajador({ areas, onCreado }: Props) {
  const puedeDatosPersonales = usePuede('gestionar', 'DatosPersonales')
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [area, setArea] = useState('')
  const [ingreso, setIngreso] = useState(() => claveFecha(new Date()))
  const [datosPersonales, setDatosPersonales] = useState<FormDatosPersonales>(FORM_VACIO)
  const [creado, setCreado] = useState<Empleado | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiarAbierto(valor: boolean) {
    setAbierto(valor)
    if (!valor) {
      setNombre('')
      setArea('')
      setIngreso(claveFecha(new Date()))
      setDatosPersonales(FORM_VACIO)
      setCreado(null)
      setError(null)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const nuevo = await crearTrabajador({
        Nombre: nombre.trim(),
        Area: area.trim(),
        Ingreso: ingreso,
        ...(puedeDatosPersonales && tieneDatos(datosPersonales) ? { DatosPersonales: aDatos(datosPersonales) } : {}),
      })
      onCreado(nuevo)
      setCreado(nuevo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo dar de alta al trabajador')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={cambiarAbierto}>
      <SheetTrigger render={<Button size="lg" />}>
        <UserPlusIcon data-icon="inline-start" />
        Nuevo trabajador
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        {creado ? (
          <div className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <CircleCheckIcon className="size-5 text-emerald-600" />
                Trabajador dado de alta
              </SheetTitle>
              <SheetDescription>{creado.Nombre}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-3 px-4">
              <PinChecador pin={creado.PinChecador} />
              <p className="text-sm text-muted-foreground">
                En el checador, crea el usuario con este ID y registra ahí su rostro o huella. Así sus marcas se
                asocian a este trabajador.
              </p>
            </div>
            <SheetFooter>
              <Button size="lg" onClick={() => cambiarAbierto(false)}>
                Listo
              </Button>
            </SheetFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Nuevo trabajador</SheetTitle>
              <SheetDescription>Se dará de alta como activo y empezará a contar en asistencias.</SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Nombre completo
                <Input required maxLength={120} autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Área
                <Input required maxLength={60} list="areas-existentes" value={area} onChange={(e) => setArea(e.target.value)} />
                <datalist id="areas-existentes">
                  {areas.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Fecha de ingreso
                <Input type="date" required value={ingreso} onChange={(e) => setIngreso(e.target.value)} />
                <span className="text-xs font-normal text-muted-foreground">
                  Desde esta fecha se cuentan sus faltas (de lunes a viernes).
                </span>
              </label>

              {puedeDatosPersonales && (
                <Desplegable titulo="Datos personales" icono={IdCardIcon} resumen="Opcional · CURP, RFC, NSS, contacto y emergencias">
                  <CamposDatosPersonales valor={datosPersonales} onCambio={setDatosPersonales} disabled={enviando} />
                </Desplegable>
              )}

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <SheetFooter>
              <Button type="submit" size="lg" disabled={enviando}>
                {enviando && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
                {enviando ? 'Guardando…' : 'Dar de alta'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default FormularioTrabajador
