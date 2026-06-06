/** Fixed-timestep simulation for the 3D remaster. Pure logic in hero-pixel
 *  space — no THREE imports. scene3d reads this state and drives the meshes. */
import type { GameAudio3D } from "./audio3d";
import {
  BOSS,
  bossForWave,
  BULLET,
  ENEMY,
  ENEMY_FIRE,
  formationForWave,
  FX,
  GRID,
  HIGH_SCORE_KEY,
  LIFE_SCORE_STEP,
  LOOT,
  MARCH,
  PLAYER,
  SHIELD,
  STEP_MS,
  UFO,
  WEAPONS,
  type LootType,
} from "./constants3d";
import { buildFormationSpecs, type SpawnSpec } from "./formations3d";
import type { Boss, GameState, Invader, Phase, PinObstacle } from "./types3d";

export type EngineCallbacks = {
  onPhaseChange?: (phase: Phase, s: GameState) => void;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function pointInCircle(px: number, py: number, cx: number, cy: number, r: number) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}
function rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return Math.abs(ax - bx) * 2 < aw + bw && Math.abs(ay - by) * 2 < ah + bh;
}
function normAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function loadHighScore(): number {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}
function saveHighScore(v: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(v));
  } catch {
    /* ignore */
  }
}

export class InvadersEngine3D {
  state: GameState;
  private audio: GameAudio3D;
  private cb: EngineCallbacks;
  private acc = 0;
  private marchPulse = 420;
  private marchLow = false;

  constructor(width: number, height: number, audio: GameAudio3D, cb: EngineCallbacks = {}) {
    this.audio = audio;
    this.cb = cb;
    this.state = this.fresh(width, height, loadHighScore());
  }

  private fresh(width: number, height: number, highScore: number): GameState {
    const s: GameState = {
      phase: "ready",
      score: 0,
      highScore,
      lives: PLAYER.lives,
      wave: 1,
      player: { x: width / 2, y: 0, weapon: "blaster", overdriveMs: 0, cooldown: 0, invuln: 0 },
      invaders: [],
      playerBullets: [],
      enemyBullets: [],
      loot: [],
      ufo: { active: false, x: 0, y: 0, vx: 0, points: 0 },
      boss: null,
      particles: [],
      pins: [],
      shieldHp: [],
      shieldRecharge: [],
      shieldFlash: [],
      dir: 1,
      enemyFireTimer: ENEMY_FIRE.baseIntervalMs,
      ufoTimer: rand(UFO.minSpawnMs, UFO.maxSpawnMs),
      phaseTimer: FX.readyMs,
      shake: 0,
      width,
      height,
      keys: { left: false, right: false, fire: false },
      spawnedThisWave: 0,
      nextInvaderId: 1,
      nextLifeScore: LIFE_SCORE_STEP,
      toast: null,
    };
    this.layoutPlayer(s);
    this.spawnWave(s);
    return s;
  }

  getState() {
    return this.state;
  }

  setKey(action: "left" | "right" | "fire" | "pause", down: boolean) {
    if (action === "pause") {
      if (down) this.togglePause();
      return;
    }
    this.state.keys[action] = down;
  }

  togglePause() {
    if (this.state.phase === "playing") this.setPhase("paused");
    else if (this.state.phase === "paused") this.setPhase("playing");
  }

  restart() {
    this.audio.stopMusic();
    this.state = this.fresh(this.state.width, this.state.height, loadHighScore());
    this.acc = 0;
    this.cb.onPhaseChange?.(this.state.phase, this.state);
  }

  setBounds(width: number, height: number) {
    const s = this.state;
    if (width <= 0 || height <= 0) return;
    const sx = s.width > 0 ? width / s.width : 1;
    const sy = s.height > 0 ? height / s.height : 1;
    for (const inv of s.invaders) {
      inv.x *= sx;
      inv.y *= sy;
    }
    for (const b of [...s.playerBullets, ...s.enemyBullets]) {
      b.x *= sx;
      b.y *= sy;
    }
    for (const l of s.loot) {
      l.x *= sx;
      l.y *= sy;
    }
    s.player.x *= sx;
    s.ufo.x *= sx;
    if (s.boss) {
      s.boss.x *= sx;
      s.boss.y *= sy;
    }
    s.width = width;
    s.height = height;
    this.layoutPlayer(s);
  }

