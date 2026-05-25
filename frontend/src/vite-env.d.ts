/// <reference types="vite/client" />

interface RuntimeConfig {
  API_BASE_URL?: string;
  LANDING_PAGE_URL?: string;
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

interface ImportMetaEnv {
  readonly VITE_PREVIEW_TARGET_DOMAIN?: string;
  readonly VITE_ELABEL_LANDING_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string
declare const __APP_TITLE__: string
declare const __ENABLE_DEBUG__: boolean
declare const __ENABLE_ANALYTICS__: boolean
declare const __API_BASE_URL__: string

export {};
