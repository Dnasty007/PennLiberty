/** Spawning + per-step movement for game entities. Pure simulation: mutates
 *  the passed state but never touches audio/render (the engine owns those). */
import {
  BULLET,
  ENEMY_FIRE,
  GRID,
  MARCH,
  MYSTERY_POINTS,
  PLAYER,
  UFO,
} from "./constants";
import { spawnBunkers } from "./bunkers";
import type { Bullet, GameState, Invader, Particle } from "./types";

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function aliveInvaders(state: GameState): Invader[] {
  return state.invaders.filter((i) => i.alive);
}

export function createInitialState(
  width: number,
  height: number,
  highScore: number,
): GameState {
  const state: GameState = {
    phase: "ready",
    score: 0,
    highScore,
    lives: PLAYER.lives,
    wave: 1,
    player: { x: width / 2, y: 0, cooldown: 0, invuln: 0 },
    invaders: [],
    playerBullets: Array.from({ length: BULLET.maxPlayer }, () =>
      idleBullet("player"),
    ),
    enemyBullets: Array.from({ length: BULLET.maxEnemy }, () =>
      idleBullet("enemy"),
    ),
    ufo: { active: false, x: 0, y: 0, vx: 0, points: 0 },
    particles: [],
    pins: [],
    bunkers: [],
    dir: 1,
    marchTimer: 0,
    stepFrame: 0,
    enemyFireTimer: ENEMY_FIRE.baseIntervalMs,
    ufoTimer: rand(UFO.minSpawnMs, UFO.maxSpawnMs),
    playerShotsFired: 0,
    phaseTimer: 0,
    shake: 0,
    width,
    height,
    keys: { left: false, right: false, fire: false },
    spawnedThisWave: 0,
  };
  layoutPlayer(state);
  spawnWave(state);
  return state;
}

function idleBullet(from: "player" | "enemy"): Bullet {
  return { active: false, x: 0, y: 0, vx: 0, vy: 0, from };
}

export function layoutPlayer(state: GameState) {
  state.player.y = state.height - PLAYER.marginBottom;
  state.player.x = clamp(
    state.player.x,
    PLAYER.width / 2 + 6,
    state.width - PLAYER.width / 2 - 6,
  );
}

/** Build the 5×11 formation, scaled + centered; reset bunkers each wave. */
export function spawnWave(state: GameState) {
  const { rows, cols } = GRID;
  const blockW = state.width * GRID.widthFraction;
  const stride = blockW / cols;
  const startX = (state.width - blockW) / 2 + stride / 2;
  const rowStride = GRID.invaderHeight + 14;
  // Each successive wave starts a touch lower (classic pressure).
  const top = GRID.topPad + (state.wave - 1) * 6;

  const invaders: Invader[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      invaders.push({
        alive: true,
        col,
        row,
        x: startX + col * stride,
        y: top + row * rowStride,
        // Classic: top row worth most (squid 30 → octopus 10).
        points: GRID.rowPointsTopToBottom[row]!,
        sprite: GRID.rowSpriteTopToBottom[row]!,
        dying: 0,
      });
    }
  }
  state.invaders = invaders;
  state.spawnedThisWave = invaders.length;
  state.dir = 1;
  state.marchTimer = MARCH.baseStepMs;
  state.stepFrame = 0;
  state.enemyFireTimer = ENEMY_FIRE.baseIntervalMs;

  // Clear live projectiles; bunkers restore each wave.
  for (const b of state.playerBullets) b.active = false;
  for (const b of state.enemyBullets) b.active = false;
  state.ufo.active = false;
  layoutPlayer(state);
  state.bunkers = spawnBunkers(state.width, state.height, state.player.y);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function movePlayer(state: GameState, stepMs: number) {
  const dir = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
  const dt = stepMs / (1000 / 60);
  state.player.x += dir * PLAYER.speed * dt;
  state.player.x = clamp(
    state.player.x,
    PLAYER.width / 2 + 6,
    state.width - PLAYER.width / 2 - 6,
  );
  if (state.player.cooldown > 0) state.player.cooldown -= stepMs;
  if (state.player.invuln > 0) state.player.invuln -= stepMs;
}

/**
 * Classic SI: fire only when no player bullet is active (max 1 on screen).
 * Short cooldown is anti-repeat only. Increments playerShotsFired for the
 * mystery-ship point table.
 */
export function tryFirePlayer(state: GameState): boolean {
  if (state.player.cooldown > 0) return false;
  const slot = state.playerBullets.find((b) => !b.active);
  if (!slot) return false;
  slot.active = true;
  slot.x = state.player.x;
  slot.y = state.player.y - PLAYER.height;
  slot.vx = 0;
  slot.vy = -BULLET.playerSpeed;
  state.player.cooldown = PLAYER.fireCooldownMs;
  state.playerShotsFired += 1;
  return true;
}

export function moveBullets(state: GameState, stepMs: number) {
  const dt = stepMs / (1000 / 60);
  for (const b of [...state.playerBullets, ...state.enemyBullets]) {
    if (!b.active) continue;
    // Vertical only for both sides (classic).
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (
      b.y < -16 ||
      b.y > state.height + 16 ||
      b.x < -16 ||
      b.x > state.width + 16
    ) {
      b.active = false;
    }
  }
}

