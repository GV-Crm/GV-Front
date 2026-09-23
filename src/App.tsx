import { Navigate, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AsistenciasHome from './modules/asistencias/AsistenciasHome'
import AsistenciaEmpleados from './modules/asistencias/AsistenciaEmpleados'
import InventarioPage from './modules/inventario/InventarioPage'

function App() {
  return (
    <SidebarProvider>
      <Sidebar />

      {/* min-w-0: sin esto el contenido ancho (carrusel, tablas) estira el main más allá de la ventana. */}
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>

        <div className="flex flex-1 flex-col p-4">
          <Routes>
            {/* Sin esto la app abre en blanco: no hay nada en "/". */}
            <Route path="/" element={<Navigate to="/asistencias" replace />} />
            <Route path="/asistencias" element={<AsistenciasHome />} />
            <Route path="/asistencias/:uuid" element={<AsistenciaEmpleados />} />
            <Route path="/inventario" element={<InventarioPage />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
