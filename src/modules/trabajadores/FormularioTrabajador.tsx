import { useState, type FormEvent } from 'react'
import { Loader2Icon, UserPlusIcon } from 'lucide-react'
import { crearTrabajador } from './api'
import type { Empleado } from '@/modules/asistencias/types'
import { claveFecha } from '@/modules/asistencias/formatHora'
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

/** Botón "Nuevo trabajador" que abre un panel lateral con el formulario de alta. */
function FormularioTrabajador({ areas, onCreado }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [area, setArea] = useState('')
  const [ingreso, setIngreso] = useState(() => claveFecha(new Date()))
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiarAbierto(valor: boolean) {
    setAbierto(valor)
    if (!valor) {
      setNombre('')
      setArea('')
      setIngreso(claveFecha(new Date()))
      setError(null)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      onCreado(await crearTrabajador({ Nombre: nombre.trim(), Area: area.trim(), Ingreso: ingreso }))
      cambiarAbierto(false)
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
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Nuevo trabajador</SheetTitle>
            <SheetDescription>Se dará de alta como activo y empezará a contar en asistencias.</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
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
      </SheetContent>
    </Sheet>
  )
}

export default FormularioTrabajador
