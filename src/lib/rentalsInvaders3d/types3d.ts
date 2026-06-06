import type { BossKind, LootType, WeaponId } from "./constants3d";

export type Phase =
  | "ready"
  | "playing"
  | "paused"
  | "dying"
  | "wave-clear"
  | "over";

export type BulletSource = "player" | "enemy";

export type Bullet = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  from: BulletSource;
  pierce: boolean;
  homing: boolean;
  hex: number;
};

export type Invader = {
  alive: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  type: number; // mesh design index
  points: number;
  dying: number; // ms of death freeze remaining
  /** stable id for mesh pooling */
  id: number;
};

export type Loot = {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  type: LootType;
  spin: number;
};

export type Ufo = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  points: number;
};

export type Boss = {
  active: boolean;
  kind: BossKind;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  width: number;
  height: number;
  t: number; // animation clock (ms)
  attackTimer: number;
  attackPhase: number;
  hitFlash: number;
  dying: number; // death sequence ms remaining
};

export type Player = {
  x: number;
  y: number;
  weapon: WeaponId;
  overdriveMs: number;
  cooldown: number;
  invuln: number;
};

export type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  hex: number;
  size: number;
};

export type PinObstacle = { x: number; y: number; radius: number };

export type GameState = {
  phase: Phase;
  score: number;
  highScore: number;
  lives: number;
  wave: number;

  player: Player;
  invaders: Invader[];
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  loot: Loot[];
  ufo: Ufo;
  boss: Boss | null;
  particles: Particle[];

  pins: PinObstacle[];
  shieldHp: number[];
  shieldRecharge: number[];
  shieldFlash: number[];

  dir: 1 | -1;
  enemyFireTimer: number;
  ufoTimer: number;
  phaseTimer: number;
  shake: number;

  width: number;
  height: number;

  keys: { left: boolean; right: boolean; fire: boolean };
  spawnedThisWave: number;
  nextInvaderId: number;
  /** score threshold for the next milestone extra life. */
  nextLifeScore: number;
  /** Toast text + ttl for weapon pickups (HUD feedback). */
  toast: { text: string; ttl: number } | null;
};
