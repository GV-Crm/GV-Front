import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

/** Debe coincidir con `Permiso` en gv-one (`src/lib/supabase/auth.ts`). */
export type Permiso = 'gestionar_empleados' | 'justificar_faltas'

export type Perfil = { correo: string; nombre: string | null; rol: string; permisos: Permiso[] }

export type AuthState = {
  session: Session | null
  /** Rol del usuario; `null` si no tiene sesión o el backend le negó el acceso (ver `errorPerfil`). */
  perfil: Perfil | null
  errorPerfil: string | null
  cargando: boolean
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return valor
}

export function usePermiso(permiso: Permiso): boolean {
  return useAuth().perfil?.permisos.includes(permiso) ?? false
}