  setPins(pins: PinObstacle[]) {
    const s = this.state;
    s.pins = pins;
    const n = pins.length;
    while (s.shieldHp.length < n) {
      s.shieldHp.push(SHIELD.hp);
      s.shieldRecharge.push(0);
      s.shieldFlash.push(0);
    }
    if (s.shieldHp.length > n) {
      s.shieldHp.length = n;
      s.shieldRecharge.length = n;
      s.shieldFlash.length = n;
    }
  }

  update(realDtMs: number) {
    this.acc += Math.min(realDtMs, 250);
    while (this.acc >= STEP_MS) {
      this.tick(STEP_MS);
      this.acc -= STEP_MS;
    }
  }

  // ── core ──────────────────────────────────────────────────────────────
  private layoutPlayer(s: GameState) {
    s.player.y = s.height - PLAYER.marginBottom;
    s.player.x = clamp(s.player.x, PLAYER.width / 2 + 8, s.width - PLAYER.width / 2 - 8);
  }

  private makeInvader(s: GameState, spec: SpawnSpec): Invader {
    const t = spec.type;
    return {
      alive: true,
      x: spec.x,
      y: spec.y,
      w: ENEMY.width[t]!,
      h: ENEMY.height[t]!,
      hp: ENEMY.hp[t]!,
      type: t,
      points: ENEMY.points[t]!,
      dying: 0,
      id: s.nextInvaderId++,
    };
  }

  private spawnWave(s: GameState) {
    s.dir = 1;
    s.enemyFireTimer = ENEMY_FIRE.baseIntervalMs;
    const kind = bossForWave(s.wave);

    if (kind) {
      const cfg = BOSS[kind];
      const scale = 1 + Math.floor((s.wave - 1) / 5) * 0.35;
      const hp = Math.round(cfg.hp * scale);
      this.audio.bossAppear(kind);
      s.boss = {
        active: true,
        kind,
        name: cfg.name,
        x: s.width / 2,
        y: cfg.height / 2 + 38,
        vx: (kind === "octopus" ? 70 : 110) * (Math.random() < 0.5 ? 1 : -1),
        vy: 0,
        hp,
        maxHp: hp,
        width: cfg.width,
        height: cfg.height,
        t: 0,
        attackTimer: 1300,
        attackPhase: 0,
        hitFlash: 0,
        dying: 0,
      };
      // escort minions (none for the kraken — it fills the field itself)
      const escort =
        kind === "octopus"
          ? []
          : buildFormationSpecs("columns", Math.min(s.wave, 4), s.width, s.height).slice(0, 8);
      s.invaders = escort.map((spec) => this.makeInvader(s, spec));
    } else {
      s.boss = null;
      const specs = buildFormationSpecs(formationForWave(s.wave), s.wave, s.width, s.height);
      s.invaders = specs.map((spec) => this.makeInvader(s, spec));
    }
    s.spawnedThisWave = s.invaders.length;
  }

  private setPhase(phase: Phase) {
    const s = this.state;
    if (s.phase === phase) return;
    const prev = s.phase;
    s.phase = phase;
    if (phase === "over" && s.score > s.highScore) {
      s.highScore = s.score;
      saveHighScore(s.highScore);
    }

    if (phase === "playing") {
      if (prev === "ready") this.audio.gameStart();
      else this.audio.startMusic();
    } else if (phase === "wave-clear") {
      this.audio.waveClear();
      this.audio.stopMusic();
    } else if (phase === "paused" || phase === "over" || phase === "ready") {
      this.audio.stopMusic();
    }
    if (phase === "over") this.audio.gameOver();

    this.cb.onPhaseChange?.(phase, s);
  }

