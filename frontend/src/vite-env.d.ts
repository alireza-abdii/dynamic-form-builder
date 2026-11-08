/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAS_URL: string;
  readonly VITE_PUBLIC_BASE_URL: string;
  readonly VITE_BOT_USERNAME: string;
  readonly VITE_TMA_SHORTNAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

