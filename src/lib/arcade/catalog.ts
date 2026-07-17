/** Catalog of childhood classics — ordered by original release year. */

export const ARCADE_GAME_IDS = [
  "memory",
  "pong",
  "breakout",
  "snake",
  "invaders",
  "simon",
  "asteroids",
  "missile",
  "centipede",
  "frogger",
  "tron",
  "tetris",
  "minesweeper",
  "flappy",
  "twenty48",
] as const;

export type ArcadeGameId = (typeof ARCADE_GAME_IDS)[number];

export type ArcadeGameMeta = {
  id: ArcadeGameId;
  title: string;
  year: number;
  era: string;
  blurb: string;
  accent: string;
  /** Digit 0–9 or letter hotkey */
  hotkey: string;
};

/**
 * Canonical chronological order (oldest → newest).
 * Era labels power the hub timeline layout.
 */
export const ARCADE_CATALOG: readonly ArcadeGameMeta[] = [
  {
    id: "memory",
    title: "MEMORY",
    year: 1959,
    era: "1950s",
    blurb: "Flip cards. Match the pairs.",
    accent: "#c084fc",
    hotkey: "0",
  },
  {
    id: "pong",
    title: "PONG",
    year: 1972,
    era: "1970s",
    blurb: "The original. Beat the AI to 7.",
    accent: "#e8ffe8",
    hotkey: "1",
  },
  {
    id: "breakout",
    title: "BREAKOUT",
    year: 1976,
    era: "1970s",
    blurb: "Paddle, ball, smash every brick.",
    accent: "#fb923c",
    hotkey: "2",
  },
  {
    id: "snake",
    title: "SNAKE",
    year: 1976,
    era: "1970s",
    blurb: "Eat, grow, don't bite yourself.",
    accent: "#4ade80",
    hotkey: "3",
  },
  {
    id: "invaders",
    title: "SPACE INVADERS",
    year: 1978,
    era: "1970s",
    blurb: "Defend Earth. Classic bunkers.",
    accent: "#33ff66",
    hotkey: "4",
  },
  {
    id: "simon",
    title: "SIMON",
    year: 1978,
    era: "1970s",
    blurb: "Watch the lights. Repeat the pattern.",
    accent: "#f472b6",
    hotkey: "5",
  },
  {
    id: "asteroids",
    title: "ASTEROIDS",
    year: 1979,
    era: "1970s",
    blurb: "Rotate, thrust, blast the rocks.",
    accent: "#a5b4fc",
    hotkey: "6",
  },
  {
    id: "missile",
    title: "MISSILE CMD",
    year: 1980,
    era: "1980s",
    blurb: "Shoot warheads. Save the cities.",
    accent: "#fbbf24",
    hotkey: "7",
  },
  {
    id: "centipede",
    title: "CENTIPEDE",
    year: 1981,
    era: "1980s",
    blurb: "Blast the bug. Watch the mushrooms.",
    accent: "#86efac",
    hotkey: "8",
  },
  {
    id: "frogger",
    title: "FROG HOP",
    year: 1981,
    era: "1980s",
    blurb: "Cross the road. Reach the top.",
    accent: "#4ade80",
    hotkey: "9",
  },
  {
    id: "tron",
    title: "LIGHT CYCLE",
    year: 1982,
    era: "1980s",
    blurb: "Trail duel vs AI. Don't crash.",
    accent: "#22d3ee",
    hotkey: "T",
  },
  {
    id: "tetris",
    title: "TETRIS",
    year: 1984,
    era: "1980s",
    blurb: "Stack tetrominoes. Clear lines.",
    accent: "#5ec8ff",
    hotkey: "R",
  },
  {
    id: "minesweeper",
    title: "MINESWEEPER",
    year: 1990,
    era: "1990s",
    blurb: "Logic classic. Flag the mines.",
    accent: "#f472b6",
    hotkey: "N",
  },
  {
    id: "flappy",
    title: "SKY HOP",
    year: 2013,
    era: "2010s",
    blurb: "Flap through the pipes. One more try.",
    accent: "#fde047",
    hotkey: "S",
  },
  {
    id: "twenty48",
    title: "2048",
    year: 2014,
    era: "2010s",
    blurb: "Slide & merge. Reach 2048.",
    accent: "#f4dfb4",
    hotkey: "A",
  },
] as const;

/** Games loaded via generic classic shell (not invaders/tetris specials). */
export const CLASSIC_SHELL_IDS = [
  "breakout",
  "pong",
  "snake",
  "asteroids",
  "frogger",
  "flappy",
  "minesweeper",
  "memory",
  "missile",
  "simon",
  "tron",
  "centipede",
  "twenty48",
] as const;

export type ClassicShellId = (typeof CLASSIC_SHELL_IDS)[number];

export function isClassicShellId(id: string): id is ClassicShellId {
  return (CLASSIC_SHELL_IDS as readonly string[]).includes(id);
}

export function isArcadeGameId(id: string): id is ArcadeGameId {
  return (ARCADE_GAME_IDS as readonly string[]).includes(id);
}

/** Group catalog by decade for timeline hub UI. */
export function catalogByEra(): { era: string; games: ArcadeGameMeta[] }[] {
  const order: string[] = [];
  const map = new Map<string, ArcadeGameMeta[]>();
  for (const g of ARCADE_CATALOG) {
    if (!map.has(g.era)) {
      map.set(g.era, []);
      order.push(g.era);
    }
    map.get(g.era)!.push(g);
  }
  return order.map((era) => ({ era, games: map.get(era)! }));
}
