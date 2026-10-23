import { useState, type FormEvent } from 'react'
import { KeyRoundIcon, Loader2Icon } from 'lucide-react'
import { cambiarContrasena, MIN_CONTRASENA, type Cuenta } from './api'
import CampoContrasena from './CampoContrasena'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

/** Botón "Contraseña" de una cuenta: abre un panel para ponerle una contraseña nueva. Requiere "cambiar Contrasena". */
function CambiarContrasena({ cuenta, onCambiada }: { cuenta: Cuenta; onCambiada: (mensaje: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nombre = cuenta.Nombre ?? cuenta.Correo

  function cambiarAbierto(valor: boolean) {
    setAbierto(valor)
    if (!valor) {
      setContrasena('')
      setConfirmacion('')
      setError(null)
    }
  }

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const { usuarioCreado } = await cambiarContrasena(cuenta.id, contrasena)
      onCambiada(
        usuarioCreado
          ? `${nombre} no tenía usuario para iniciar sesión: se le creó con la contraseña nueva.`
          : `Listo: ${nombre} ya entra con la contraseña nueva.`,
      )
      cambiarAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={cambiarAbierto}>
      <SheetTrigger render={<Button variant="outline" size="sm" title={`Cambiar la contraseña de ${nombre}`} />}>
        <KeyRoundIcon data-icon="inline-start" />
        Contraseña
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <form onSubmit={guardar} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Cambiar contraseña</SheetTitle>
            <SheetDescription>
              {nombre} ({cuenta.Correo}) entrará con esta contraseña. La de antes deja de servir.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            <CampoContrasena etiqueta="Contraseña nueva" valor={contrasena} onCambio={setContrasena} autoFocus />
            <CampoContrasena etiqueta="Repite la contraseña" valor={confirmacion} onCambio={setConfirmacion} />
            <p className="text-xs text-muted-foreground">Mínimo {MIN_CONTRASENA} caracteres. Compártela con la persona por un medio seguro.</p>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <SheetFooter>
            <Button type="submit" size="lg" disabled={enviando}>
              {enviando && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
              {enviando ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default CambiarContrasena
