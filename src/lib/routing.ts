import type { PageKey } from "./data";

/** Production domain — use for QR codes and printed materials. */
export const SITE_ORIGIN = "https://pennlibertyre.com";

export type AppRoute = {
  page: PageKey;
  rentalSlug?: string;
  listingSlug?: string;
};

const PAGE_PATHS: Record<PageKey, string> = {
  home: "/",
  "property-management": "/for-owners",
  rentals: "/rentals",
  listings: "/listings",
  team: "/about",
  contact: "/contact",
};

/** Accept legacy or alternate path segments when parsing inbound links. */
const SEGMENT_TO_PAGE: Record<string, PageKey> = {
  home: "home",
  rentals: "rentals",
  listings: "listings",
  contact: "contact",
  about: "team",
  team: "team",
  "for-owners": "property-management",
  "property-management": "property-management",
};

function parsePathSegments(segments: string[]): AppRoute {
  if (segments.length === 0) {
    return { page: "home" };
  }

  const [first, second] = segments;
  const page = SEGMENT_TO_PAGE[first.toLowerCase()];

  if (!page) {
    return { page: "home" };
  }

  if (page === "rentals" && second) {
    return { page: "rentals", rentalSlug: decodeURIComponent(second) };
  }

  if (page === "listings" && second) {
    return { page: "listings", listingSlug: decodeURIComponent(second) };
  }

  return { page };
}

/**
 * Resolve the current browser location into an in-app route.
 * Supports pathname links (best for QR), hash links, and query fallbacks.
 */
export function parseAppRoute(
  pathname: string,
  search = "",
  hash = "",
): AppRoute {
  const params = new URLSearchParams(search);
  const rentalParam = params.get("rental")?.trim();
  if (rentalParam) {
    return { page: "rentals", rentalSlug: rentalParam };
  }

  const listingParam = params.get("listing")?.trim();
  if (listingParam) {
    return { page: "listings", listingSlug: listingParam };
  }

  if (hash.startsWith("#/")) {
    const hashPath = hash.slice(2).split("?")[0];
    return parsePathSegments(hashPath.split("/").filter(Boolean));
  }

  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/") {
    return { page: "home" };
  }

  return parsePathSegments(normalized.split("/").filter(Boolean));
}

/** Build a shareable path for the given route (no origin). */
export function buildAppPath(route: AppRoute): string {
  if (route.rentalSlug) {
    return `/rentals/${encodeURIComponent(route.rentalSlug)}`;
  }

  if (route.listingSlug) {
    return `/listings/${encodeURIComponent(route.listingSlug)}`;
  }

  return PAGE_PATHS[route.page];
}

/** Full URL for the Rentals browse page (all units). */
export function rentalsPageDeepLink(origin = SITE_ORIGIN): string {
  return `${origin}${PAGE_PATHS.rentals}`;
}

/** Full URL for a rental QR code or yard-sign link. */
export function rentalDeepLink(slug: string, origin = SITE_ORIGIN): string {
  return `${origin}${buildAppPath({ page: "rentals", rentalSlug: slug })}`;
}

export type RentalQrTarget = {
  slug: string;
  title: string;
  url: string;
};

/** Build QR targets for every rental plus the all-rentals page. */
export function buildRentalQrTargets(
  rentals: ReadonlyArray<{ slug: string; title: string }>,
  origin = SITE_ORIGIN,
): RentalQrTarget[] {
  return [
    {
      slug: "all-rentals",
      title: "All Rentals",
      url: rentalsPageDeepLink(origin),
    },
    ...rentals.map((rental) => ({
      slug: rental.slug,
      title: rental.title,
      url: rentalDeepLink(rental.slug, origin),
    })),
  ];
}

export function readBrowserRoute(): AppRoute {
  return parseAppRoute(
    window.location.pathname,
    window.location.search,
    window.location.hash,
  );
}

export function syncBrowserUrl(route: AppRoute, replace = false): void {
  const nextPath = buildAppPath(route);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (current === nextPath) {
    return;
  }

  const state = { route: nextPath };
  if (replace) {
    window.history.replaceState(state, "", nextPath);
  } else {
    window.history.pushState(state, "", nextPath);
  }
}
