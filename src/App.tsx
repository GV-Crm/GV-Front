import { Navigate, Routes, Route } from 'react-router-dom'
import { LockKeyholeIcon } from 'lucide-react'
import { cn } from 'cn'
import Sidebar from './components/Sidebar'
import UsuarioMenu from './components/UsuarioMenu'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from './auth/auth-context'
import { ENTRADA } from './lib/animaciones'
import LoginPage from './modules/auth/LoginPage'
import SinAcceso from './modules/auth/SinAcceso'
import { useModuloActual, useModulosPermitidos } from './modulos'

function SinModulos() {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center', ENTRADA)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <LockKeyholeIcon className="size-6" />
      </span>
      <p className="font-medium">Tu rol todavía no tiene módulos asignados</p>
      <p className="text-sm text-muted-foreground">Pide a un administrador que te dé permisos.</p>
    </div>
  )
}

/** Barra de arriba: botón del menú, en qué módulo estás y (en el celular) tu cuenta. */
function BarraSuperior() {
  const modulo = useModuloActual()

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur sm:h-14 sm:px-4">
      <SidebarTrigger />
      {modulo && (
        <div key={modulo.ruta} className={cn('flex min-w-0 items-center gap-2', ENTRADA)}>
          <span className={cn('flex size-7 items-center justify-center rounded-lg', modulo.color)}>
            <modulo.icono className="size-4" />
          </span>
          <span className="truncate text-sm font-semibold">{modulo.nombre}</span>
        </div>
      )}
      {/* En pantallas grandes la cuenta ya se ve en el menú lateral. */}
      <div className="ml-auto md:hidden">
        <UsuarioMenu compacto />
      </div>
    </header>
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
        <BarraSuperior />

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
