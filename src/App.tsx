import { Navigate, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth, usePermiso } from './auth/auth-context'
import LoginPage from './modules/auth/LoginPage'
import SinAcceso from './modules/auth/SinAcceso'
import AsistenciasHome from './modules/asistencias/AsistenciasHome'
import AsistenciaEmpleados from './modules/asistencias/AsistenciaEmpleados'
import InventarioPage from './modules/inventario/InventarioPage'
import TrabajadoresPage from './modules/trabajadores/TrabajadoresPage'

function AppLayout() {
  const puedeGestionar = usePermiso('gestionar_empleados')

  return (
    <SidebarProvider>
      <Sidebar />

      {/* min-w-0: sin esto el contenido ancho (carrusel, tablas) estira el main más allá de la ventana. */}
      <SidebarInset className="min-w-0">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 sm:h-14 sm:px-4">
          <SidebarTrigger />
        </header>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <Routes>
            {/* Sin esto la app abre en blanco: no hay nada en "/". */}
            <Route path="/" element={<Navigate to="/asistencias" replace />} />
            <Route path="/asistencias" element={<AsistenciasHome />} />
            <Route path="/asistencias/:uuid" element={<AsistenciaEmpleados />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route
              path="/trabajadores"
              element={puedeGestionar ? <TrabajadoresPage /> : <Navigate to="/asistencias" replace />}
            />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function App() {
  const { session, perfil, errorPerfil, cargando } = useAuth()

  if (cargando) return null

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="*"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : perfil ? (
            <AppLayout />
          ) : (
            <SinAcceso correo={session.user.email} mensaje={errorPerfil} />
          )
        }
      />
    </Routes>
  )
}

export default App
