import { useState, type FormEvent } from 'react'
import { CircleAlertIcon, Loader2Icon, LockKeyholeIcon, LogInIcon, MailIcon } from 'lucide-react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/auth/auth-context'
import { ENTRADA } from '@/lib/animaciones'
import { supabase } from '@/lib/supabase'

function LoginPage() {
  // true en cuanto se inicia sesión: el formulario se aleja y se desvanece mientras entra la bienvenida.
  const { mostrarBienvenida: entrando } = useAuth()
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
      <div aria-hidden className="absolute -top-32 -left-32 size-96 rounded-full bg-blue-300/25 blur-3xl" />
      <div aria-hidden className="absolute -right-32 -bottom-32 size-96 rounded-full bg-slate-300/40 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className={cn(
          'relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border bg-card/90 p-6 shadow-xl backdrop-blur',
          entrando
            ? 'motion-safe:animate-out motion-safe:fade-out-0 motion-safe:zoom-out-90 motion-safe:blur-sm motion-safe:duration-500 motion-safe:fill-mode-forwards'
            : ENTRADA,
        )}
      >
        <div className="flex flex-col items-center gap-3 pb-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25">
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
