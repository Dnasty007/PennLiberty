/**
 * Classic 1978-style Space Invaders pixel sprites.
 * Bitmaps are arrays of strings where any non-space / non-dot char = lit pixel.
 * Cached as offscreen canvases; crisp scaling is the caller's job
 * (imageSmoothingEnabled = false).
 */
import { COLORS } from "./constants";

type Bitmap = readonly string[];

/** Authentic CRT palette with a light Penn Liberty gold accent. */
export const SPRITE_COLORS = {
  /** Classic invader / player green phosphor */
  green: "#33ff66",
  /** Soft phosphor white for alternate rows / lives icons */
  phosphor: "#e8ffe8",
  /** Mystery ship — warm red with a touch of arcade cyan optional */
  ufo: "#ff4466",
  /** Brand gold secondary (bunker highlights, accents) */
  gold: COLORS.gold,
  goldLight: COLORS.goldLight,
  /** Soft bunker green */
  bunker: "#2ecc71",
  explosion: "#e8ffe8",
} as const;

// ── Invaders: squid (top), crab (mid), octopus (bottom) × 2 frames ─────────
// Shapes match the iconic Taito silhouettes as closely as 11×8 allows.

const INVADERS: Bitmap[][] = [
  // 0 — Squid (top row, tallest score)
  [
    [
      "..X.....X..",
      "...X...X...",
      "..XXXXXXX..",
      ".XX.XXX.XX.",
      "XXXXXXXXXXX",
      "X.XXXXXXX.X",
      "X.X.....X.X",
      "...XX.XX...",
    ],
    [
      "..X.....X..",
      "X..X...X..X",
      "X.XXXXXXX.X",
      "XXX.XXX.XXX",
      "XXXXXXXXXXX",
      ".XXXXXXXXX.",
      "..X.....X..",
      ".X.......X.",
    ],
  ],
  // 1 — Crab (middle rows)
  [
    [
      ".X.......X.",
      "X.X.....X.X",
      "X.XXXXXXX.X",
      "XXX.XXX.XXX",
      ".XXXXXXXXX.",
      "..XXXXXXX..",
      "..X.....X..",
      ".X.......X.",
    ],
    [
      ".X.......X.",
      "X.X.....X.X",
      "X.XXXXXXX.X",
      "XXX.XXX.XXX",
      ".XXXXXXXXX.",
      "..XXXXXXX..",
      ".X..XXX..X.",
      "X.X.....X.X",
    ],
  ],
  // 2 — Octopus (bottom rows)
  [
    [
      "....XXXX....",
      ".XXXXXXXXXX.",
      "XXXXXXXXXXXX",
      "XXX..XX..XXX",
      "XXXXXXXXXXXX",
      "..XX....XX..",
      ".XX.XXXX.XX.",
      "XX........XX",
    ],
    [
      "....XXXX....",
      ".XXXXXXXXXX.",
      "XXXXXXXXXXXX",
      "XXX..XX..XXX",
      "XXXXXXXXXXXX",
      "..XX....XX..",
      ".XX..XX..XX.",
      "..XX....XX..",
    ],
  ],
];

// Classic laser-base turret
const PLAYER: Bitmap = [
  "......XX......",
  "......XX......",
  ".....XXXX.....",
  ".....XXXX.....",
  "..XXXXXXXXXX..",
  ".XXXXXXXXXXXX.",
  "XXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXX",
];

// Mystery ship / UFO
const UFO: Bitmap = [
  "....XXXXXX....",
  "..XXXXXXXXXX..",
  ".XXXXXXXXXXXX.",
  "XX.XX.XX.XX.XX",
  "XXXXXXXXXXXXXX",
  ".XX..XX..XX..X",
  "..X........X..",
];

// Classic invader death sparkle (two frames for a tiny flash)
const EXPLOSION: Bitmap[] = [
  [
    "....X....",
    ".X..X..X.",
    "..X...X..",
    "X..XXX..X",
    "..X...X..",
    ".X..X..X.",
    "....X....",
  ],
  [
    ".X.....X.",
    "..X.X.X..",
    "X...X...X",
    ".XXXXXXX.",
    "X...X...X",
    "..X.X.X..",
    ".X.....X.",
  ],
];

const cache = new Map<string, HTMLCanvasElement>();

function rasterize(bitmap: Bitmap, color: string, cell: number): HTMLCanvasElement {
  const rows = bitmap.length;
  const cols = Math.max(...bitmap.map((r) => r.length));
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    const row = bitmap[r]!;
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== " " && row[c] !== ".") {
        ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
  }
  return canvas;
}

function get(key: string, bitmap: Bitmap, color: string): HTMLCanvasElement {
  let sprite = cache.get(key);
  if (!sprite) {
    sprite = rasterize(bitmap, color, 4);
    cache.set(key, sprite);
  }
  return sprite;
}

/**
 * Invader by design index (0 squid / 1 crab / 2 octopus) and march frame.
 * Classic monochrome green; optional color override for tint experiments.
 */
export function invaderSprite(
  design: number,
  frame: 0 | 1,
  color: string = SPRITE_COLORS.green,
): HTMLCanvasElement {
  const safe = INVADERS[design] ? design : 0;
  const fr = frame === 1 ? 1 : 0;
  return get(`inv-${safe}-${fr}-${color}`, INVADERS[safe]![fr]!, color);
}

/** Player laser base — classic green phosphor. */
export function playerSprite(color: string = SPRITE_COLORS.green): HTMLCanvasElement {
  return get(`player-${color}`, PLAYER, color);
}

/** Mystery ship — red-ish arcade UFO. */
export function ufoSprite(color: string = SPRITE_COLORS.ufo): HTMLCanvasElement {
  return get(`ufo-${color}`, UFO, color);
}

/** Death sparkle used during invader dying freeze. */
export function explosionSprite(
  frame: 0 | 1 = 0,
  color: string = SPRITE_COLORS.explosion,
): HTMLCanvasElement {
  const fr = frame === 1 ? 1 : 0;
  return get(`boom-${fr}-${color}`, EXPLOSION[fr]!, color);
}
