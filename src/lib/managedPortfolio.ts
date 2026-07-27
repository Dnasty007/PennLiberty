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

/** Full word or standard single-letter abbrev (W / E / N / S). Not "We" / "Wes". */
const DIRECTION_ALIASES: Record<string, string[]> = {
  north: ["north", "n"],
  east: ["east", "e"],
  south: ["south", "s"],
  west: ["west", "w"],
};

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

function directionMatches(propDir: string | null, queryToken: string | undefined): boolean {
  if (!propDir) return true;
  if (!queryToken) return false;
  const aliases = DIRECTION_ALIASES[propDir] || [propDir];
  return aliases.includes(queryToken);
}

/**
 * Strict privacy unlock:
 * 1) Street number matches
 * 2) If property has a direction — full word OR single letter (West / W). Not "We"/"Wes".
 * 3) Primary street name typed to ~50% as a prefix (erie → er… / eri…)
 *
 * Examples for 1425 West Erie Avenue:
 *  - "1425 We"        → no
 *  - "1425 West"      → no (need half of Erie)
 *  - "1425 W Er"      → yes
 *  - "1425 W Eri"     → yes
 *  - "1425 West Eri"  → yes
 */
export function isUnlocked(q: string, p: ManagedProperty): boolean {
  const qTrim = q.trim();
  if (qTrim.length < MANAGED_MIN_CHARS) return false;

  const prop = parseStreetParts(p.street);

  // Must have a street number in query matching the property
  if (!prop.number) return false;
  const qTok = tokens(qTrim);
  if (!qTok.length || qTok[0] !== prop.number) return false;

  let i = 1; // past street number

  // Direction: full North/East/South/West OR single N/E/S/W
  if (prop.direction) {
    if (!directionMatches(prop.direction, qTok[i])) return false;
    i += 1;
  }

  // Primary name: need ~halfway prefix of the main name string
  if (!prop.nameTokens.length) {
    return true;
  }

  const need = nameHalfwayLen(prop.nameTokens);
  const fullName = prop.nameTokens.join(" ");
  const fullNameCompact = prop.nameTokens.join("");

  const typedName = qTok.slice(i).filter((t) => !STREET_SUFFIXES.has(t) && !DIRECTIONS.has(t));
  // Don't treat leftover single-letter direction typos as name
  const typedNameClean = typedName.filter((t) => !(t.length === 1 && "nesw".includes(t)));
  if (!typedNameClean.length) return false;

  const typedJoined = typedNameClean.join("");
  const typedSpaced = typedNameClean.join(" ");

  const nameOk =
    fullName.startsWith(typedSpaced) ||
    fullNameCompact.startsWith(typedJoined) ||
    typedNameClean.every((tt, j) => {
      const target = prop.nameTokens[j];
      if (!target) return false;
      if (j < typedNameClean.length - 1) return target === tt;
      return target.startsWith(tt);
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
