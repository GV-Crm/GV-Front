export function formatHora(timestamp: string | null) {
  if (!timestamp) return '—'

  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFecha(timestamp: string | null) {
  if (!timestamp) return '—'

  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
