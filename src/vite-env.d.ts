/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Buildium (or other) rental application landing URL — forwarded to renters from rental cards when set. */
  readonly VITE_BUILDIUM_RENTAL_APPLICATION_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
