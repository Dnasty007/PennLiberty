/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Buildium (or other) rental application landing URL — forwarded to renters from rental cards when set. */
  readonly VITE_BUILDIUM_RENTAL_APPLICATION_URL?: string;
  /** Geoapify API key for property address autocomplete on the For Owners form. */
  readonly VITE_GEOAPIFY_API_KEY?: string;
  /** Supabase project URL — enables Penn Liberty Arcade Hall of Fame (global high scores). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon/public key — safe for browser; pair with RLS policies in supabase/arcade_scores.sql. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
