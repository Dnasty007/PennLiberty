/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Buildium (or other) rental application landing URL — forwarded to renters from rental cards when set. */
  readonly VITE_BUILDIUM_RENTAL_APPLICATION_URL?: string;
  /** Geoapify API key for property address autocomplete on the For Owners form. */
  readonly VITE_GEOAPIFY_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
