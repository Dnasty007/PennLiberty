/**
 * Tuning + layout constants for the Rentals-hero Space Invaders Easter egg.
 * Speeds are expressed in px per 60fps frame; the engine runs a fixed 60Hz
 * step so they map 1:1 (see engine.ts).
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
} as const;

export const PLAYER = {
  width: 40,
  height: 18,
  speed: 6,
  marginBottom: 34,
  fireCooldownMs: 420,
  /** Brief invulnerability + blink after respawn. */
  respawnInvulnMs: 1600,
  lives: 3,
} as const;

export const BULLET = {
  /** Player bullet ~2× faster than enemy (classic). */
  playerSpeed: 9,
  enemySpeed: 4.2,
  width: 3,
  height: 12,
  /** Classic single shot on screen; bump to 3 for arcade feel. */
  maxPlayer: 1,
  maxEnemy: 3,
} as const;

export const GRID = {
  rows: 5,
  cols: 11,
  /** Point value per row, bottom → top per spec (bottom row worth most). */
  rowPointsBottomToTop: [30, 25, 20, 15, 10],
  /** Sprite design index per row, top → bottom. */
  rowSpriteTopToBottom: [0, 1, 1, 2, 2],
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
 * 1978-feel march timing. Invaders move in discrete horizontal steps; the
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

export const ENEMY_FIRE = {
  baseIntervalMs: 1150,
  minIntervalMs: 320,
  perWaveReductionMs: 110,
  /** Wave at which shots start aiming at the player (30% chance). */
  aimedFromWave: 5,
  aimedChance: 0.3,
} as const;

export const UFO = {
  minSpawnMs: 20000,
  maxSpawnMs: 40000,
  speed: 2.2,
  width: 34,
  height: 14,
  topOffset: 30,
  pointChoices: [50, 100, 150],
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
