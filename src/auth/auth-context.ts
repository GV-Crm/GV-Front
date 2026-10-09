import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Regla } from './permisos'

/** Lo que responde /api/yo: quién es el usuario y qué puede hacer. */
export type Perfil = { correo: string; nombre: string | null; rol: string; reglas: Regla[] }

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
