import type { ReactNode } from 'react'
import { Popover } from '@base-ui/react/popover'
import { InfoIcon } from 'lucide-react'

/**
 * Ícono (i) que explica para qué sirve algo. Se abre al pasar el mouse o al tocarlo en el celular.
 *
 *   <h2>Distribución del mes <Ayuda>Cuántos días hubo de cada tipo.</Ayuda></h2>
 *
 * No lo pongas dentro de un botón (un botón no puede tener otro botón adentro).
 */
function Ayuda({ children, etiqueta = '¿Qué es esto?' }: { children: ReactNode; etiqueta?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        aria-label={etiqueta}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full align-middle text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <InfoIcon className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} className="z-50">
          <Popover.Popup className="max-w-64 origin-(--transform-origin) rounded-lg bg-popover p-3 text-xs leading-relaxed font-normal text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default Ayuda
