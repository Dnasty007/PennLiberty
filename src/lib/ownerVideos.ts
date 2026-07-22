/** Owner Info video library — process explainers for For Owners. */

export type OwnerVideoAudience = "owners" | "residents" | "company" | "ops";

export type OwnerVideo = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  /** Runtime in seconds */
  runtimeSec: number;
  audience: OwnerVideoAudience[];
  src: string;
  poster: string;
  featured?: boolean;
  order: number;
};

const BASE = "/videos/owner-library";

export const ownerVideos: OwnerVideo[] = [
  {
    id: "01",
    slug: "who-we-are",
    title: "Who we are",
    blurb: "Penn Liberty Real Estate — Philadelphia property management, since 2009.",
    runtimeSec: 68,
    audience: ["company", "owners"],
    src: `${BASE}/01-who-we-are.mp4`,
    poster: `${BASE}/posters/01-who-we-are.jpg`,
    featured: true,
    order: 1,
  },
  {
    id: "02",
    slug: "owner-onboarding",
    title: "Owner onboarding",
    blurb: "How a property moves from agreement into day-to-day management.",
    runtimeSec: 65,
    audience: ["owners", "ops"],
    src: `${BASE}/02-owner-onboarding.mp4`,
    poster: `${BASE}/posters/02-owner-onboarding.jpg`,
    order: 2,
  },
  {
    id: "03",
    slug: "maintenance",
    title: "How we handle maintenance",
    blurb: "Request → triage → work → close. Not a pile of texts.",
    runtimeSec: 65,
    audience: ["owners", "residents", "ops"],
    src: `${BASE}/03-maintenance.mp4`,
    poster: `${BASE}/posters/03-maintenance.jpg`,
    order: 3,
  },
  {
    id: "04",
    slug: "tenant-placement-screening",
    title: "Tenant placement & screening",
    blurb: "Full application, consent-based screening, documented decision — process only.",
    runtimeSec: 70,
    audience: ["owners", "ops"],
    src: `${BASE}/04-tenant-placement-screening.mp4`,
    poster: `${BASE}/posters/04-tenant-placement-screening.jpg`,
    order: 4,
  },
  {
    id: "09",
    slug: "tax-rental-license-notice",
    title: "Tax & rental license notices",
    blurb: "Why tax clearance blocks licensing — and what owners need to complete.",
    runtimeSec: 66,
    audience: ["owners", "ops"],
    src: `${BASE}/09-tax-rental-license-notice.mp4`,
    poster: `${BASE}/posters/09-tax-rental-license-notice.jpg`,
    order: 5,
  },
];

export function formatRuntime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `0:${s.toString().padStart(2, "0")}`;
}

export function getFeaturedOwnerVideo(): OwnerVideo {
  return ownerVideos.find((v) => v.featured) ?? ownerVideos[0];
}

export function getGridOwnerVideos(): OwnerVideo[] {
  const featured = getFeaturedOwnerVideo();
  return ownerVideos
    .filter((v) => v.id !== featured.id)
    .sort((a, b) => a.order - b.order);
}
