import { useCallback, useRef, useState } from "react";

/**
 * Site-wide sky behind every page (Light / Dark toggle).
 * `public/backgrounds/day/` — 3 photos · `public/backgrounds/night/` — 3 photos
 */
export const dayBackdropPool = [
  "/backgrounds/day/day-1.jpg",
  "/backgrounds/day/day-2.jpg",
  "/backgrounds/day/day-3.jpg",
] as const;

export const nightBackdropPool = [
  "/backgrounds/night/night-1.jpg",
  "/backgrounds/night/night-2.jpg",
  "/backgrounds/night/night-3.jpg",
] as const;

/** Per-file crop for the site-wide `.site-backdrop` (defaults in `index.css`). */
export const siteBackdropFramingBySrc: Record<
  string,
  { backgroundSize?: string; backgroundPosition?: string }
> = {
  "/backgrounds/day/day-3.jpg": { backgroundSize: "100%", backgroundPosition: "100% 25%" },
};

/** For Owners page — local photography under `public/owners/`. */
export const ownersPageBackdropPool = [
  "/owners/owners-1.jpg",
  "/owners/owners-2.jpg",
  "/owners/owners-3.jpg",
] as const;

/** For Owners page DARK MODE — under `public/owners/dark/`. */
export const ownersPageBackdropDarkPool = [
  "/owners/dark/owners-1.jpg",
  "/owners/dark/owners-2.jpg",
  "/owners/dark/owners-3.jpg",
] as const;

/** Same pool as shell backdrop (dev tool can cycle without refresh). */
export const ownersCoverageEditorialPool = ownersPageBackdropPool;

/** Per-file crop/zoom for the metro coverage `<img>` (one element, three photos). */
export const ownersCoverageFramingBySrc: Record<string, { objectPosition: string; scale?: number }> = {
  "/owners/owners-1.jpg": { objectPosition: "50% 81%" },
  "/owners/owners-2.jpg": { objectPosition: "50% 80%" },
  "/owners/owners-3.jpg": { objectPosition: "50% 81%", scale: 1.06 },
  // Dark mode
  "/owners/dark/owners-1.jpg": { objectPosition: "50% 50%" },
  "/owners/dark/owners-2.jpg": { objectPosition: "50% 50%" },
  "/owners/dark/owners-3.jpg": { objectPosition: "50% 50%" },
};

/** @deprecated Prefer `ownersPageBackdropPool` on the For Owners page. */
export const ownersBackdropPool = ownersPageBackdropPool;

export const homeBackdropPool = dayBackdropPool;

/**
 * Site-wide backdrop layer (see `index.css` → `.site-backdrop` for size/position/attachment).
 * Used when `theme.showBackdrop` is true (Light / Dark display modes).
 */
export const siteBackdropImageClass =
  "site-backdrop pointer-events-none fixed inset-0 z-0 transition-opacity duration-700";

/** For Owners hero card — `.owners-card-backdrop` in index.css (no fixed attachment). */
export const ownersCardBackdropImageClass = "owners-card-backdrop absolute inset-0";

/**
 * Rentals section hero — local photography under `public/rentals-hero/`.
 * Add any number of images here; the dev tool lets you cycle through them
 * without a page refresh (Next page image button).
 */
export const rentalsHeroPool = [
  "/rentals-hero/rentals-1.jpg",
  "/rentals-hero/rentals-2.jpg",
  "/rentals-hero/rentals-3.jpg",
] as const;

/** Rentals hero DARK MODE — backgrounds in `public/rentals-hero/dark/`, collages in `dark/overlays/`. */
export const rentalsHeroDarkPool = [
  "/rentals-hero/dark/rentals-1.jpg",
  "/rentals-hero/dark/rentals-2.jpg",
  "/rentals-hero/dark/rentals-3.jpg",
] as const;

/** Blank hero base — collage overlays only (Light rentals-1). Dark rentals-1 keeps ferris wheel bg. */
export const rentalsHeroBlankBaseSrc = new Set<string>(["/rentals-hero/rentals-1.jpg"]);

/**
 * Per-image framing for the Rentals hero background.
 * backgroundSize: "cover" fills the panel (default), use "80%" etc. to zoom out and show more.
 * backgroundPosition: "X% Y%" controls which part of the image is centered.
 * Use Image Mode in the dev editor (drag to pan, zoom slider) then lock values in here.
 */
