import { Link, useLocation } from 'react-router-dom'
import { CalendarCheck, LogOut, Package, UserCogIcon, type LucideIcon } from 'lucide-react'
import { useAuth, type Permiso } from '@/auth/auth-context'
import { supabase } from '@/lib/supabase'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

const items: { title: string; to: string; icon: LucideIcon; permiso?: Permiso }[] = [
  { title: 'Asistencias', to: '/asistencias', icon: CalendarCheck },
  { title: 'Trabajadores', to: '/trabajadores', icon: UserCogIcon, permiso: 'gestionar_empleados' },
  { title: 'Inventario', to: '/inventario', icon: Package },
]

function Sidebar() {
  const { pathname } = useLocation()
  const { session, perfil } = useAuth()
  const { setOpenMobile } = useSidebar()

  const visibles = items.filter((item) => !item.permiso || perfil?.permisos.includes(item.permiso))

  return (
    <SidebarRoot collapsible="offcanvas">
      <SidebarHeader>
        <div className="px-2 py-1.5 text-base font-semibold">GV</div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibles.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.to)}
                    tooltip={item.title}
                    // En móvil el menú es un panel encima del contenido: se cierra al navegar.
                    render={<Link to={item.to} onClick={() => setOpenMobile(false)} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 text-xs">
          <p className="truncate font-medium">{perfil?.nombre ?? session?.user.email}</p>
          <p className="truncate text-muted-foreground">
            {perfil?.rol}
            {perfil?.nombre && ` · ${session?.user.email}`}
          </p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Cerrar sesión" onClick={() => supabase.auth.signOut()}>
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  )
}

export default Sidebar
