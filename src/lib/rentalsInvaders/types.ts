/** Shared game types for the Rentals-hero Space Invaders engine. */

export type Phase =
  | "ready" // brief "PRESS SPACE" intro before a wave
  | "playing"
  | "paused"
  | "dying" // player just lost a life, short pause
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
};

export type Invader = {
  alive: boolean;
  col: number;
  row: number;
  x: number; // center
  y: number; // center
  points: number;
  sprite: number; // sprite design index
  /** ms of death-freeze remaining; > 0 means exploding, not yet cleared. */
  dying: number;
};

export type Ufo = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  points: number;
};

export type Player = {
  x: number; // center
  y: number; // center
  cooldown: number; // ms until next shot allowed
  invuln: number; // ms of post-respawn invulnerability
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // ms remaining
  maxLife: number;
  color: string;
  size: number;
};

/** Read-only obstacle derived from a floating rental pin (PhysicsBody). */
export type PinObstacle = {
  x: number;
  y: number;
  radius: number;
};

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
  ufo: Ufo;
  particles: Particle[];
  pins: PinObstacle[];

  /** Formation march state. */
  dir: 1 | -1;
  marchTimer: number;
  stepFrame: 0 | 1;
  enemyFireTimer: number;
  ufoTimer: number;

  /** Counts down generic phase transitions (ready / dying / wave-clear). */
  phaseTimer: number;
  shake: number;

  width: number;
  height: number;

  keys: { left: boolean; right: boolean; fire: boolean };
  /** Total invaders spawned this wave — drives march speedup. */
  spawnedThisWave: number;
};
