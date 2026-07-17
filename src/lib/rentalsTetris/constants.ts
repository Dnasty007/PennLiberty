/**
 * Classic Tetris constants — NES / early-console feel.
 * Grid: 10 wide × 20 visible (+ 2 hidden spawn rows).
 */

export const STEP_MS = 1000 / 60;

export const KEYS = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  soft: ["ArrowDown", "KeyS"],
  hard: ["Space"],
  rotCW: ["ArrowUp", "KeyW", "KeyX"],
  rotCCW: ["KeyZ", "ControlLeft", "ControlRight"],
  pause: ["KeyP"],
  quit: ["Escape"],
} as const;

export const CAPTURED_CODES: ReadonlySet<string> = new Set([
  ...KEYS.left,
  ...KEYS.right,
  ...KEYS.soft,
  ...KEYS.hard,
  ...KEYS.rotCW,
  ...KEYS.rotCCW,
  ...KEYS.pause,
]);

export const COLS = 10;
/** Total rows including 2 hidden buffer rows at top. */
export const ROWS = 22;
/** Visible playfield rows (bottom 20 of board). */
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = ROWS - VISIBLE_ROWS;

/**
 * Gravity interval (ms) by level — classic NES-ish curve.
 * Level 0 ≈ 48 frames @ 60Hz → 800ms; speeds up to nearly free-fall.
 */
export const GRAVITY_MS = [
  800, 720, 630, 550, 470, 380, 300, 220, 130, 100, 80, 80, 80, 70, 70, 70, 50,
  50, 50, 30, 30, 30, 20, 20, 20, 20, 20, 20, 20, 16,
] as const;

/** Classic line-clear scores × (level + 1). */
export const LINE_SCORES = {
  1: 40,
  2: 100,
  3: 300,
  4: 1200,
} as const;

export const LINES_PER_LEVEL = 10;

/** Soft drop: points per cell fallen. */
export const SOFT_DROP_POINTS = 1;
/** Hard drop: points per cell fallen. */
export const HARD_DROP_POINTS = 2;

/** DAS: initial delay before auto-repeat (ms). */
export const DAS_DELAY_MS = 170;
/** ARR: auto-repeat rate (ms between shifts). */
export const ARR_MS = 50;

/** Brief freeze while lines flash before collapse. */
export const CLEAR_FLASH_MS = 280;

export const HIGH_SCORE_KEY = "pl-rentals-tetris-hs";

/** Piece colors — classic bright palette on dark field. */
export const PIECE_COLORS: Record<string, string> = {
  I: "#5ec8ff",
  O: "#f4dfb4",
  T: "#c084fc",
  S: "#33ff66",
  Z: "#ff6688",
  J: "#60a5fa",
  L: "#fb923c",
  ghost: "rgba(232,255,232,0.18)",
  grid: "rgba(51,255,102,0.08)",
  border: "#33ff66",
  panel: "#0a1610",
};
