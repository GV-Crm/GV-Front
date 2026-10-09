/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del backend (GV-Back), sin `/` al final. */
  readonly VITE_API_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
