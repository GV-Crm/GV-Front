import { Link, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/auth/auth-context'
import { supabase } from '@/lib/supabase'
import { useModulosPermitidos } from '@/modulos'
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

function Sidebar() {
  const { pathname } = useLocation()
  const { session, perfil } = useAuth()
  const { setOpenMobile } = useSidebar()
  const modulos = useModulosPermitidos()

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
              {modulos.map((modulo) => (
                <SidebarMenuItem key={modulo.ruta}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(modulo.ruta)}
                    tooltip={modulo.nombre}
                    // En móvil el menú es un panel encima del contenido: se cierra al navegar.
                    render={<Link to={modulo.ruta} onClick={() => setOpenMobile(false)} />}
                  >
                    <modulo.icono />
                    <span>{modulo.nombre}</span>
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
