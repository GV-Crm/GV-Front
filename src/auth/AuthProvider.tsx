import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AbilityProvider } from '@casl/react'
import type { Session } from '@supabase/supabase-js'
import { ErrorApi, EVENTO_PERMISO_NEGADO, pedirJson } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { AuthContext, type Perfil } from './auth-context'
import { crearAbility } from './permisos'

type PerfilCargado = { usuarioId: string; perfil: Perfil | null; error: string | null }

/** Al regresar a la ventana, los permisos se vuelven a pedir como máximo una vez cada 10 segundos. */
const ESPERA_MINIMA_MS = 10_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [perfilCargado, setPerfilCargado] = useState<PerfilCargado | null>(null)
  // Cada vez que cambia, se vuelven a pedir los permisos a /api/yo.
  const [version, setVersion] = useState(0)
  const ultimaCarga = useRef(0)

  useEffect(() => {
    // El primer evento (INITIAL_SESSION) trae la sesión guardada, así que también marca el fin de la carga.
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSession(nueva)
      setCargandoSesion(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Si un administrador cambia tus permisos, la app se entera sin que tengas que recargar:
  // - cuando el backend te niega algo (403), se piden de nuevo en ese momento;
  // - cuando regresas a la ventana (por si cambiaron mientras no la veías).
  useEffect(() => {
    const recargarYa = () => setVersion((v) => v + 1)
    const recargarSiYaPasoUnRato = () => {
      if (Date.now() - ultimaCarga.current > ESPERA_MINIMA_MS) recargarYa()
    }
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') recargarSiYaPasoUnRato()
    }

    window.addEventListener(EVENTO_PERMISO_NEGADO, recargarYa)
    window.addEventListener('focus', recargarSiYaPasoUnRato)
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => {
      window.removeEventListener(EVENTO_PERMISO_NEGADO, recargarYa)
      window.removeEventListener('focus', recargarSiYaPasoUnRato)
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
  }, [])

  // Por id de usuario y no por token: el token se renueva cada hora y no hace falta volver a pedir el rol.
  const usuarioId = session?.user.id

  useEffect(() => {
    if (!usuarioId) return
    let vigente = true
    ultimaCarga.current = Date.now()

    pedirJson<Perfil>('/api/yo')
      .then((perfil) => {
        if (!vigente) return
        setPerfilCargado((anterior) =>
          // Si nada cambió se conserva el anterior, para no volver a dibujar toda la app.
          anterior?.usuarioId === usuarioId && JSON.stringify(anterior.perfil) === JSON.stringify(perfil)
            ? anterior
            : { usuarioId, perfil, error: null },
        )
      })
      .catch((err: Error) => {
        if (!vigente) return
        setPerfilCargado((anterior) => {
          // Un 403 aquí significa que ya no tiene rol: se le saca. Cualquier otro error (sin internet,
          // servidor caído) no debe sacarlo si ya tenía permisos cargados.
          const perdioElAcceso = err instanceof ErrorApi && err.status === 403
          if (!perdioElAcceso && anterior?.usuarioId === usuarioId && anterior.perfil) return anterior
          return { usuarioId, perfil: null, error: err.message }
        })
      })

    return () => {
      vigente = false
    }
  }, [usuarioId, version])

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
