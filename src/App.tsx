import { Navigate, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from './auth/auth-context'
import LoginPage from './modules/auth/LoginPage'
import SinAcceso from './modules/auth/SinAcceso'
import { useModulosPermitidos } from './modulos'

function SinModulos() {
  return (
    <div className="rounded-xl border border-dashed px-6 py-16 text-center">
      <p className="font-medium">Tu rol todavía no tiene módulos asignados</p>
      <p className="mt-1 text-sm text-muted-foreground">Pide a un administrador que te dé permisos.</p>
    </div>
  )
}

function AppLayout() {
  // Solo se crean las rutas de los módulos que el usuario puede abrir (ver src/modulos.ts).
  const modulos = useModulosPermitidos()
  const inicio = modulos[0]

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
            {/* En "/" se abre el primer módulo permitido. */}
            <Route path="/" element={inicio ? <Navigate to={inicio.ruta} replace /> : <SinModulos />} />
            {modulos.map((modulo) => (
              <Route key={modulo.ruta} path={`${modulo.ruta}/*`} element={<modulo.pagina />} />
            ))}
            {/* Cualquier otra dirección (o un módulo sin permiso) regresa al inicio. */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
