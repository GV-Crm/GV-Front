import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { MIN_CONTRASENA } from './api'
import { Input } from '@/components/ui/input'

type Props = {
  etiqueta: string
  valor: string
  onCambio: (valor: string) => void
  autoFocus?: boolean
}

/** Campo de contraseña con botón para mostrarla u ocultarla. */
function CampoContrasena({ etiqueta, valor, onCambio, autoFocus }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {etiqueta}
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          required
          autoFocus={autoFocus}
          autoComplete="new-password"
          minLength={MIN_CONTRASENA}
          maxLength={72}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>
    </label>
  )
}

export default CampoContrasena
