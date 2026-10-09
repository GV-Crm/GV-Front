import { ShieldAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

function SinAcceso({ correo, mensaje }: { correo?: string; mensaje: string | null }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border bg-background p-6 text-center shadow-sm">
        <span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <ShieldAlertIcon className="size-6" />
        </span>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">No puedes entrar todavía</h1>
          <p className="text-sm text-muted-foreground">{mensaje ?? 'No se pudo comprobar tu rol.'}</p>
          {correo && <p className="text-xs text-muted-foreground">Sesión: {correo}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
          <Button onClick={() => supabase.auth.signOut()}>Cerrar sesión</Button>
        </div>
      </div>
    </div>
  )
}

export default SinAcceso
