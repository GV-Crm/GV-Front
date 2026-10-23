import { useState, type FormEvent } from 'react'
import { Building2Icon, Loader2Icon, PlusIcon, Trash2Icon, UsersIcon } from 'lucide-react'
import { cn } from 'cn'
import { crearArea, quitarArea, type Area } from './api'
import { usePuede } from '@/auth/permisos'
import { ENTRADA } from '@/lib/animaciones'
import { COLOR_SECCION } from '@/lib/colores-seccion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

function FilaArea({ area, onQuitada }: { area: Area; onQuitada: (id: number) => void }) {
  const puedeQuitar = usePuede('gestionar', 'Empleado')
  const [quitando, setQuitando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function quitar() {
    setQuitando(true)
    setError(null)
    try {
      await quitarArea(area.id)
      onQuitada(area.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar')
      setQuitando(false)
    }
  }

  return (
    <li className={cn('px-3 py-2.5', ENTRADA)}>
      <div className="flex items-center gap-3">
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', COLOR_SECCION.personas.suave)}>
          <Building2Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{area.Nombre}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <UsersIcon className="size-3" />
            {area.trabajadores === 0 ? 'Sin trabajadores' : `${area.trabajadores} ${area.trabajadores === 1 ? 'trabajador' : 'trabajadores'}`}
          </p>
        </div>
        {/* Solo se puede quitar un área vacía; el backend lo vuelve a revisar (incluye trabajadores de baja). */}
        {puedeQuitar && area.trabajadores === 0 && (
          <Button variant="ghost" size="icon-sm" aria-label={`Quitar ${area.Nombre}`} title="Quitar área" disabled={quitando} onClick={quitar}>
            {quitando ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
          </Button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </li>
  )
}

type Props = {
  areas: Area[]
  onAgregada: (area: Area) => void
  onQuitada: (id: number) => void
}

/** Botón "Áreas" que abre un panel para ver las áreas de la empresa, agregar nuevas y quitar las que no se usan. */
function GestionAreas({ areas, onAgregada, onQuitada }: Props) {
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function agregar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      onAgregada(await crearArea(nombre))
      setNombre('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el área')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button size="lg" variant="outline" />}>
        <Building2Icon data-icon="inline-start" />
        Áreas
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Áreas de la empresa</SheetTitle>
          <SheetDescription>Las áreas que se pueden asignar a los trabajadores.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <form onSubmit={agregar} className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="nueva-area">
              Agregar área
            </label>
            <div className="flex gap-2">
              <Input
                id="nueva-area"
                maxLength={60}
                placeholder="Ej. Ventas, Almacén, Producción"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <Button type="submit" disabled={guardando || !nombre.trim()}>
                {guardando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <PlusIcon data-icon="inline-start" />}
                Agregar
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>

          {areas.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Todavía no hay áreas. Agrega la primera.
            </p>
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {areas.map((a) => (
                <FilaArea key={a.id} area={a} onQuitada={onQuitada} />
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">Solo se pueden quitar las áreas que ningún trabajador tiene.</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default GestionAreas
