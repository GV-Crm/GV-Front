import { useState, type FormEvent } from 'react'
import { CircleAlertIcon, Loader2Icon, LockKeyholeIcon, LogInIcon, MailIcon } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ENTRADA } from '@/lib/animaciones'
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
    // Fondo con dos manchas de color difuminadas para que no se vea todo blanco.
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <div aria-hidden className="absolute -top-32 -left-32 size-96 rounded-full bg-indigo-300/30 blur-3xl" />
      <div aria-hidden className="absolute -right-32 -bottom-32 size-96 rounded-full bg-violet-300/30 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className={cn('relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border bg-card/90 p-6 shadow-xl backdrop-blur', ENTRADA)}
      >
        <div className="flex flex-col items-center gap-3 pb-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
            GV
          </span>
          <div>
            <h1 className="text-xl font-semibold">Bienvenido a GV One</h1>
            <p className="text-sm text-muted-foreground">Ingresa con el correo y la contraseña que te dieron.</p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Correo
          <span className="relative">
            <MailIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              autoComplete="email"
              required
              autoFocus
              placeholder="tu@correo.com"
              className="h-10 pl-8"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Contraseña
          <span className="relative">
            <LockKeyholeIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              autoComplete="current-password"
              required
              className="h-10 pl-8"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </span>
        </label>

        {error && (
          <p role="alert" className={cn('flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive', ENTRADA)}>
            <CircleAlertIcon className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="h-10" disabled={enviando}>
          {enviando ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <LogInIcon data-icon="inline-start" />}
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}

export default LoginPage
