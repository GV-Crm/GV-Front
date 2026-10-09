import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AbilityProvider } from '@casl/react'
import type { Session } from '@supabase/supabase-js'
import { pedirJson } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { AuthContext, type Perfil } from './auth-context'
import { crearAbility } from './permisos'

type PerfilCargado = { usuarioId: string; perfil: Perfil | null; error: string | null }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [perfilCargado, setPerfilCargado] = useState<PerfilCargado | null>(null)

  useEffect(() => {
    // El primer evento (INITIAL_SESSION) trae la sesión guardada, así que también marca el fin de la carga.
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSession(nueva)
      setCargandoSesion(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Por id de usuario y no por token: el token se renueva cada hora y no hace falta volver a pedir el rol.
  const usuarioId = session?.user.id

  useEffect(() => {
    if (!usuarioId) return
    let vigente = true
    pedirJson<Perfil>('/api/yo')
      .then((perfil) => vigente && setPerfilCargado({ usuarioId, perfil, error: null }))
      .catch((err: Error) => vigente && setPerfilCargado({ usuarioId, perfil: null, error: err.message }))
    return () => {
      vigente = false
    }
  }, [usuarioId])

  const actual = usuarioId && perfilCargado?.usuarioId === usuarioId ? perfilCargado : null
  const perfil = actual?.perfil ?? null

  // Los permisos del usuario en formato CASL. Sin perfil, no puede nada.
  const ability = useMemo(() => crearAbility(perfil?.reglas ?? []), [perfil])

  return (
    <AuthContext.Provider
      value={{
        session,
        perfil,
        errorPerfil: actual?.error ?? null,
        cargando: cargandoSesion || (Boolean(usuarioId) && !actual),
      }}
    >
      <AbilityProvider value={ability}>{children}</AbilityProvider>
    </AuthContext.Provider>
  )
}
