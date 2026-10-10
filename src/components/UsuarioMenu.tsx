import { useNavigate } from 'react-router-dom'
import { ChevronsUpDownIcon, LogOutIcon, UserRoundIcon } from 'lucide-react'
import { cn } from 'cn'
import { useAuth } from '@/auth/auth-context'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Círculo con la foto (o iniciales) del usuario. Al tocarlo muestra su nombre, correo y rol,
 * y los botones para ir a Mi perfil (ahí ve lo que puede hacer) y para cerrar sesión.
 *
 * `compacto`: solo el círculo (para la barra de arriba en el celular).
 */
function UsuarioMenu({ compacto = false }: { compacto?: boolean }) {
  const { session, perfil } = useAuth()
  const navigate = useNavigate()

  const nombre = perfil?.nombre?.trim() || session?.user.email || 'Usuario'

  const avatar = (
    <span className="relative">
      <Avatar nombre={nombre} foto={perfil?.avatar} className={compacto ? 'size-8' : 'size-10 text-base'} />
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
          <Avatar nombre={nombre} foto={perfil?.avatar} className="size-12 text-lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{nombre}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.user.email}</p>
            <Badge className="mt-1 bg-primary/10 text-primary">{perfil?.rol}</Badge>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('/perfil')}>
          <UserRoundIcon />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => supabase.auth.signOut()}>
          <LogOutIcon />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UsuarioMenu
