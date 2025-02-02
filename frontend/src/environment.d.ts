/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCK_DATA: string;
  readonly MODE: string;
  readonly DEV: boolean;
  // add more env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {}; 