export const rentalsHeroFramingBySrc: Record<string, { backgroundSize?: string; backgroundPosition?: string }> = {
  // Light mode
  "/rentals-hero/rentals-1.jpg": { backgroundSize: "101%", backgroundPosition: "100% 22%" },
  "/rentals-hero/rentals-2.jpg": { backgroundSize: "101%", backgroundPosition: "100% 75%" },
  "/rentals-hero/rentals-3.jpg": { backgroundSize: "cover", backgroundPosition: "50% 80%" },
  // Dark mode
  "/rentals-hero/dark/rentals-1.jpg": { backgroundSize: "100%", backgroundPosition: "50% 50%" },
  "/rentals-hero/dark/rentals-2.jpg": { backgroundSize: "100%", backgroundPosition: "100% 56%" },
  "/rentals-hero/dark/rentals-3.jpg": { backgroundSize: "100%", backgroundPosition: "100% 67%" },
};

/**
 * Permanent collage overlays for each rentals hero image.
 * Created via Collage Mode in dev, then locked in here.
 */
export type RentalsCollageOverlay = {
  src: string;
  top: number;
  left: number;
  width: number;
  height: number;
  opacity: number;
  blendMode: string;
  zIndex: number;
  scale?: number;
};

const rentals1TwoPanelCollage = (overlayDir: "/rentals-hero/overlays" | "/rentals-hero/dark/overlays") =>
  [
    {
      src: `${overlayDir}/overlay-1.jpg`,
      top: 0,
      left: 0,
      width: 62.34019287769368,
      height: 100,
      opacity: 1,
      blendMode: "normal",
      zIndex: 0,
    },
    {
      src: `${overlayDir}/overlay-2.jpg`,
      top: 0,
      left: 61.68472097049463,
      width: 38.77573073063044,
      height: 100,
      opacity: 1,
      blendMode: "normal",
      zIndex: 1,
    },
  ] as const satisfies readonly RentalsCollageOverlay[];

export const rentalsHeroCollageOverlays: Record<string, RentalsCollageOverlay[]> = {
  // Light mode — rentals-1: Eagles (left) + Phillies (right)
  "/rentals-hero/rentals-1.jpg": [...rentals1TwoPanelCollage("/rentals-hero/overlays")],
  "/rentals-hero/rentals-2.jpg": [
    {
      src: "/rentals-hero/overlays/overlay-2.jp.jpg",
      top: 24.8,
      left: 69.6,
      width: 30.6,
      height: 76.3,
      opacity: 0.75,
      blendMode: "normal",
      zIndex: 0,
      scale: 1.04,
    },
  ],
  "/rentals-hero/rentals-3.jpg": [
    {
      src: "/rentals-hero/overlays/overlay-3.jpg",
      top: 0,
      left: 80.9,
      width: 19.8,
      height: 100,
      opacity: 0.85,
      blendMode: "normal",
      zIndex: 0,
    },
  ],
  // Dark mode — rentals-1: 3 street panels @ 0.65 (not Eagles/Phillies)
  "/rentals-hero/dark/rentals-1.jpg": [
    {
      src: "/rentals-hero/dark/overlays/overlay-1.jpg",
      top: 0,
      left: 70.31610994305308,
      width: 30,
      height: 100,
      opacity: 0.65,
      blendMode: "normal",
      zIndex: 0,
    },
    {
      src: "/rentals-hero/dark/overlays/overlay-2.jpg",
      top: 0,
      left: 30.079479213147952,
      width: 40.32333758120799,
      height: 100,
      opacity: 0.65,
      blendMode: "normal",
      zIndex: 1,
    },
    {
      src: "/rentals-hero/dark/overlays/overlay-3.jpg",
      top: 0,
      left: 0,
      width: 30,
      height: 100,
      opacity: 0.65,
      blendMode: "normal",
      zIndex: 2,
    },
  ],
  "/rentals-hero/dark/rentals-2.jpg": [],
  "/rentals-hero/dark/rentals-3.jpg": [],
};

/**
 * Wide distant skyline for the listings map teaser — bundled under `/public` so it always
 * resolves (no remote outages / PATH-length issues during local dev).
 */
/** Listings page map hero only — not the site-wide sky (see `public/listings/`). */
export const listingsMapTeaserDefaultSrc = "/listings/teaser-1.jpg" as const;

export const listingsMapTeaserPool = [
  listingsMapTeaserDefaultSrc,
  "/listings/teaser-2.jpg",
] as const;

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

/** Dev: cycle pool index without reload. Prod: stable random only. */
export function usePoolIndexCycler(poolLength: number) {
  const stableIdx = useStablePoolIndex(poolLength);
  const [devIdx, setDevIdx] = useState<number | null>(null);

  const idx = import.meta.env.DEV && devIdx !== null ? devIdx : stableIdx;

  const cycle = useCallback(() => {
    if (poolLength <= 1) return;
    setDevIdx((prev) => {
      const base = prev ?? stableIdx;
      return (base + 1) % poolLength;
    });
  }, [poolLength, stableIdx]);

  return {
    idx,
    cycle,
    canCycle: import.meta.env.DEV && poolLength > 1,
  };
}