function marchStepInterval(state: GameState): number {
  const dead = state.spawnedThisWave - aliveInvaders(state).length;
  const interval =
    MARCH.baseStepMs -
    dead * MARCH.perKillSpeedupMs -
    (state.wave - 1) * MARCH.perWaveSpeedupMs;
  return clamp(interval, MARCH.minStepMs, MARCH.baseStepMs);
}

/**
 * Synchronized block march: step left/right; when ANY edge invader would
 * leave the screen, reverse direction and drop the whole formation.
 * Toggles the 2-frame walk animation on each step. Returns true on a step
 * (for step SFX).
 */
export function marchInvaders(state: GameState, stepMs: number): boolean {
  for (const inv of state.invaders) {
    if (inv.dying > 0) inv.dying = Math.max(0, inv.dying - stepMs);
  }

  state.marchTimer -= stepMs;
  if (state.marchTimer > 0) return false;
  state.marchTimer += marchStepInterval(state);

  const alive = aliveInvaders(state);
  if (alive.length === 0) return false;

  const half = GRID.invaderWidth / 2;
  const pad = 8;
  const hStep = state.width * MARCH.hStepFraction;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const inv of alive) {
    minX = Math.min(minX, inv.x);
    maxX = Math.max(maxX, inv.x);
  }

  const wouldExceed =
    (state.dir === 1 && maxX + hStep + half > state.width - pad) ||
    (state.dir === -1 && minX - hStep - half < pad);

  if (wouldExceed) {
    // Classic: drop + reverse on the same beat (no horizontal travel that step).
    state.dir = (state.dir === 1 ? -1 : 1) as 1 | -1;
    for (const inv of state.invaders) inv.y += MARCH.dropPx;
  } else {
    for (const inv of state.invaders) inv.x += hStep * state.dir;
  }

  state.stepFrame = state.stepFrame === 0 ? 1 : 0;
  return true;
}

/**
 * Only the bottom-most alive invader in a column may shoot. Pick a random
 * eligible column. Bullets travel vertically only (no aiming). Cap is
 * BULLET.maxEnemy concurrent shots.
 */
export function maybeEnemyFire(state: GameState, stepMs: number) {
  state.enemyFireTimer -= stepMs;
  if (state.enemyFireTimer > 0) return;

  const base = Math.max(
    ENEMY_FIRE.minIntervalMs,
    ENEMY_FIRE.baseIntervalMs -
      (state.wave - 1) * ENEMY_FIRE.perWaveReductionMs,
  );
  state.enemyFireTimer = base * rand(0.7, 1.3);

  const slot = state.enemyBullets.find((b) => !b.active);
  if (!slot) return;

  // Bottom-most alive invader per column.
  const bottoms = new Map<number, Invader>();
  for (const inv of state.invaders) {
    if (!inv.alive) continue;
    const cur = bottoms.get(inv.col);
    if (!cur || inv.y > cur.y) bottoms.set(inv.col, inv);
  }
  const shooters = [...bottoms.values()];
  if (shooters.length === 0) return;

  const shooter = shooters[Math.floor(Math.random() * shooters.length)]!;
  slot.active = true;
  slot.x = shooter.x;
  slot.y = shooter.y + GRID.invaderHeight / 2;
  slot.vy = BULLET.enemySpeed;
  slot.vx = 0; // vertical only — classic SI never aimed
}

/**
 * Mystery ship: spawn every 20–40s, fly across the top.
 * Points are resolved from the classic shot-count table at spawn (and
 * re-checked at hit for safety) via mysteryPointsFor(shots).
 */
export function mysteryPointsFor(playerShotsFired: number): number {
  return MYSTERY_POINTS[playerShotsFired % MYSTERY_POINTS.length]!;
}

export function updateUfo(state: GameState, stepMs: number): "spawn" | null {
  const dt = stepMs / (1000 / 60);
  if (state.ufo.active) {
    state.ufo.x += state.ufo.vx * dt;
    if (state.ufo.x < -UFO.width || state.ufo.x > state.width + UFO.width) {
      state.ufo.active = false;
    }
    return null;
  }

  state.ufoTimer -= stepMs;
  if (state.ufoTimer > 0) return null;
  state.ufoTimer = rand(UFO.minSpawnMs, UFO.maxSpawnMs);

  const fromLeft = Math.random() < 0.5;
  state.ufo = {
    active: true,
    x: fromLeft ? -UFO.width : state.width + UFO.width,
    y: UFO.topOffset,
    vx: fromLeft ? UFO.speed : -UFO.speed,
    // Snapshot table value; engine re-resolves on hit with current shot count.
    points: mysteryPointsFor(state.playerShotsFired),
  };
  return "spawn";
}

export function spawnParticles(
  state: GameState,
  x: number,
  y: number,
  count: number,
  color: string,
  spread = 2.4,
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(0.5, spread);
    const life = rand(220, 520);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      color,
      size: rand(1.5, 3),
    });
  }
}

export function updateParticles(state: GameState, stepMs: number) {
  const dt = stepMs / (1000 / 60);
  const next: Particle[] = [];
  for (const p of state.particles) {
    p.life -= stepMs;
    if (p.life <= 0) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.04 * dt; // light gravity
    next.push(p);
  }
  state.particles = next;
}
