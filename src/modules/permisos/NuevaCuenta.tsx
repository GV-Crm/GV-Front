import { useState, type FormEvent } from 'react'
import { Loader2Icon, UndoIcon, UserPlusIcon } from 'lucide-react'
import { crearCuenta, MIN_CONTRASENA, type Cuenta } from './api'
import CampoContrasena from './CampoContrasena'
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

const NUEVO = '__nuevo__'

/**
 * Botón "Nueva cuenta" que abre un panel lateral para dar acceso a alguien.
 * El área (rol) se elige de las que ya existen o se escribe una nueva: se crea con la cuenta, sin permisos.
 */
type Props = { roles: string[]; onCreada: (cuenta: Cuenta, usaContrasenaExistente: boolean) => void }

function NuevaCuenta({ roles, onCreada }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [rol, setRol] = useState('')
  // true = se escribe el nombre de un área nueva en vez de elegirla.
  const [rolNuevo, setRolNuevo] = useState(false)
  const [contrasena, setContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiarAbierto(valor: boolean) {
    setAbierto(valor)
    if (!valor) {
      setNombre('')
      setCorreo('')
      setRol('')
      setRolNuevo(false)
      setContrasena('')
      setError(null)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const { usaContrasenaExistente, ...cuenta } = await crearCuenta({
        Nombre: nombre.trim(),
        Correo: correo.trim(),
        Rol: rol.trim(),
        Contrasena: contrasena,
      })
      onCreada(cuenta, usaContrasenaExistente)
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
              Da acceso al sistema con un rol. La persona inicia sesión con su correo y la contraseña inicial que
              pongas aquí.
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

            <div className="flex flex-col gap-1.5 text-sm font-medium">
              <label htmlFor="rol-cuenta">Área / rol</label>
              {rolNuevo ? (
                <div className="flex gap-2">
                  <Input
                    id="rol-cuenta"
                    required
                    autoFocus
                    minLength={2}
                    maxLength={40}
                    placeholder="Ej. Recursos Humanos"
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Elegir un área que ya existe"
                    title="Elegir un área que ya existe"
                    onClick={() => {
                      setRolNuevo(false)
                      setRol('')
                    }}
                  >
                    <UndoIcon />
                  </Button>
                </div>
              ) : (
                <select
                  id="rol-cuenta"
                  required
                  className={CLASES_SELECT}
                  value={rol}
                  onChange={(e) => {
                    if (e.target.value === NUEVO) {
                      setRolNuevo(true)
                      setRol('')
                    } else setRol(e.target.value)
                  }}
                >
                  <option value="" disabled>
                    Elige un área
                  </option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value={NUEVO}>＋ Crear nueva área…</option>
                </select>
              )}
              <span className="text-xs font-normal text-muted-foreground">
                {rolNuevo
                  ? 'Se crea sin permisos: después marca lo que puede hacer en "Roles y permisos".'
                  : 'El área decide qué puede ver y hacer en la plataforma.'}
              </span>
            </div>

            <div className="space-y-1.5">
              <CampoContrasena etiqueta="Contraseña inicial" valor={contrasena} onCambio={setContrasena} />
              <p className="text-xs text-muted-foreground">
                Mínimo {MIN_CONTRASENA} caracteres. Después la puede cambiar quien tenga el permiso "Cambiar la contraseña de
                las cuentas".
              </p>
            </div>

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
