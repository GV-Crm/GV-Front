import { useAbility } from '@casl/react'
import { ChevronsUpDownIcon, LogOutIcon, SparklesIcon } from 'lucide-react'
import { cn } from 'cn'
import { useAuth } from '@/auth/auth-context'
import { PERMISOS, type AppAbility } from '@/auth/permisos'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Círculo con las iniciales del usuario. Al tocarlo muestra su nombre, correo, rol,
 * lo que puede hacer en el sistema y el botón para cerrar sesión.
 *
 * `compacto`: solo el círculo (para la barra de arriba en el celular).
 */
function UsuarioMenu({ compacto = false }: { compacto?: boolean }) {
  const { session, perfil } = useAuth()
  const ability = useAbility<AppAbility>()

  const nombre = perfil?.nombre?.trim() || session?.user.email || 'Usuario'
  const esAdmin = ability.can('manage', 'all')
  const permitidos = PERMISOS.filter((p) => ability.can(p.accion, p.recurso))

  const avatar = (
    <span className="relative">
      <Avatar nombre={nombre} className={compacto ? 'size-8' : 'size-10 text-base'} />
      {/* Punto verde: sesión activa. */}
      <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-emerald-500" />
    </span>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Tu cuenta"
            className={cn(
              'outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              compacto
                ? 'rounded-full'
                : 'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-sidebar-accent data-popup-open:bg-sidebar-accent',
            )}
          />
        }
      >
        {avatar}
        {!compacto && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{nombre}</span>
              <span className="block truncate text-xs text-muted-foreground">{perfil?.rol}</span>
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={compacto ? 'end' : 'start'} className="w-72">
        <div className="flex items-center gap-3 p-2">
          <Avatar nombre={nombre} className="size-12 text-lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{nombre}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.user.email}</p>
            <Badge className="mt-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{perfil?.rol}</Badge>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Lo que puedes hacer</DropdownMenuLabel>
          {esAdmin && (
            <p className="flex items-center gap-1.5 px-2 pb-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              <SparklesIcon className="size-3.5" />
              Acceso total al sistema
            </p>
          )}
          <ul className="space-y-1 px-2 pb-1">
            {permitidos.map((p) => (
              <li key={`${p.accion}:${p.recurso}`} className="flex items-center gap-2 text-sm">
                <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <p.icono className="size-3.5" />
                </span>
                {p.texto}
              </li>
            ))}
            {permitidos.length === 0 && <li className="text-xs text-muted-foreground">Todavía no tienes permisos.</li>}
          </ul>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={() => supabase.auth.signOut()}>
          <LogOutIcon />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UsuarioMenu
