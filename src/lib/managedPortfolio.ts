/**
 * Managed-portfolio address match (Buildium-backed snapshot).
 * Privacy: do not surface a property until the query is "far enough"
 * into that address (~50% of street length, min 5 chars) — or a strong
 * street-number + name prefix match.
 */
import portfolio from "@/data/managed-portfolio.json";

export type ManagedProperty = {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  formatted: string;
  units: string[];
  unitCount: number;
  subType: string;
  ownerName: string;
  ownerEmails: string[];
  search: string;
};

export type ManagedPortfolioFile = {
  asOf: string;
  source: string;
  count: number;
  properties: ManagedProperty[];
};

const data = portfolio as ManagedPortfolioFile;

export const MANAGED_PORTFOLIO_AS_OF = data.asOf;
export const MANAGED_PROPERTIES: ManagedProperty[] = data.properties;

export function normalizeAddressQuery(raw: string): string {
  let s = (raw || "").toLowerCase().replace(/\./g, " ");
  s = s.replace(/[^a-z0-9\s]/g, " ");
  s = ` ${s} `;
  const reps: Record<string, string> = {
    " st ": " street ",
    " ave ": " avenue ",
    " rd ": " road ",
    " blvd ": " boulevard ",
    " dr ": " drive ",
    " ln ": " lane ",
    " ct ": " court ",
    " pl ": " place ",
    " e ": " east ",
    " w ": " west ",
    " n ": " north ",
    " s ": " south ",
  };
  for (const [a, b] of Object.entries(reps)) s = s.split(a).join(b);
  return s.replace(/\s+/g, " ").trim();
}

function norm(raw: string): string {
  return normalizeAddressQuery(raw);
}

/** Min query length before any managed suggestion shows. */
export const MANAGED_MIN_CHARS = 5;

/**
 * Characters required for this property: ~50% of street string, min 5.
 * Strong matches (street # + start of street name) can clear earlier.
 */
export function thresholdForStreet(street: string): number {
  const t = Math.ceil((street || "").trim().length * 0.5);
  return Math.max(MANAGED_MIN_CHARS, t);
}

function extractStreetNumber(s: string): string | null {
  const m = s.trim().match(/^(\d+[a-z]?)/i);
  return m ? m[1].toLowerCase() : null;
}

function scoreProperty(q: string, p: ManagedProperty): number {
  const nq = norm(q);
  if (!nq) return -1;
  const ns = p.search;
  const streetN = norm(p.street);

  if (ns === nq || streetN === nq) return 1000;
  if (ns.startsWith(nq) || streetN.startsWith(nq)) return 900 - nq.length;
  if (ns.includes(nq)) return 700 - Math.abs(ns.length - nq.length);

  // token overlap
  const qt = nq.split(" ").filter(Boolean);
  const st = ns.split(" ").filter(Boolean);
  let hits = 0;
  for (const t of qt) {
    if (st.some((s) => s.startsWith(t) || t.startsWith(s))) hits++;
  }
  if (hits === 0) return -1;
  return hits * 40 + (qt.length === hits ? 50 : 0);
}

function isUnlocked(q: string, p: ManagedProperty, score: number): boolean {
  const qLen = q.trim().length;
  if (qLen < MANAGED_MIN_CHARS) return false;

  const thresh = thresholdForStreet(p.street);
  if (qLen >= thresh) return score > 0;

  // Strong early unlock: same street number + at least 3 chars of name after number
  const qNum = extractStreetNumber(q);
  const pNum = extractStreetNumber(p.street);
  if (qNum && pNum && qNum === pNum) {
    const after = norm(q).replace(qNum, "").trim();
    if (after.length >= 3 && score >= 40) return true;
  }
  return false;
}

export type ManagedSearchOptions = {
  /** If set, boost / prefer this owner's properties */
  ownerEmail?: string;
  limit?: number;
  /** When true, only return properties for that owner (if any match) */
  ownerOnly?: boolean;
};

export function searchManagedProperties(
  query: string,
  opts: ManagedSearchOptions = {},
): ManagedProperty[] {
  const q = query.trim();
  if (q.length < MANAGED_MIN_CHARS) return [];

  const email = (opts.ownerEmail || "").trim().toLowerCase();
  let pool = MANAGED_PROPERTIES;

  if (email && opts.ownerOnly) {
    const owned = pool.filter((p) => p.ownerEmails.includes(email));
    if (owned.length) pool = owned;
  }

  const scored: { p: ManagedProperty; score: number; owned: boolean }[] = [];
  for (const p of pool) {
    const score = scoreProperty(q, p);
    if (score < 0) continue;
    if (!isUnlocked(q, p, score)) continue;
    const owned = email ? p.ownerEmails.includes(email) : false;
    scored.push({ p, score: score + (owned ? 80 : 0), owned });
  }

  scored.sort((a, b) => b.score - a.score || a.p.street.localeCompare(b.p.street));
  const limit = opts.limit ?? 6;
  return scored.slice(0, limit).map((s) => s.p);
}

export function findManagedByFormatted(formatted: string): ManagedProperty | undefined {
  const n = norm(formatted);
  return MANAGED_PROPERTIES.find(
    (p) => norm(p.formatted) === n || norm(p.street) === n || p.formatted === formatted,
  );
}
