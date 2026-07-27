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

const STREET_SUFFIXES = new Set([
  "street",
  "avenue",
  "road",
  "boulevard",
  "drive",
  "lane",
  "court",
  "place",
  "way",
  "circle",
  "terrace",
  "highway",
]);

/**
 * Core street for threshold math: strip type suffix so
 * "1425 West Erie Avenue" → "1425 West Erie" (not bloated by Avenue).
 */
export function coreStreet(street: string): string {
  const parts = norm(street).split(" ").filter(Boolean);
  while (parts.length > 1 && STREET_SUFFIXES.has(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join(" ");
}

/**
 * Length gate: ~40% of core street (min 5). Strong # + name matches unlock earlier.
 */
export function thresholdForStreet(street: string): number {
  const core = coreStreet(street);
  const t = Math.ceil(core.length * 0.4);
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

  // token overlap (prefix-friendly: "we" → "west")
  const qt = nq.split(" ").filter(Boolean);
  const st = ns.split(" ").filter(Boolean);
  let hits = 0;
  for (const t of qt) {
    if (st.some((s) => s.startsWith(t) || (t.length >= 3 && t.startsWith(s)))) hits++;
  }
  if (hits === 0) return -1;
  return hits * 40 + (qt.length === hits ? 50 : 0);
}

function isUnlocked(q: string, p: ManagedProperty, score: number): boolean {
  const qTrim = q.trim();
  const qLen = qTrim.length;
  if (qLen < MANAGED_MIN_CHARS) return false;
  if (score <= 0) return false;

  const thresh = thresholdForStreet(p.street);
  if (qLen >= thresh) return true;

  // Strong early unlock: same street number + partial street name (2+ chars)
  // e.g. "1425 We" unlocks "1425 West Erie Avenue"
  const qNum = extractStreetNumber(qTrim);
  const pNum = extractStreetNumber(p.street);
  if (!qNum || !pNum || qNum !== pNum) return false;

  const after = norm(qTrim).replace(new RegExp(`^${qNum}\\s*`), "").trim();
  if (after.length < 2) return false;

  const nameTokens = coreStreet(p.street)
    .split(" ")
    .filter((t) => t && t !== pNum);

  // Every typed name fragment must prefix-match some street token
  const afterTokens = after.split(" ").filter(Boolean);
  const nameOk = afterTokens.every((at) =>
    nameTokens.some((nt) => nt.startsWith(at) || at.startsWith(nt)),
  );
  return nameOk && score >= 40;
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
