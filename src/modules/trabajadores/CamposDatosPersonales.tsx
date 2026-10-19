import type { ReactNode } from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import type { ContactoEmergencia } from './api'
import { CONTACTO_VACIO, MAX_CONTACTOS, type FormDatosPersonales } from './datosPersonales'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  valor: FormDatosPersonales
  onCambio: (valor: FormDatosPersonales) => void
  disabled?: boolean
}

function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {etiqueta}
      {children}
      {ayuda && <span className="text-xs font-normal text-muted-foreground">{ayuda}</span>}
    </label>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{titulo}</legend>
      {children}
    </fieldset>
  )
}

/**
 * Campos de datos personales de un trabajador. Se usa en el alta (FormularioTrabajador)
 * y en el panel de información personal (DatosPersonalesTrabajador). Todo es opcional.
 */
function CamposDatosPersonales({ valor, onCambio, disabled }: Props) {
  const cambiar = <K extends keyof FormDatosPersonales>(campo: K, nuevo: FormDatosPersonales[K]) =>
    onCambio({ ...valor, [campo]: nuevo })

  const contactos = valor.ContactosEmergencia
  const cambiarContacto = (i: number, campo: keyof ContactoEmergencia, nuevo: string) =>
    cambiar('ContactosEmergencia', contactos.map((c, j) => (j === i ? { ...c, [campo]: nuevo } : c)))

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-6">
      <Seccion titulo="Identificación">
        <Campo etiqueta="Fecha de nacimiento">
          <Input type="date" value={valor.FechaNacimiento} onChange={(e) => cambiar('FechaNacimiento', e.target.value)} />
        </Campo>
        <Campo etiqueta="CURP" ayuda="18 caracteres. Debe coincidir con la fecha de nacimiento.">
          <Input
            maxLength={18}
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase"
            value={valor.CURP}
            onChange={(e) => cambiar('CURP', e.target.value.toUpperCase())}
          />
        </Campo>
        <Campo etiqueta="RFC" ayuda="13 caracteres, con homoclave.">
          <Input
            maxLength={13}
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase"
            value={valor.RFC}
            onChange={(e) => cambiar('RFC', e.target.value.toUpperCase())}
          />
        </Campo>
        <Campo etiqueta="Número de Seguridad Social (NSS)" ayuda="11 dígitos.">
          <Input
            inputMode="numeric"
            maxLength={13}
            autoComplete="off"
            className="font-mono"
            value={valor.NSS}
            onChange={(e) => cambiar('NSS', e.target.value)}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Contacto">
        <Campo etiqueta="Celular" ayuda="10 dígitos.">
          <Input type="tel" inputMode="tel" autoComplete="off" value={valor.Celular} onChange={(e) => cambiar('Celular', e.target.value)} />
        </Campo>
        <Campo etiqueta="Correo personal">
          <Input type="email" autoComplete="off" maxLength={120} value={valor.Correo} onChange={(e) => cambiar('Correo', e.target.value)} />
        </Campo>
        <Campo etiqueta="Domicilio" ayuda="Calle y número, colonia, código postal, municipio y estado.">
          <textarea
            rows={3}
            maxLength={300}
            value={valor.Domicilio}
            onChange={(e) => cambiar('Domicilio', e.target.value)}
            className="w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Contactos de emergencia">
        {contactos.length === 0 && <p className="text-sm text-muted-foreground">Sin contactos de emergencia.</p>}

        {contactos.map((contacto, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Contacto {i + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Quitar contacto ${i + 1}`}
                onClick={() => cambiar('ContactosEmergencia', contactos.filter((_, j) => j !== i))}
              >
                <Trash2Icon />
              </Button>
            </div>
            <Campo etiqueta="Nombre">
              <Input maxLength={120} value={contacto.Nombre} onChange={(e) => cambiarContacto(i, 'Nombre', e.target.value)} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Parentesco">
                <Input
                  maxLength={40}
                  placeholder="Madre, esposo…"
                  value={contacto.Parentesco}
                  onChange={(e) => cambiarContacto(i, 'Parentesco', e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Teléfono">
                <Input type="tel" inputMode="tel" value={contacto.Telefono} onChange={(e) => cambiarContacto(i, 'Telefono', e.target.value)} />
              </Campo>
            </div>
          </div>
        ))}

        {contactos.length < MAX_CONTACTOS && (
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => cambiar('ContactosEmergencia', [...contactos, { ...CONTACTO_VACIO }])}
          >
            <PlusIcon data-icon="inline-start" />
            Agregar contacto
          </Button>
        )}
      </Seccion>
    </fieldset>
  )
}

export default CamposDatosPersonales
