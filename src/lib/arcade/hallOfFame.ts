/**
 * Penn Liberty Arcade — global Hall of Fame.
 * Backed by Supabase (free tier). Works on static hosting (GoDaddy).
 * Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to enable.
 */
import { ARCADE_CATALOG, type ArcadeGameId } from "./catalog";

export type ScoreEntry = {
  id?: string;
  gameId: ArcadeGameId | string;
  initials: string;
  score: number;
  createdAt?: string;
};

export type Champion = {
  gameId: string;
  title: string;
  initials: string;
  score: number;
};

const TABLE = "arcade_scores";
const TOP_N = 10;
const INITIALS_KEY = "pl-arcade-initials";
const SUBMIT_COOLDOWN_MS = 8_000;

/** Soft caps to block absurd spam scores (still high enough for good play). */
const SCORE_CAP: Record<string, number> = {
  invaders: 500_000,
  tetris: 999_999,
  breakout: 200_000,
  pong: 50,
  snake: 50_000,
  asteroids: 200_000,
  frogger: 50_000,
  flappy: 10_000,
  minesweeper: 999,
  memory: 50_000,
  missile: 500_000,
  simon: 200,
  tron: 100_000,
  centipede: 200_000,
  twenty48: 200_000,
};

function supabaseConfig(): { url: string; key: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function isHallOfFameEnabled(): boolean {
  return supabaseConfig() !== null;
}

export function loadSavedInitials(): string {
  try {
    const v = localStorage.getItem(INITIALS_KEY) || "";
    return sanitizeInitials(v) || "PLR";
  } catch {
    return "PLR";
  }
}

export function saveInitials(initials: string) {
  try {
    localStorage.setItem(INITIALS_KEY, sanitizeInitials(initials));
  } catch {
    /* ignore */
  }
}

export function sanitizeInitials(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3)
    .padEnd(3, "X")
    .slice(0, 3);
}

function gameTitle(gameId: string): string {
  return ARCADE_CATALOG.find((g) => g.id === gameId)?.title ?? gameId.toUpperCase();
}

function capFor(gameId: string): number {
  return SCORE_CAP[gameId] ?? 1_000_000;
}

let lastSubmitAt = 0;

/**
 * Fetch top scores for one game (highest first).
 */
export async function fetchTopScores(
  gameId: string,
  limit = TOP_N,
): Promise<ScoreEntry[]> {
  const cfg = supabaseConfig();
  if (!cfg) return [];

  const q = new URLSearchParams({
    select: "id,game_id,initials,score,created_at",
    game_id: `eq.${gameId}`,
    order: "score.desc",
    limit: String(limit),
  });

  const res = await fetch(`${cfg.url}/rest/v1/${TABLE}?${q}`, {
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    console.warn("[hallOfFame] fetch failed", res.status);
    return [];
  }
  const rows = (await res.json()) as Array<{
    id: string;
    game_id: string;
    initials: string;
    score: number;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    gameId: r.game_id,
    initials: r.initials,
    score: r.score,
    createdAt: r.created_at,
  }));
}

/**
 * Fetch current #1 for every catalog game (parallel).
 */
export async function fetchChampions(): Promise<Champion[]> {
  const cfg = supabaseConfig();
  if (!cfg) return [];

  const results: Champion[] = [];
  await Promise.all(
    ARCADE_CATALOG.map(async (g) => {
      const top = await fetchTopScores(g.id, 1);
      if (!top[0]) return;
      results.push({
        gameId: g.id,
        title: g.title,
        initials: top[0].initials,
        score: top[0].score,
      });
    }),
  );
  return results;
}

export type SubmitResult =
  | { ok: true; rank: number | null }
  | { ok: false; error: string };

/**
 * Submit a score to the global board. Returns approx rank on that game.
 */
export async function submitScore(
  gameId: string,
  score: number,
  initialsRaw: string,
): Promise<SubmitResult> {
  const cfg = supabaseConfig();
  if (!cfg) {
    return {
      ok: false,
      error: "Hall of Fame not connected yet. Ask Ray to flip the switch.",
    };
  }

  const initials = sanitizeInitials(initialsRaw);
  if (initials.length !== 3) {
    return { ok: false, error: "Need 3 initials." };
  }
  if (!Number.isFinite(score) || score <= 0) {
    return { ok: false, error: "Score too low to post." };
  }
  const cap = capFor(gameId);
  if (score > cap) {
    return { ok: false, error: "Score rejected (out of range)." };
  }

  const now = Date.now();
  if (now - lastSubmitAt < SUBMIT_COOLDOWN_MS) {
    return { ok: false, error: "Easy, champ — wait a few seconds." };
  }

  saveInitials(initials);

  const res = await fetch(`${cfg.url}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      game_id: gameId,
      initials,
      score: Math.floor(score),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[hallOfFame] submit failed", res.status, text);
    return { ok: false, error: "Could not reach the cabinet. Try again." };
  }

  lastSubmitAt = now;

  // Rank = 1 + number of scores strictly higher on this game
  let better = 0;
  try {
    const q = new URLSearchParams({
      select: "score",
      game_id: `eq.${gameId}`,
      score: `gt.${Math.floor(score)}`,
    });
    const countRes = await fetch(`${cfg.url}/rest/v1/${TABLE}?${q}`, {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    });
    const range = countRes.headers.get("content-range");
    // content-range: */12 or 0-0/12
    const total = range?.split("/")[1];
    if (total && total !== "*") better = Number(total) || 0;
  } catch {
    better = 0;
  }

  return { ok: true, rank: better + 1 };
}

export function hallOfFameGameLabel(gameId: string): string {
  return gameTitle(gameId);
}

export { TOP_N };
