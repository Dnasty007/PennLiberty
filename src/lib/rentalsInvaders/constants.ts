/**
 * Tuning + layout constants for the Rentals-hero Space Invaders Easter egg.
 * Speeds are expressed in px per 60fps frame; the engine runs a fixed 60Hz
 * step so they map 1:1 (see engine.ts).
 *
 * Scoring, formation, fire rules, and mystery-ship table match Taito 1978 SI.
 */

/** Fixed simulation step (ms) — engine accumulates real dt into these. */
export const STEP_MS = 1000 / 60;

export const KEYS = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  fire: ["Space"],
  pause: ["KeyP"],
  quit: ["Escape"],
} as const;

/** All codes the game owns — preventDefault these while active to stop page scroll. */
export const CAPTURED_CODES: ReadonlySet<string> = new Set([
  ...KEYS.left,
  ...KEYS.right,
  ...KEYS.fire,
  ...KEYS.pause,
]);

export const COLORS = {
  gold: "#d6b06a",
  goldLight: "#f4dfb4",
  goldMid: "#e4be78",
  navy: "#0f1824",
  navyDeep: "#05101e",
  accent: "#5ec8ff",
  white: "#ffffff",
  danger: "#ff6f6f",
  spark: "#f4dfb4",
  bunker: "#5ec8ff",
} as const;

export const PLAYER = {
  width: 40,
  height: 18,
  speed: 6,
  marginBottom: 34,
  /**
   * Classic SI: only 1 player bullet on screen; fire is gated by bullet
   * inactivity. This short cooldown is anti-repeat only (key bounce).
   */
  fireCooldownMs: 80,
  /** Brief invulnerability + blink after respawn. */
  respawnInvulnMs: 1600,
  lives: 3,
} as const;

export const BULLET = {
  /** Player bullet ~2× faster than enemy (classic feel). */
  playerSpeed: 9,
  enemySpeed: 4.2,
  width: 3,
  height: 12,
  /** Classic: exactly one player shot on screen at a time. */
  maxPlayer: 1,
  /** Classic: up to three enemy projectiles. */
  maxEnemy: 3,
} as const;

export const GRID = {
  rows: 5,
  cols: 11,
  /**
   * Point value per row, top → bottom (classic 1978):
   * squid 30 · crab 20 · crab 20 · octopus 10 · octopus 10
   */
  rowPointsTopToBottom: [30, 20, 20, 10, 10] as const,
  /** Sprite design index per row, top → bottom. */
  rowSpriteTopToBottom: [0, 1, 1, 2, 2] as const,
  /** Fraction of hero width the formation occupies at spawn. */
  widthFraction: 0.66,
  /** Top offset from hero top (px). */
  topPad: 56,
  /** Horizontal gap fraction between invader cells. */
  gapFraction: 0.34,
  invaderWidth: 26,
  invaderHeight: 18,
} as const;

/**
 * 1978-feel march timing. Invaders move as one synchronized block; the
 * interval between steps shrinks as the swarm thins and as waves climb, so the
 * last alien is frantic. Formula:
 *   interval = clamp(base - dead*perKill - (wave-1)*perWave, min, base)
 */
export const MARCH = {
  baseStepMs: 620,
  minStepMs: 90,
  perKillSpeedupMs: 9,
  perWaveSpeedupMs: 42,
  /** Horizontal travel per step as a fraction of hero width. */
  hStepFraction: 0.018,
  /** Vertical drop when the block hits a wall (px). */
  dropPx: 12,
} as const;

/**
 * Enemy fire: only bottom-most alive invader per column; random column;
 * vertical only (no aiming). Interval tightens slightly each wave.
 */
export const ENEMY_FIRE = {
  baseIntervalMs: 1150,
  minIntervalMs: 320,
  perWaveReductionMs: 110,
} as const;

/**
 * Mystery ship / UFO — spawns every ~20–40s, flies across the top.
 * Score uses the classic shot-count table (see MYSTERY_POINTS).
 */
export const UFO = {
  minSpawnMs: 20_000,
  maxSpawnMs: 40_000,
  speed: 2.2,
  width: 34,
  height: 14,
  topOffset: 30,
} as const;

/**
 * Classic 1978 mystery-ship point table (15 entries).
 * points = MYSTERY_POINTS[playerShotsFired % 15]
 */
export const MYSTERY_POINTS = [
  100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100,
] as const;

/**
 * Four classic house-shaped destructible bunkers above the player.
 * Cell size scales with playfield width so layout stays readable on mobile.
 */
export const BUNKER = {
  count: 4,
  /** Nominal cell size in px at a 720-wide playfield; scaled by width/720. */
  cellAt720: 3.5,
  cols: 22,
  rows: 16,
  /**
   * Vertical placement: bunker bottom sits this many px above the player
   * center (tuned so invaders reach bunkers before the player line).
   */
  abovePlayer: 72,
} as const;

export const FX = {
  /** Death freeze for a killed invader before it clears (ms). */
  invaderDeathMs: 110,
  shakeMs: 220,
  shakeAmp: 3,
  readyMs: 1500,
  waveClearMs: 1400,
  dyingMs: 900,
} as const;

export const HIGH_SCORE_KEY = "pl-rentals-invaders-hs";
