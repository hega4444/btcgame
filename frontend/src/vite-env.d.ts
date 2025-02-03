/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_USE_MOCK_DATA: string
  readonly VITE_FORGET_USER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 