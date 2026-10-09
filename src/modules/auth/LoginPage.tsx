import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

function LoginPage() {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena })

    setEnviando(false)
    if (error) {
      setError(error.code === 'invalid_credentials' ? 'Correo o contraseña incorrectos' : error.message)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border bg-background p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground">Ingresa con tu correo y contraseña.</p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Correo
          <Input
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Contraseña
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}

export default LoginPage
