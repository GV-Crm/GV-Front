import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CameraIcon, CheckIcon, Loader2Icon, PencilIcon, Trash2Icon } from 'lucide-react'
import { cn } from 'cn'
import { editarTrabajador, quitarFotoTrabajador, subirFotoTrabajador } from './api'
import type { Empleado } from '@/modules/asistencias/types'
import Avatar from '@/components/Avatar'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { prepararFotoDePerfil } from '@/lib/imagen'
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

type Props = {
  empleado: Empleado
  /** Áreas que ya existen, para sugerirlas al escribir. */
  areas: string[]
  /** Se llama con el trabajador actualizado (al cambiar la foto o al guardar los datos). */
  onCambio: (empleado: Empleado) => void
}

/**
 * Botón de lápiz que abre un panel para editar el perfil de un trabajador.
 * Solo se muestra a quien tiene el permiso "editar Empleado" (ver TrabajadoresPage).
 * - La foto se guarda en cuanto se elige (igual que en Mi perfil).
 * - Nombre, área y fecha de ingreso se guardan con el botón "Guardar cambios".
 */
function EditarTrabajador({ empleado, areas, onCambio }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState(empleado.Nombre)
  const [area, setArea] = useState(empleado.Area?.trim() ?? '')
  const [ingreso, setIngreso] = useState(empleado.Ingreso ?? '')
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const entradaFoto = useRef<HTMLInputElement>(null)

  // Al abrir, el formulario parte de los datos actuales del trabajador.
  function cambiarAbierto(valor: boolean) {
    setAbierto(valor)
    if (valor) {
      setNombre(empleado.Nombre)
      setArea(empleado.Area?.trim() ?? '')
      setIngreso(empleado.Ingreso ?? '')
      setError(null)
    }
  }

  async function alElegirFoto(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setError(null)
    setSubiendoFoto(true)
    try {
      const { Foto } = await subirFotoTrabajador(empleado.Uuid, await prepararFotoDePerfil(archivo))
      onCambio({ ...empleado, Foto })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setSubiendoFoto(false)
    }
  }

  async function quitarFoto() {
    setError(null)
    setSubiendoFoto(true)
    try {
      await quitarFotoTrabajador(empleado.Uuid)
      onCambio({ ...empleado, Foto: null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar la foto')
    } finally {
      setSubiendoFoto(false)
    }
  }

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      const actualizado = await editarTrabajador(empleado.Uuid, { Nombre: nombre.trim(), Area: area.trim(), Ingreso: ingreso })
      onCambio(actualizado)
      setAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={cambiarAbierto}>
      <SheetTrigger render={<Button variant="outline" size="icon" aria-label={`Editar a ${empleado.Nombre}`} title="Editar perfil" />}>
        <PencilIcon />
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <form onSubmit={guardar} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Editar trabajador</SheetTitle>
            <SheetDescription>{empleado.Nombre}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => entradaFoto.current?.click()}
                disabled={subiendoFoto}
                aria-label="Cambiar foto"
                className="group relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Avatar nombre={empleado.Nombre} foto={empleado.Foto} className={cn('size-20 text-2xl', COLOR_SECCION.personas.suave)} />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <CameraIcon className="size-5" />
                </span>
                {subiendoFoto && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/60">
                    <Loader2Icon className="size-5 animate-spin text-primary" />
                  </span>
                )}
              </button>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" disabled={subiendoFoto} onClick={() => entradaFoto.current?.click()}>
                  <CameraIcon data-icon="inline-start" />
                  {empleado.Foto ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {empleado.Foto && (
                  <Button type="button" variant="ghost" size="sm" disabled={subiendoFoto} onClick={quitarFoto}>
                    <Trash2Icon data-icon="inline-start" />
                    Quitar foto
                  </Button>
                )}
              </div>
              <input ref={entradaFoto} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={alElegirFoto} />
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Nombre completo
              <Input required maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Área
              <Input required maxLength={60} list={`areas-${empleado.Uuid}`} value={area} onChange={(e) => setArea(e.target.value)} />
              <datalist id={`areas-${empleado.Uuid}`}>
                {areas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Fecha de ingreso
              <Input type="date" required value={ingreso} onChange={(e) => setIngreso(e.target.value)} />
              <span className="text-xs font-normal text-muted-foreground">
                Cambiarla afecta desde cuándo se cuentan sus faltas.
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <SheetFooter>
            <Button type="submit" size="lg" disabled={guardando}>
              {guardando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <CheckIcon data-icon="inline-start" />}
              Guardar cambios
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default EditarTrabajador
