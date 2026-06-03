import { useRef } from "react";

/** Local Philadelphia backdrops under `public/backdrops/` (served at `/backdrops/...`). */

export const dayBackdropPool = [
  "/backdrops/philly-day-1.jpg",
  "/backdrops/philly-day-2.jpg",
  "/backdrops/philly-day-3.jpg",
] as const;

export const nightBackdropPool = [
  "/backdrops/philly-night-1.jpg",
  "/backdrops/philly-night-2.jpg",
  "/backdrops/philly-night-3.jpg",
] as const;

export const ownersBackdropPool = dayBackdropPool;
export const homeBackdropPool = dayBackdropPool;

/**
 * Site-wide backdrop layer (see `index.css` → `.site-backdrop` for size/position/attachment).
 * Used when `theme.showBackdrop` is true (Light / Dark display modes).
 */
export const siteBackdropImageClass =
  "site-backdrop fixed inset-0 z-0 transition-all duration-700";

/** For Owners hero card — `.owners-card-backdrop` in index.css (no fixed attachment). */
export const ownersCardBackdropImageClass = "owners-card-backdrop absolute inset-0";

/**
 * Philly skyline teaser — bundled under `/public` so hero always resolves (Rentals relied on
 * remote URLs that often 404 or block, yielding an empty-looking black hero).
 */
export const rentalsHeroPool = ["/backdrops/grok-076dd323-5369-436e-b9a0-38d68ec62a9a.jpg"] as const;

/**
 * Wide distant skyline for the listings map teaser — bundled under `/public` so it always
 * resolves (no remote outages / PATH-length issues during local dev).
 */
export const listingsMapTeaserDefaultSrc = "/backdrops/philly-day-6.jpg" as const;

/** Single stable pick; kept as a tuple so `pickFromPool` + `useStablePoolIndex` stay unchanged at call sites. */
export const listingsMapTeaserPool = [listingsMapTeaserDefaultSrc] as const;

/** @deprecated Use listingsMapTeaserPool */
export const listingsHeroPool = listingsMapTeaserPool;

export function pickFromPool<const T extends readonly string[]>(pool: T, index: number): T[number] {
  return pool[((index % pool.length) + pool.length) % pool.length]!;
}

/** One stable random index per document load (SPA session); survives React Strict Mode. */
export function useStablePoolIndex(poolLength: number): number {
  const ref = useRef<number | null>(null);
  if (poolLength <= 1) return 0;
  if (ref.current === null) {
    ref.current = Math.floor(Math.random() * poolLength);
  }
  return ref.current;
}
