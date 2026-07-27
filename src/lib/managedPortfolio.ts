/**
 * Managed-portfolio address match (Buildium-backed snapshot).
 *
 * Privacy (strict):
 * - No single-letter N/E/S/W expansion — users must type full North/East/South/West
 *   when the managed street uses a direction.
 * - Suggestions only after ~halfway into the primary street name
 *   (e.g. Erie → "Er"…), not halfway into the whole address string.
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

const DIRECTIONS = new Set(["north", "east", "south", "west"]);

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
  "st",
  "ave",
  "rd",
  "blvd",
  "dr",
  "ln",
  "ct",
  "pl",
]);

/** Min raw query length (street # + spaces still need something typed). */
export const MANAGED_MIN_CHARS = 6;

/**
 * Normalize for matching.
 * Intentionally does NOT expand N/E/S/W single letters into full directions.
 */
export function normalizeAddressQuery(raw: string): string {
  let s = (raw || "").toLowerCase().replace(/\./g, " ");
  s = s.replace(/[^a-z0-9\s]/g, " ");
  s = ` ${s} `;
  // Full suffix words only (not single-letter directions)
  const reps: Record<string, string> = {
    " st ": " street ",
    " ave ": " avenue ",
    " rd ": " road ",
    " blvd ": " boulevard ",
    " dr ": " drive ",
    " ln ": " lane ",
    " ct ": " court ",
    " pl ": " place ",
  };
  for (const [a, b] of Object.entries(reps)) s = s.split(a).join(b);
  return s.replace(/\s+/g, " ").trim();
}

function norm(raw: string): string {
  return normalizeAddressQuery(raw);
}

function tokens(s: string): string[] {
  return norm(s).split(" ").filter(Boolean);
}

function extractStreetNumber(s: string): string | null {
  const m = s.trim().match(/^(\d+[a-z]?)/i);
  return m ? m[1].toLowerCase() : null;
}

/** Parse managed street into number, optional direction, primary name tokens. */
export function parseStreetParts(street: string): {
  number: string | null;
  direction: string | null;
  nameTokens: string[];
} {
  const t = tokens(street);
  if (!t.length) return { number: null, direction: null, nameTokens: [] };

  let i = 0;
  let number: string | null = null;
  if (/^\d+[a-z]?$/.test(t[0])) {
    number = t[0];
    i = 1;
  }

  let direction: string | null = null;
  if (i < t.length && DIRECTIONS.has(t[i])) {
    direction = t[i];
    i += 1;
  }

  const nameTokens: string[] = [];
  for (; i < t.length; i++) {
    if (STREET_SUFFIXES.has(t[i])) break;
    nameTokens.push(t[i]);
  }

  return { number, direction, nameTokens };
}

/** Half of primary name (e.g. "erie" → 2 chars → "er"). Min 2. */
export function nameHalfwayLen(nameTokens: string[]): number {
  const name = nameTokens.join("");
  if (!name.length) return 2;
  return Math.max(2, Math.ceil(name.length * 0.5));
}

function scoreProperty(q: string, p: ManagedProperty): number {
  const nq = norm(q);
  if (!nq) return -1;
  const ns = p.search;
  const streetN = norm(p.street);

  if (ns === nq || streetN === nq) return 1000;
  if (ns.startsWith(nq) || streetN.startsWith(nq)) return 900;
  if (ns.includes(nq)) return 700;

  const qt = tokens(q);
  const st = tokens(p.search);
  let hits = 0;
  for (const t of qt) {
    if (st.some((s) => s === t || s.startsWith(t))) hits++;
  }
  if (hits === 0) return -1;
  return hits * 50 + (qt.length === hits ? 40 : 0);
}

/**
 * Strict privacy unlock:
 * 1) Street number matches
 * 2) If property has N/E/S/W — user must type that FULL word (west not we/w)
 * 3) Primary street name typed to ~50% as a prefix (erie → er…)
 */
export function isUnlocked(q: string, p: ManagedProperty): boolean {
  const qTrim = q.trim();
  if (qTrim.length < MANAGED_MIN_CHARS) return false;

  const prop = parseStreetParts(p.street);
  const qParts = parseStreetParts(qTrim);

  // Must have a street number in query matching the property
  if (!prop.number || !qParts.number || prop.number !== qParts.number) return false;

  // Direction: full word required when the managed address uses one
  if (prop.direction) {
    const qTok = tokens(qTrim);
    // Accept full direction only (not "we", "w", "nor", etc.)
    const hasFullDir = qTok.includes(prop.direction);
    if (!hasFullDir) return false;
  }

  // Primary name: need ~halfway prefix of the main name string
  if (!prop.nameTokens.length) {
    // Number-only style streets — direction (if any) + number is enough
    return true;
  }

  const need = nameHalfwayLen(prop.nameTokens);
  const fullName = prop.nameTokens.join(" ");
  const fullNameCompact = prop.nameTokens.join("");

  // Typed name tokens = query tokens after number and (optional) full direction
  const qTok = tokens(qTrim);
  let i = 0;
  if (qTok[0] === prop.number) i = 1;
  if (prop.direction && qTok[i] === prop.direction) i += 1;
  const typedName = qTok.slice(i).filter((t) => !STREET_SUFFIXES.has(t));
  if (!typedName.length) return false;

  const typedJoined = typedName.join("");
  const typedSpaced = typedName.join(" ");

  // Must be a prefix of the street name (erie, er, eri — not random)
  const nameOk =
    fullName.startsWith(typedSpaced) ||
    fullNameCompact.startsWith(typedJoined) ||
    prop.nameTokens.some((nt, idx) => {
      // progressive multi-token: first tokens exact, last is prefix
      if (idx >= typedName.length) return false;
      return typedName.every((tt, j) => {
        const target = prop.nameTokens[j];
        if (!target) return false;
        if (j < typedName.length - 1) return target === tt;
        return target.startsWith(tt);
      });
    });

  if (!nameOk) return false;
  return typedJoined.length >= need;
}

export type ManagedSearchOptions = {
  ownerEmail?: string;
  limit?: number;
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
    if (!isUnlocked(q, p)) continue;
    const score = scoreProperty(q, p);
    if (score < 0) continue;
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
