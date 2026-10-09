import { Link, useLocation } from 'react-router-dom'
import { cn } from 'cn'
import { useModulosPermitidos } from '@/modulos'
import UsuarioMenu from '@/components/UsuarioMenu'
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
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'

function Sidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const modulos = useModulosPermitidos()

  return (
    <SidebarRoot collapsible="offcanvas">
      {/* Arriba: quién eres. Al tocarlo se ve tu rol, tus permisos y "Cerrar sesión". */}
      <SidebarHeader className="p-3">
        <UsuarioMenu />
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {modulos.map((modulo) => {
                const activo = pathname.startsWith(modulo.ruta)
                return (
                  <SidebarMenuItem key={modulo.ruta}>
                    <SidebarMenuButton
                      size="lg"
                      isActive={activo}
                      tooltip={modulo.nombre}
                      className="gap-3 transition-all duration-200 hover:translate-x-0.5"
                      // En móvil el menú es un panel encima del contenido: se cierra al navegar.
                      render={<Link to={modulo.ruta} onClick={() => setOpenMobile(false)} />}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200',
                          modulo.color,
                          activo && 'scale-110 shadow-sm',
                        )}
                      >
                        <modulo.icono className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{modulo.nombre}</span>
                        <span className="block truncate text-xs font-normal text-muted-foreground">{modulo.descripcion}</span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex size-6 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-violet-500 text-[10px] font-bold text-white">
            GV
          </span>
          GV One
        </div>
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  )
}

export default Sidebar
