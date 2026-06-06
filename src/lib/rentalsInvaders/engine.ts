/** Fixed-timestep simulation + phase state machine. React mounts a canvas and
 *  calls update()/render() each frame; the engine owns all game state. */
import { GameAudio } from "./audio";
import {
  bulletHitsInvader,
  bulletHitsPin,
  rectsOverlap,
} from "./collision";
import { FX, GRID, HIGH_SCORE_KEY, PLAYER, STEP_MS, UFO } from "./constants";
import {
  aliveInvaders,
  createInitialState,
  layoutPlayer,
  marchInvaders,
  maybeEnemyFire,
  moveBullets,
  movePlayer,
  spawnParticles,
  spawnWave,
  tryFirePlayer,
  updateParticles,
  updateUfo,
} from "./entities";
import type { GameState, Phase, PinObstacle } from "./types";

export type KeyAction = "left" | "right" | "fire" | "pause";

export type EngineCallbacks = {
  onPhaseChange?: (phase: Phase, state: GameState) => void;
};

export function loadHighScore(): number {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    /* private mode — ignore */
  }
}

export class InvadersEngine {
  state: GameState;
  private audio: GameAudio;
  private cb: EngineCallbacks;
  private accumulator = 0;
  private readonly maxFrame = 250; // clamp huge dt after tab-away

  constructor(
    width: number,
    height: number,
    audio: GameAudio,
    cb: EngineCallbacks = {},
  ) {
    this.audio = audio;
    this.cb = cb;
    this.state = createInitialState(width, height, loadHighScore());
    this.state.phaseTimer = 6000; // ready auto-start fallback
  }

  getState(): GameState {
    return this.state;
  }

  setPins(pins: PinObstacle[]) {
    this.state.pins = pins;
  }

  setKey(action: KeyAction, down: boolean) {
    const s = this.state;
    if (action === "pause") {
      if (down) this.togglePause();
      return;
    }
    s.keys[action] = down;
  }

  togglePause() {
    if (this.state.phase === "playing") this.setPhase("paused");
    else if (this.state.phase === "paused") this.setPhase("playing");
  }

  restart() {
    const { width, height } = this.state;
    this.state = createInitialState(width, height, loadHighScore());
    this.state.phaseTimer = 6000;
    this.accumulator = 0;
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
    s.player.x *= sx;
    s.ufo.x *= sx;
    s.width = width;
    s.height = height;
    layoutPlayer(s);
  }

  update(realDtMs: number) {
    this.accumulator += Math.min(realDtMs, this.maxFrame);
    while (this.accumulator >= STEP_MS) {
      this.tick(STEP_MS);
      this.accumulator -= STEP_MS;
    }
  }

  private setPhase(phase: Phase) {
    if (this.state.phase === phase) return;
    this.state.phase = phase;
    if (phase === "over" && this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      saveHighScore(this.state.highScore);
    }
    if (phase === "over") this.audio.gameOver();
    this.cb.onPhaseChange?.(phase, this.state);
  }

  private tick(stepMs: number) {
    const s = this.state;
    updateParticles(s, stepMs);
    if (s.shake > 0) s.shake = Math.max(0, s.shake - stepMs);

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
          layoutPlayer(s);
          s.player.x = s.width / 2;
          s.player.invuln = PLAYER.respawnInvulnMs;
          this.setPhase("playing");
        }
        break;

      case "wave-clear":
        s.phaseTimer -= stepMs;
        if (s.phaseTimer <= 0) {
          s.wave += 1;
          spawnWave(s);
          layoutPlayer(s);
          s.player.x = s.width / 2;
          s.phaseTimer = 6000;
          this.setPhase("ready");
        }
        break;

      case "paused":
      case "over":
        break;
    }
  }

  private tickPlaying(stepMs: number) {
    const s = this.state;

    movePlayer(s, stepMs);
    if (s.keys.fire && tryFirePlayer(s)) this.audio.shoot();
    moveBullets(s, stepMs);

    if (marchInvaders(s, stepMs)) this.audio.step(s.stepFrame);
    maybeEnemyFire(s, stepMs);
    if (updateUfo(s, stepMs) === "spawn") this.audio.ufo();

    this.collideBulletsWithPins();
    this.collidePlayerBulletsWithTargets();
    this.collideEnemyBulletsWithPlayer();
    this.checkInvaderDescent();

    if (aliveInvaders(s).length === 0 && s.phase === "playing") {
      s.phaseTimer = FX.waveClearMs;
      this.setPhase("wave-clear");
    }
  }

  private collideBulletsWithPins() {
    const s = this.state;
    if (s.pins.length === 0) return;
    for (const b of [...s.playerBullets, ...s.enemyBullets]) {
      if (!b.active) continue;
      for (const pin of s.pins) {
        if (bulletHitsPin(b, pin)) {
          b.active = false;
          spawnParticles(s, b.x, b.y, 4, "#f4dfb4", 1.8);
          break;
        }
      }
    }
  }

  private collidePlayerBulletsWithTargets() {
    const s = this.state;
    for (const b of s.playerBullets) {
      if (!b.active) continue;

      if (
        s.ufo.active &&
        rectsOverlap(b.x, b.y, 2, 8, s.ufo.x, s.ufo.y, UFO.width, UFO.height)
      ) {
        b.active = false;
        s.ufo.active = false;
        s.score += s.ufo.points;
        this.audio.ufoHit();
        spawnParticles(s, s.ufo.x, s.ufo.y, 12, "#5ec8ff", 3);
        continue;
      }

      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        if (bulletHitsInvader(b, inv, GRID.invaderWidth, GRID.invaderHeight)) {
          b.active = false;
          inv.alive = false;
          inv.dying = FX.invaderDeathMs;
          s.score += inv.points;
          this.audio.explosion();
          spawnParticles(s, inv.x, inv.y, 10, "#d6b06a", 2.6);
          break;
        }
      }
    }
  }

  private collideEnemyBulletsWithPlayer() {
    const s = this.state;
    if (s.player.invuln > 0) return;
    for (const b of s.enemyBullets) {
      if (!b.active) continue;
      if (
        rectsOverlap(b.x, b.y, 3, 10, s.player.x, s.player.y, PLAYER.width, PLAYER.height)
      ) {
        b.active = false;
        this.loseLife();
        return;
      }
    }
  }

  private checkInvaderDescent() {
    const s = this.state;
    const line = s.player.y - PLAYER.height;
    for (const inv of s.invaders) {
      if (!inv.alive) continue;
      if (inv.y + GRID.invaderHeight / 2 >= line) {
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
    this.audio.playerDeath();
    spawnParticles(s, s.player.x, s.player.y, 16, "#ff6f6f", 3.2);
    for (const b of s.enemyBullets) b.active = false;
    for (const b of s.playerBullets) b.active = false;

    if (s.lives <= 0) {
      this.setPhase("over");
    } else {
      s.phaseTimer = FX.dyingMs;
      this.setPhase("dying");
    }
  }
}
