import { Link, useLocation } from 'react-router-dom'
import { CalendarCheck, Package } from 'lucide-react'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

const items = [
  { title: 'Asistencias', to: '/asistencias', icon: CalendarCheck },
  { title: 'Inventario', to: '/inventario', icon: Package },
]

function Sidebar() {
  const { pathname } = useLocation()

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
              {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.to)}
                    tooltip={item.title}
                    render={<Link to={item.to} />}
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

      <SidebarRail />
    </SidebarRoot>
  )
}

export default Sidebar
