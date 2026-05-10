import { useRef } from "react";

/** Daytime, sky-forward Philadelphia-area editorial URLs (matched exposure across routes). */

export const ownersBackdropPool = [
  "https://images.unsplash.com/photo-1578073273384-02612e23b4ea?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1559406041-c7d2bbf2fd1c?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2400&q=85",
] as const;

/**
 * Philly skyline teaser — bundled under `/public` so hero always resolves (Rentals relied on
 * Unsplash URLs that often 404 or block remotely, yielding an empty-looking black hero).
 */
export const rentalsHeroDefaultSrc = "/listings-philly-map-teaser.png" as const;

export const rentalsHeroPool = [rentalsHeroDefaultSrc] as const;

/**
 * Wide distant skyline for the listings map teaser — bundled under `/public` so it always
 * resolves (no Unsplash outages / PATH-length issues during local dev).
 */
export const listingsMapTeaserDefaultSrc = "/listings-philly-map-teaser.png" as const;

/** Single stable pick; kept as a tuple so `pickFromPool` + `useStablePoolIndex` stay unchanged at call sites. */
export const listingsMapTeaserPool = [listingsMapTeaserDefaultSrc] as const;

/** @deprecated Use listingsMapTeaserPool */
export const listingsHeroPool = listingsMapTeaserPool;

export const homeBackdropPool = [
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1578073273384-02612e23b4ea?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2400&q=85",
] as const;

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
