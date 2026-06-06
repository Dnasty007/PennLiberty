/**
 * Tuning for the Three.js "2026 remaster" of the Rentals-hero Space Invaders.
 * The simulation runs in hero-pixel space (width/height = hero px); scene3d maps
 * px → world units for rendering. Speeds are px per second (dt in seconds).
 */

export const STEP_MS = 1000 / 60;

export const KEYS = {
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  fire: ["Space"],
  pause: ["KeyP"],
  quit: ["Escape"],
} as const;

export const CAPTURED_CODES: ReadonlySet<string> = new Set([
  ...KEYS.left,
  ...KEYS.right,
  ...KEYS.fire,
  ...KEYS.pause,
]);

/** Neon-synthwave + Penn-Liberty gold palette (THREE hex numbers). */
export const HEX = {
  gold: 0xd6b06a,
  goldLight: 0xf4dfb4,
  cyan: 0x35e0ff,
  magenta: 0xff45e0,
  green: 0x73ff9b,
  orange: 0xffa23d,
  red: 0xff5a6e,
  white: 0xffffff,
  grid: 0x1b3b66,
  bgTop: 0x0a1322,
  bgBottom: 0x050b16,
} as const;

export type WeaponId = "blaster" | "spread" | "rail" | "homing";

export type WeaponDef = {
  id: WeaponId;
  name: string;
  hex: number;
  cooldownMs: number;
  bolts: number; // base simultaneous bolts
  pierce: boolean;
  homing: boolean;
  speed: number; // px/sec
};

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  blaster: { id: "blaster", name: "Blaster", hex: HEX.goldLight, cooldownMs: 300, bolts: 1, pierce: false, homing: false, speed: 900 },
  spread: { id: "spread", name: "Spread", hex: HEX.cyan, cooldownMs: 360, bolts: 3, pierce: false, homing: false, speed: 820 },
  rail: { id: "rail", name: "Rail Laser", hex: HEX.magenta, cooldownMs: 230, bolts: 1, pierce: true, homing: false, speed: 1350 },
  homing: { id: "homing", name: "Homing", hex: HEX.green, cooldownMs: 470, bolts: 2, pierce: false, homing: true, speed: 660 },
} as const;

export const PLAYER = {
  width: 46,
  height: 26,
  speed: 540, // px/sec
  marginBottom: 40,
  respawnInvulnMs: 1700,
  lives: 3,
  maxLives: 6,
  overdriveMs: 8000,
  overdriveCooldownScale: 0.45,
} as const;

export const BULLET = {
  enemySpeed: 360, // px/sec
  width: 4,
  height: 16,
  maxPlayer: 16,
  maxEnemy: 22, // higher ceiling so bosses can throw real patterns
  homingTurn: 4.2, // rad/sec steering
} as const;

export const GRID = {
  rows: 5,
  cols: 11,
  /** HP per row, top → bottom (bottom "gunships" are tougher). */
  rowHpTopToBottom: [1, 1, 1, 2, 2],
  /** Points per row, bottom → top. */
  rowPointsBottomToTop: [40, 30, 25, 20, 15],
  /** Mesh design index per row, top → bottom (0 scout, 1 drone, 2 gunship). */
  rowTypeTopToBottom: [0, 0, 1, 2, 2],
  widthFraction: 0.66,
  topPad: 64,
  rowSpacing: 34,
  invaderWidth: 30,
  invaderHeight: 22,
} as const;

export const MARCH = {
  baseSpeed: 34, // px/sec horizontal
  perKillSpeed: 1.7,
  perWaveSpeed: 12,
  maxSpeed: 230,
  dropPx: 16,
  edgePad: 26,
} as const;

export const ENEMY_FIRE = {
  baseIntervalMs: 980,
  minIntervalMs: 260,
  perWaveReductionMs: 95,
  aimedFromWave: 3,
  aimedChance: 0.35,
} as const;

export const UFO = {
  minSpawnMs: 16000,
  maxSpawnMs: 30000,
  speed: 150, // px/sec
  width: 56,
  height: 26,
  topOffset: 34,
  points: 200,
} as const;

export const SHIELD = {
  hp: 6,
  /** ms to regenerate one HP point while damaged (downed shields rebuild over time). */
  rechargeMs: 2800,
  flashMs: 200,
} as const;

export type LootType = "spread" | "rail" | "homing" | "overdrive" | "life";

export const LOOT = {
  /** weapon/powerup loot (random pick on most drops). */
  weaponTypes: ["spread", "rail", "homing", "overdrive"] as LootType[],
  dropChance: 0.13,
  /** independent rare chance for an extra-life drop per kill. */
  lifeChance: 0.02,
  fallSpeed: 150, // px/sec
  size: 22,
  spinRate: 2.4,
} as const;

/** Award an extra life every time score crosses this interval. */
export const LIFE_SCORE_STEP = 6000;

export const FX = {
  invaderDeathMs: 120,
  shakeMs: 240,
  readyMs: 6000,
  waveClearMs: 1500,
  dyingMs: 950,
} as const;

/** Five enemy archetypes (mesh design index = type). */
export const ENEMY = {
  hp: [1, 1, 2, 1, 3],
  points: [20, 25, 35, 30, 50],
  /** collision/mesh footprint per type (px). */
  width: [28, 30, 34, 26, 40],
  height: [20, 18, 24, 18, 28],
} as const;

export const FORMATION_STYLES = [
  "grid",
  "diamond",
  "arrow",
  "columns",
  "arc",
  "checker",
  "spearhead",
] as const;
export type FormationStyle = (typeof FORMATION_STYLES)[number];

export type BossKind = "cruiser" | "mini" | "octopus";

export const BOSS: Record<BossKind, { hp: number; points: number; name: string; width: number; height: number }> = {
  cruiser: { hp: 55, points: 1200, name: "DREADNOUGHT", width: 140, height: 70 },
  mini: { hp: 40, points: 800, name: "MARAUDER", width: 100, height: 58 },
  octopus: { hp: 120, points: 3500, name: "VOID KRAKEN", width: 210, height: 170 },
} as const;

/** Boss schedule: 3 = cruiser, 5/15/25 = mega kraken, every 6th = mini. */
export function bossForWave(wave: number): BossKind | null {
  if (wave === 3) return "cruiser";
  if (wave === 5 || (wave > 5 && (wave - 5) % 10 === 0)) return "octopus";
  if (wave % 6 === 0) return "mini";
  return null;
}

export function formationForWave(wave: number): FormationStyle {
  return FORMATION_STYLES[(wave - 1) % FORMATION_STYLES.length]!;
}

/** Per-wave environment palette so every map feels distinct. */
export const WAVE_THEMES = [
  { bg: 0x070d18, grid: 0x16304f, fog: 0x060c16 },
  { bg: 0x0d0a1a, grid: 0x3a1f5c, fog: 0x0a0716 },
  { bg: 0x081512, grid: 0x16432f, fog: 0x07120d },
  { bg: 0x140d08, grid: 0x4f3216, fog: 0x120a06 },
  { bg: 0x0a0f1c, grid: 0x244a6e, fog: 0x070c16 },
  { bg: 0x120816, grid: 0x55204a, fog: 0x0c0612 },
] as const;
export function waveTheme(wave: number) {
  return WAVE_THEMES[(wave - 1) % WAVE_THEMES.length]!;
}

export const HIGH_SCORE_KEY = "pl-rentals-invaders-hs-3d";
