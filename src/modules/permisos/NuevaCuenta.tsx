import { useState, type FormEvent } from 'react'
import { Loader2Icon, UserPlusIcon } from 'lucide-react'
import { crearCuenta, type Cuenta } from './api'
import { CLASES_SELECT } from './estilos'
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

/** Botón "Nueva cuenta" que abre un panel lateral para dar acceso a alguien. */
function NuevaCuenta({ roles, onCreada }: { roles: string[]; onCreada: (cuenta: Cuenta) => void }) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [rol, setRol] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiarAbierto(valor: boolean) {
    setAbierto(valor)
    if (!valor) {
      setNombre('')
      setCorreo('')
      setRol('')
      setError(null)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      onCreada(await crearCuenta({ Nombre: nombre.trim(), Correo: correo.trim(), Rol: rol }))
      cambiarAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={cambiarAbierto}>
      <SheetTrigger render={<Button />}>
        <UserPlusIcon data-icon="inline-start" />
        Nueva cuenta
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Nueva cuenta</SheetTitle>
            <SheetDescription>
              Da acceso al sistema con un rol. La persona también debe tener su usuario creado en Supabase
              (Authentication → Users) con el mismo correo.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Nombre
              <Input required autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Correo
              <Input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Rol
              <select required className={CLASES_SELECT} value={rol} onChange={(e) => setRol(e.target.value)}>
                <option value="" disabled>
                  Elige un rol
                </option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
              {enviando ? 'Guardando…' : 'Dar acceso'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default NuevaCuenta