  private tick(stepMs: number) {
    const s = this.state;
    if (s.phase === "paused") return;

    this.updateParticles(stepMs);
    this.updateShields(stepMs);
    if (s.shake > 0) s.shake = Math.max(0, s.shake - stepMs);
    if (s.toast) {
      s.toast.ttl -= stepMs;
      if (s.toast.ttl <= 0) s.toast = null;
    }

    switch (s.phase) {
      case "ready":
        s.phaseTimer -= stepMs;
        if (s.keys.fire || s.phaseTimer <= 0) this.setPhase("playing");
        break;
      case "playing":
        this.tickPlaying(stepMs);
        break;
      case "dying":
        s.phaseTimer -= stepMs;
        if (s.phaseTimer <= 0) {
          this.layoutPlayer(s);
          s.player.x = s.width / 2;
          s.player.invuln = PLAYER.respawnInvulnMs;
          this.setPhase("playing");
        }
        break;
      case "wave-clear":
        s.phaseTimer -= stepMs;
        if (s.phaseTimer <= 0) {
          s.wave += 1;
          this.spawnWave(s);
          s.player.x = s.width / 2;
          s.phaseTimer = FX.readyMs;
          this.setPhase("ready");
        }
        break;
      case "over":
        break;
    }
  }

  private tickPlaying(stepMs: number) {
    const s = this.state;
    const dt = stepMs / 1000;

    this.movePlayer(stepMs);
    this.thruster();
    if (s.keys.fire) this.firePlayer();
    this.moveBullets(dt);
    this.marchInvaders(dt, stepMs);
    this.enemyFire(stepMs);
    this.updateUfo(dt, stepMs);
    this.updateBoss(dt, stepMs);
    this.updateLoot(dt);

    this.collideBulletsWithShields();
    this.collidePlayerBullets();
    this.collideEnemyBulletsWithPlayer();
    this.collideLootWithPlayer();
    this.checkInvaderDescent();

    if (s.score >= s.nextLifeScore) {
      s.nextLifeScore += LIFE_SCORE_STEP;
      this.awardLife("EXTRA LIFE!");
    }

    const cleared = s.invaders.every((i) => !i.alive) && (!s.boss || !s.boss.active);
    if (cleared && s.phase === "playing") {
      s.phaseTimer = FX.waveClearMs;
      this.setPhase("wave-clear");
    }
  }

  private movePlayer(stepMs: number) {
    const s = this.state;
    const dt = stepMs / 1000;
    const dir = (s.keys.right ? 1 : 0) - (s.keys.left ? 1 : 0);
    s.player.x = clamp(
      s.player.x + dir * PLAYER.speed * dt,
      PLAYER.width / 2 + 8,
      s.width - PLAYER.width / 2 - 8,
    );
    if (s.player.cooldown > 0) s.player.cooldown -= stepMs;
    if (s.player.invuln > 0) s.player.invuln -= stepMs;
    if (s.player.overdriveMs > 0) s.player.overdriveMs -= stepMs;
  }

  private pushPlayerBullet(x: number, y: number, vx: number, vy: number, pierce: boolean, homing: boolean, hex: number) {
    this.state.playerBullets.push({ active: true, x, y, vx, vy, from: "player", pierce, homing, hex });
  }

  private firePlayer() {
    const s = this.state;
    if (s.player.cooldown > 0) return;
    if (s.playerBullets.filter((b) => b.active).length >= BULLET.maxPlayer) return;

    const def = WEAPONS[s.player.weapon];
    const od = s.player.overdriveMs > 0;
    s.player.cooldown = def.cooldownMs * (od ? PLAYER.overdriveCooldownScale : 1);
    const px = s.player.x;
    const py = s.player.y - PLAYER.height / 2;
    const sp = def.speed;

    if (s.player.weapon === "spread") {
      const n = def.bolts + (od ? 2 : 0);
      for (let i = 0; i < n; i++) {
        const frac = n > 1 ? i / (n - 1) - 0.5 : 0;
        const ang = frac * 0.5;
        this.pushPlayerBullet(px, py, Math.sin(ang) * sp, -Math.cos(ang) * sp, false, false, def.hex);
      }
    } else if (s.player.weapon === "homing") {
      const n = def.bolts + (od ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const frac = n > 1 ? i / (n - 1) - 0.5 : 0;
        this.pushPlayerBullet(px, py, frac * 180, -sp, false, true, def.hex);
      }
    } else if (s.player.weapon === "rail") {
      const n = 1 + (od ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const off = n > 1 ? (i - 0.5) * 14 : 0;
        this.pushPlayerBullet(px + off, py, 0, -sp, true, false, def.hex);
      }
    } else {
      const n = 1 + (od ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const off = n > 1 ? (i - 0.5) * 12 : 0;
        this.pushPlayerBullet(px + off, py, 0, -sp, false, false, def.hex);
      }
    }
    // muzzle flash
    for (let i = 0; i < 5; i++) {
      this.spark(
        px + (Math.random() - 0.5) * 10,
        py - 4,
        (Math.random() - 0.5) * 90,
        -rand(60, 170),
        rand(120, 220),
        def.hex,
        rand(2, 4),
        rand(-3, 3),
      );
    }
    this.audio.shoot(s.player.weapon);
  }

