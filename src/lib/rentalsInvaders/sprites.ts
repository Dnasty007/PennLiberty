/**
 * Pixel-art sprites drawn procedurally and cached as offscreen canvases.
 * Bitmaps are arrays of strings where any non-space char = a lit pixel.
 * Crisp scaling is handled by the caller (imageSmoothingEnabled = false).
 */
import { COLORS } from "./constants";

type Bitmap = readonly string[];

// Three invader designs, two animation frames each (classic 11×8-ish).
const INVADERS: Bitmap[][] = [
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
  [
    [
      "...XX...",
      "..XXXX..",
      ".XXXXXX.",
      "XX.XX.XX",
      "XXXXXXXX",
      ".X.XX.X.",
      "X......X",
      ".X....X.",
    ],
    [
      "...XX...",
      "..XXXX..",
      ".XXXXXX.",
      "XX.XX.XX",
      "XXXXXXXX",
      "..X..X..",
      ".X.XX.X.",
      "X.X..X.X",
    ],
  ],
  [
    [
      "....XX....",
      "...XXXX...",
      "..XXXXXX..",
      ".XX.XX.XX.",
      ".XXXXXXXX.",
      "...X..X...",
      "..X.XX.X..",
      ".X.X..X.X.",
    ],
    [
      "....XX....",
      "...XXXX...",
      "..XXXXXX..",
      ".XX.XX.XX.",
      ".XXXXXXXX.",
      "..X.XX.X..",
      ".X......X.",
      "X........X",
    ],
  ],
];

const PLAYER: Bitmap = [
  "......XX......",
  "......XX......",
  ".....XXXX.....",
  "..XXXXXXXXXX..",
  ".XXXXXXXXXXXX.",
  "XXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXX",
];

const UFO: Bitmap = [
  "...XXXXXX...",
  "..XXXXXXXX..",
  ".XXXXXXXXXX.",
  "XX.XX.XX.XXX",
  "XXXXXXXXXXXX",
  ".X.XXXX.XX.X",
  "..X......X..",
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

export function invaderSprite(design: number, frame: 0 | 1): HTMLCanvasElement {
  const safe = INVADERS[design] ? design : 0;
  const color = safe === 0 ? COLORS.goldLight : safe === 1 ? COLORS.gold : COLORS.goldMid;
  return get(`inv-${safe}-${frame}`, INVADERS[safe]![frame]!, color);
}

export function playerSprite(): HTMLCanvasElement {
  return get("player", PLAYER, COLORS.goldLight);
}

export function ufoSprite(): HTMLCanvasElement {
  return get("ufo", UFO, COLORS.accent);
}
