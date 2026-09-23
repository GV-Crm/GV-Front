/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del backend (GV-Back), sin `/` al final. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