  private thruster() {
    const s = this.state;
    const od = s.player.overdriveMs > 0;
    const n = od ? 2 : 1;
    for (let i = 0; i < n; i++) {
      this.spark(
        s.player.x + (Math.random() - 0.5) * 12,
        s.player.y + PLAYER.height / 2,
        (Math.random() - 0.5) * 44,
        rand(90, 190),
        rand(160, 300),
        od ? 0xffa23d : 0x35e0ff,
        rand(1.6, 3.2),
        rand(-3, 3),
      );
    }
  }

  private spark(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    hex: number,
    size: number,
    z = 0,
  ) {
    this.state.particles.push({ x, y, z, vx, vy, vz: 0, life, maxLife: life, hex, size });
  }

  private nearestInvader(x: number, y: number): Invader | null {
    let best: Invader | null = null;
    let bestD = Infinity;
    for (const inv of this.state.invaders) {
      if (!inv.alive) continue;
      const d = (inv.x - x) ** 2 + (inv.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = inv;
      }
    }
    return best;
  }

  private moveBullets(dt: number) {
    const s = this.state;
    for (const b of s.playerBullets) {
      if (!b.active) continue;
      if (b.homing) {
        const target = this.nearestInvader(b.x, b.y);
        if (target) {
          const desired = Math.atan2(target.y - b.y, target.x - b.x);
          let cur = Math.atan2(b.vy, b.vx);
          const diff = normAngle(desired - cur);
          cur += clamp(diff, -BULLET.homingTurn * dt, BULLET.homingTurn * dt);
          const sp = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(cur) * sp;
          b.vy = Math.sin(cur) * sp;
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -24 || b.y > s.height + 24 || b.x < -24 || b.x > s.width + 24) b.active = false;
    }
    for (const b of s.enemyBullets) {
      if (!b.active) continue;
      if (b.homing) {
        const desired = Math.atan2(s.player.y - b.y, s.player.x - b.x);
        let cur = Math.atan2(b.vy, b.vx);
        cur += clamp(normAngle(desired - cur), -2.6 * dt, 2.6 * dt);
        const sp = Math.hypot(b.vx, b.vy);
        b.vx = Math.cos(cur) * sp;
        b.vy = Math.sin(cur) * sp;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > s.height + 24 || b.y < -60 || b.x < -24 || b.x > s.width + 24) b.active = false;
    }
    s.playerBullets = s.playerBullets.filter((b) => b.active);
    s.enemyBullets = s.enemyBullets.filter((b) => b.active);
  }

  private marchInvaders(dt: number, stepMs: number) {
    const s = this.state;
    for (const inv of s.invaders) if (inv.dying > 0) inv.dying = Math.max(0, inv.dying - stepMs);

    const alive = s.invaders.filter((i) => i.alive);
    if (alive.length === 0) return;

    const dead = s.spawnedThisWave - alive.length;
    const speed = Math.min(
      MARCH.maxSpeed,
      MARCH.baseSpeed + dead * MARCH.perKillSpeed + (s.wave - 1) * MARCH.perWaveSpeed,
    );
    const dx = s.dir * speed * dt;
    const half = GRID.invaderWidth / 2;
    let minX = Infinity;
    let maxX = -Infinity;
    for (const inv of alive) {
      minX = Math.min(minX, inv.x);
      maxX = Math.max(maxX, inv.x);
    }
    const hitWall =
      (s.dir === 1 && maxX + dx + half > s.width - MARCH.edgePad) ||
      (s.dir === -1 && minX + dx - half < MARCH.edgePad);

    if (hitWall) {
      s.dir = (s.dir === 1 ? -1 : 1) as 1 | -1;
      for (const inv of s.invaders) inv.y += MARCH.dropPx;
    } else {
      for (const inv of s.invaders) inv.x += dx;
    }

    this.marchPulse -= stepMs;
    if (this.marchPulse <= 0) {
      this.marchPulse = clamp(600 - dead * 5 - (s.wave - 1) * 18, 130, 600);
      this.marchLow = !this.marchLow;
      this.audio.step(this.marchLow);
    }
  }

  private enemyFire(stepMs: number) {
    const s = this.state;
    s.enemyFireTimer -= stepMs;
    if (s.enemyFireTimer > 0) return;
    const interval = Math.max(
      ENEMY_FIRE.minIntervalMs,
      ENEMY_FIRE.baseIntervalMs - (s.wave - 1) * ENEMY_FIRE.perWaveReductionMs,
    );
    s.enemyFireTimer = interval * rand(0.6, 1.3);
    if (s.enemyBullets.filter((b) => b.active).length >= BULLET.maxEnemy) return;

    // bottom-most alive invader per x-bucket (works for any formation layout)
    const bottoms = new Map<number, Invader>();
    for (const inv of s.invaders) {
      if (!inv.alive) continue;
      const key = Math.round(inv.x / 44);
      const cur = bottoms.get(key);
      if (!cur || inv.y > cur.y) bottoms.set(key, inv);
    }
    const shooters = [...bottoms.values()];
    if (shooters.length === 0) return;
    const shooter = shooters[Math.floor(Math.random() * shooters.length)]!;

    let vx = 0;
    let vy = BULLET.enemySpeed;
    if (s.wave >= ENEMY_FIRE.aimedFromWave && Math.random() < ENEMY_FIRE.aimedChance) {
      const dx = s.player.x - shooter.x;
      const dy = Math.max(40, s.player.y - shooter.y);
      const ang = Math.atan2(dy, dx);
      vx = Math.cos(ang) * BULLET.enemySpeed;
      vy = Math.sin(ang) * BULLET.enemySpeed;
    }
    s.enemyBullets.push({
      active: true,
      x: shooter.x,
      y: shooter.y + shooter.h / 2,
      vx,
      vy,
      from: "enemy",
      pierce: false,
      homing: false,
      hex: 0xff5a6e,
    });
  }

  private updateUfo(dt: number, stepMs: number) {
    const s = this.state;
    if (s.ufo.active) {
      s.ufo.x += s.ufo.vx * dt;
      if (s.ufo.x < -UFO.width || s.ufo.x > s.width + UFO.width) s.ufo.active = false;
      return;
    }
    s.ufoTimer -= stepMs;
    if (s.ufoTimer > 0) return;
    s.ufoTimer = rand(UFO.minSpawnMs, UFO.maxSpawnMs);
    const fromLeft = Math.random() < 0.5;
    s.ufo = {
      active: true,
      x: fromLeft ? -UFO.width : s.width + UFO.width,
      y: UFO.topOffset,
      vx: fromLeft ? UFO.speed : -UFO.speed,
      points: UFO.points,
    };
    this.audio.ufo();
  }

  // ── boss ────────────────────────────────────────────────────────────────
  private updateBoss(dt: number, stepMs: number) {
    const s = this.state;
    const b = s.boss;
    if (!b) return;
    b.t += stepMs;
    if (b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - stepMs);

    if (b.dying > 0) {
      b.dying -= stepMs;
      if (Math.random() < 0.6) {
        this.burst(
          b.x + rand(-b.width / 2, b.width / 2),
          b.y + rand(-b.height / 2, b.height / 2),
          12,
          [0xffa23d, 0xff45e0, 0x35e0ff][Math.floor(Math.random() * 3)]!,
          220,
        );
      }
      if (b.dying <= 0) b.active = false;
      return;
    }

    const enrage = b.hp < b.maxHp * 0.4 ? 1.5 : 1;
    b.x += b.vx * dt * enrage;
    const margin = b.width / 2 + 18;
    if (b.x < margin) {
      b.x = margin;
      b.vx = Math.abs(b.vx);
    } else if (b.x > s.width - margin) {
      b.x = s.width - margin;
      b.vx = -Math.abs(b.vx);
    }
    b.y = b.height / 2 + 38 + Math.sin(b.t * 0.001) * (b.kind === "octopus" ? 24 : 12);

    b.attackTimer -= stepMs;
    if (b.attackTimer <= 0) this.bossAttack(b, enrage);
  }

  private fireEnemy(x: number, y: number, vx: number, vy: number, hex: number, homing = false) {
    const s = this.state;
    if (s.enemyBullets.length >= BULLET.maxEnemy) return;
    s.enemyBullets.push({ active: true, x, y, vx, vy, from: "enemy", pierce: false, homing, hex });
  }

  private bossAttack(b: Boss, enrage: number) {
    b.attackTimer = (b.kind === "octopus" ? 900 : 1150) / enrage;
    const sp = BULLET.enemySpeed;
    const ox = b.x;
    const oy = b.y + b.height / 2;

    if (b.kind === "cruiser") {
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI / 2 + (i / 6 - 0.5) * 1.0;
        this.fireEnemy(ox, oy, Math.cos(ang) * sp * 1.05, Math.sin(ang) * sp * 1.05, 0xff8a3d);
      }
    } else if (b.kind === "mini") {
      b.attackPhase = (b.attackPhase + 1) % 2;
      if (b.attackPhase === 0) {
        const ang = Math.atan2(this.state.player.y - oy, this.state.player.x - ox);
        for (let i = -1; i <= 1; i++) {
          this.fireEnemy(ox, oy, Math.cos(ang + i * 0.12) * sp, Math.sin(ang + i * 0.12) * sp, 0xff5a6e);
        }
      } else {
        for (let i = 0; i < 5; i++) {
          const ang = Math.PI / 2 + (i / 4 - 0.5) * 0.8;
          this.fireEnemy(ox, oy, Math.cos(ang) * sp, Math.sin(ang) * sp, 0xff8a3d);
        }
      }
    } else {
      // octopus — radial burst + rain only (homing trackers removed — too lethal)
      const phase = b.attackPhase % 2;
      b.attackPhase = (b.attackPhase + 1) % 2;

      if (phase === 0) {
        const n = enrage > 1 ? 18 : 14;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2 + b.t * 0.001;
          this.fireEnemy(b.x, b.y, Math.cos(ang) * sp * 0.8, Math.sin(ang) * sp * 0.8, 0xff45e0);
        }
        this.audio.bossAttack();
      } else {
        const cols = 7;
        for (let i = 0; i < cols; i++) {
          const x = ((i + 0.5) / cols) * this.state.width;
          this.fireEnemy(x, 6, 0, sp * 0.95, 0xff45e0);
        }
        this.audio.bossAttack();
      }
    }
  }

  private bossDefeated() {
    const s = this.state;
    const b = s.boss;
    if (!b) return;
    b.hp = 0;
    b.dying = 1500;
    s.score += BOSS[b.kind].points;
    s.shake = FX.shakeMs;
    this.audio.ufoHit();
    this.audio.explosion();
    this.burst(b.x, b.y, 44, 0xffa23d, 290);
    const drops = b.kind === "octopus" ? 4 : 2;
    for (let i = 0; i < drops; i++) {
      this.spawnLoot(b.x + rand(-50, 50), b.y + rand(-20, 20), this.randomWeaponLoot());
    }
    this.spawnLoot(b.x, b.y + 12, "life"); // bosses always drop an extra life
    s.toast = { text: `${b.name} DESTROYED!`, ttl: 2400 };
  }

  private spawnLoot(x: number, y: number, type: LootType) {
    this.state.loot.push({ active: true, x, y, vy: LOOT.fallSpeed, type, spin: 0 });
  }

  private updateLoot(dt: number) {
    const s = this.state;
    for (const l of s.loot) {
      if (!l.active) continue;
      l.y += l.vy * dt;
      l.spin += LOOT.spinRate * dt;
      if (l.y > s.height + 30) l.active = false;
    }
    s.loot = s.loot.filter((l) => l.active);
  }

  private collideBulletsWithShields() {
    const s = this.state;
    if (s.pins.length === 0) return;
    const all = [...s.playerBullets, ...s.enemyBullets];
    for (const b of all) {
      if (!b.active) continue;
      for (let i = 0; i < s.pins.length; i++) {
        if (s.shieldHp[i]! <= 0) continue;
        const pin = s.pins[i]!;
        if (pointInCircle(b.x, b.y, pin.x, pin.y, pin.radius)) {
          b.active = false;
          s.shieldFlash[i] = SHIELD.flashMs;
          // Both player and enemy fire chip the shield. Once it blows it stays
          // gone for the run (no recharge) and showers asteroid debris.
          s.shieldHp[i] = Math.max(0, s.shieldHp[i]! - 1);
          if (s.shieldHp[i] === 0) {
            this.explodeShield(pin.x, pin.y);
          } else {
            this.burst(b.x, b.y, 7, b.from === "player" ? 0xf4dfb4 : 0xff8a3d, 120);
            this.audio.shieldHit();
          }
          break;
        }
      }
    }
  }

  private collidePlayerBullets() {
    const s = this.state;
    for (const b of s.playerBullets) {
      if (!b.active) continue;

      if (s.ufo.active && rectsOverlap(b.x, b.y, 4, 12, s.ufo.x, s.ufo.y, UFO.width, UFO.height)) {
        b.active = false;
        s.ufo.active = false;
        s.score += s.ufo.points;
        this.audio.ufoHit();
        this.burst(s.ufo.x, s.ufo.y, 28, 0x35e0ff, 220);
        this.spawnLoot(s.ufo.x, s.ufo.y, this.randomWeaponLoot());
        continue;
      }

      const boss = s.boss;
      if (
        boss &&
        boss.active &&
        boss.dying <= 0 &&
        rectsOverlap(b.x, b.y, 4, 12, boss.x, boss.y, boss.width * 0.78, boss.height * 0.7)
      ) {
        boss.hp -= 1;
        boss.hitFlash = 90;
        this.burst(b.x, b.y, 6, 0xffffff, 130);
        if (boss.hp <= 0) this.bossDefeated();
        if (!b.pierce) {
          b.active = false;
          continue;
        }
      }

      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        if (rectsOverlap(b.x, b.y, 4, 12, inv.x, inv.y, inv.w, inv.h)) {
          inv.hp -= 1;
          if (inv.hp <= 0) {
            inv.alive = false;
            inv.dying = FX.invaderDeathMs;
            s.score += inv.points;
            this.audio.explosion();
            this.burst(inv.x, inv.y, 18, inv.type === 2 ? 0xffa23d : 0xd6b06a, 190);
            if (Math.random() < LOOT.lifeChance) this.spawnLoot(inv.x, inv.y, "life");
            else if (Math.random() < LOOT.dropChance) this.spawnLoot(inv.x, inv.y, this.randomWeaponLoot());
          } else {
            this.burst(b.x, b.y, 4, 0xffffff, 90);
          }
          if (!b.pierce) {
            b.active = false;
            break;
          }
        }
      }
    }
  }

  private collideEnemyBulletsWithPlayer() {
    const s = this.state;
    if (s.player.invuln > 0) return;
    for (const b of s.enemyBullets) {
      if (!b.active) continue;
      if (rectsOverlap(b.x, b.y, 4, 12, s.player.x, s.player.y, PLAYER.width, PLAYER.height)) {
        b.active = false;
        this.loseLife();
        return;
      }
    }
  }

  private collideLootWithPlayer() {
    const s = this.state;
    for (const l of s.loot) {
      if (!l.active) continue;
      if (rectsOverlap(l.x, l.y, LOOT.size, LOOT.size, s.player.x, s.player.y, PLAYER.width, PLAYER.height)) {
        l.active = false;
        this.applyLoot(l.type);
        this.audio.pickup();
      }
    }
  }

  private applyLoot(type: LootType) {
    const s = this.state;
    if (type === "overdrive") {
      s.player.overdriveMs = PLAYER.overdriveMs;
      s.toast = { text: "OVERDRIVE!", ttl: 1600 };
      this.audio.overdrive();
    } else if (type === "life") {
      this.awardLife("+1 LIFE");
    } else {
      s.player.weapon = type;
      s.toast = { text: WEAPONS[type].name.toUpperCase(), ttl: 1600 };
    }
  }

  private awardLife(text: string) {
    const s = this.state;
    if (s.lives >= PLAYER.maxLives) {
      s.score += 500; // already maxed — small bonus instead
      return;
    }
    s.lives += 1;
    s.toast = { text, ttl: 1700 };
    this.audio.pickup();
  }

  private randomWeaponLoot(): LootType {
    return LOOT.weaponTypes[Math.floor(Math.random() * LOOT.weaponTypes.length)]!;
  }

  private checkInvaderDescent() {
    const s = this.state;
    const line = s.player.y - PLAYER.height;
    for (const inv of s.invaders) {
      if (!inv.alive) continue;
      if (inv.y + inv.h / 2 >= line) {
        s.lives = 0;
        this.loseLife();
        return;
      }
    }
  }

  private loseLife() {
    const s = this.state;
    s.lives = Math.max(0, s.lives - 1);
    s.shake = FX.shakeMs;
    s.player.overdriveMs = 0;
    this.audio.playerDeath();
    this.burst(s.player.x, s.player.y, 32, 0xff5a6e, 250);
    s.enemyBullets = [];
    if (s.lives <= 0) this.setPhase("over");
    else {
      s.phaseTimer = FX.dyingMs;
      this.setPhase("dying");
    }
  }

  private burst(x: number, y: number, count: number, hex: number, speed: number) {
    const s = this.state;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = rand(0.3, 1) * speed;
      const life = rand(280, 620);
      s.particles.push({
        x,
        y,
        z: rand(-8, 8),
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        vz: rand(-60, 60),
        life,
        maxLife: life,
        hex,
        size: rand(2, 5),
      });
    }
  }

  /** Asteroid-style blast: lots of chunky debris flying everywhere, permanent. */
  private explodeShield(x: number, y: number) {
    const s = this.state;
    this.audio.shieldBreak();
    s.shake = Math.max(s.shake, 200);
    const palette = [0xd6b06a, 0xf4dfb4, 0xffa23d, 0xffffff, 0x9a6b3a];
    for (let i = 0; i < 64; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = rand(0.35, 1) * rand(150, 440);
      const big = Math.random() < 0.32;
      const life = rand(520, 1150);
      s.particles.push({
        x: x + rand(-6, 6),
        y: y + rand(-6, 6),
        z: rand(-12, 12),
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - rand(0, 60),
        vz: rand(-160, 160),
        life,
        maxLife: life,
        hex: palette[Math.floor(Math.random() * palette.length)]!,
        size: big ? rand(4.5, 9) : rand(1.5, 4),
      });
    }
  }

  private updateParticles(stepMs: number) {
    const s = this.state;
    const dt = stepMs / 1000;
    const next = [];
    for (const p of s.particles) {
      p.life -= stepMs;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy += 50 * dt; // light drift (spacey — debris keeps flying)
      next.push(p);
    }
    s.particles = next;
  }

  // Shields no longer recharge — a destroyed planet stays gone until a fresh run.
  private updateShields(stepMs: number) {
    const s = this.state;
    for (let i = 0; i < s.shieldFlash.length; i++) {
      if (s.shieldFlash[i]! > 0) s.shieldFlash[i] = Math.max(0, s.shieldFlash[i]! - stepMs);
    }
  }
}
