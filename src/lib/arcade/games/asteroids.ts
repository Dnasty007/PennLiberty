/**
 * Classic Asteroids for Penn Liberty Rentals arcade.
 * Rotate · thrust · shoot · screen wrap · rock splits · 3 lives.
 */
import {
  BeepAudio,
  bootLoop,
  clamp,
  drawCenterText,
  drawCrtPlate,
  drawHudBar,
  loadHs,
  rand,
  saveHs,
  type ClassicController,
  type CreateClassicOpts,
  type HudInfo,
  type Phase,
} from "@/lib/arcade/shared";

const HS_KEY = "pl-arcade-asteroids-hs";
const MAX_BULLETS = 6;
const BULLET_LIFE = 0.9;
const THRUST = 180;
const TURN = 3.6;
const FRICTION = 0.992;
const SHIP_R = 10;
const INVULN = 2.2;

type Vec = { x: number; y: number };
type Bullet = { x: number; y: number; vx: number; vy: number; life: number };
type Rock = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  spin: number;
  verts: number[];
  size: 0 | 1 | 2; // large med small
};

function rockVerts(n: number): number[] {
  const v: number[] = [];
  for (let i = 0; i < n; i++) v.push(rand(0.65, 1));
  return v;
}

function makeRock(x: number, y: number, size: 0 | 1 | 2, speedMul = 1): Rock {
  const r = size === 0 ? 36 : size === 1 ? 20 : 11;
  const sp = (size === 0 ? rand(28, 48) : size === 1 ? rand(40, 70) : rand(55, 95)) * speedMul;
  const a = rand(0, Math.PI * 2);
  return {
    x,
    y,
    vx: Math.cos(a) * sp,
    vy: Math.sin(a) * sp,
    r,
    rot: rand(0, Math.PI * 2),
    spin: rand(-1.4, 1.4),
    verts: rockVerts(size === 2 ? 6 : 8),
    size,
  };
}

function wrap(v: number, max: number, pad: number) {
  if (v < -pad) return max + pad;
  if (v > max + pad) return -pad;
  return v;
}

function dist2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function createGame(opts: CreateClassicOpts): ClassicController {
  const { canvas, onPhaseChange, onHud } = opts;
  const audio = new BeepAudio();
  audio.resume();

  let phase: Phase = "ready";
  let score = 0;
  let highScore = loadHs(HS_KEY);
  let lives = 3;
  let muted = false;
  let level = 1;
  let invuln = 0;
  let flash = 0;
  let thrustPulse = 0;

  const keys = {
    left: false,
    right: false,
    up: false,
    fire: false,
  };
  let fireLatch = false;

  let W = 320;
  let H = 240;
  const ship: Vec & { angle: number; vx: number; vy: number } = {
    x: 160,
    y: 120,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
  };
  let bullets: Bullet[] = [];
  let rocks: Rock[] = [];

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: `L${level} · ♥${lives}`,
  });

  const emitPhase = () => onPhaseChange?.(phase, hud());
  const emitHud = () => onHud?.(hud());

  const commitScore = () => {
    if (score > highScore) {
      highScore = score;
      saveHs(HS_KEY, highScore);
    }
    emitHud();
  };

  const resetShip = () => {
    ship.x = W / 2;
    ship.y = H / 2;
    ship.vx = 0;
    ship.vy = 0;
    ship.angle = -Math.PI / 2;
    invuln = INVULN;
    bullets = [];
  };

  const spawnWave = (n: number) => {
    rocks = [];
    for (let i = 0; i < n; i++) {
      let x = 0;
      let y = 0;
      let tries = 0;
      do {
        x = rand(0, W);
        y = rand(0, H);
        tries++;
      } while (dist2(x, y, ship.x, ship.y) < 140 * 140 && tries < 40);
      rocks.push(makeRock(x, y, 0, 1 + (level - 1) * 0.08));
    }
  };

  const startPlay = () => {
    score = 0;
    lives = 3;
    level = 1;
    phase = "playing";
    resetShip();
    spawnWave(3);
    fireLatch = false;
    emitPhase();
    emitHud();
    audio.blip(660);
  };

  const killShip = () => {
    audio.die();
    lives -= 1;
    flash = 0.35;
    if (lives <= 0) {
      phase = "over";
      commitScore();
      emitPhase();
      return;
    }
    resetShip();
    emitHud();
  };

  const splitRock = (r: Rock, i: number) => {
    rocks.splice(i, 1);
    const pts = r.size === 0 ? 20 : r.size === 1 ? 50 : 100;
    score += pts;
    commitScore();
    audio.hit(180 + r.size * 60);
    if (r.size < 2) {
      const next = (r.size + 1) as 1 | 2;
      rocks.push(makeRock(r.x, r.y, next, 1 + (level - 1) * 0.08));
      rocks.push(makeRock(r.x, r.y, next, 1 + (level - 1) * 0.08));
    }
    if (rocks.length === 0) {
      level += 1;
      audio.win();
      spawnWave(Math.min(3 + level, 8));
      invuln = Math.max(invuln, 1.2);
      emitHud();
    }
  };

  const shoot = () => {
    if (bullets.length >= MAX_BULLETS) return;
    const sp = 320;
    bullets.push({
      x: ship.x + Math.cos(ship.angle) * (SHIP_R + 2),
      y: ship.y + Math.sin(ship.angle) * (SHIP_R + 2),
      vx: Math.cos(ship.angle) * sp + ship.vx,
      vy: Math.sin(ship.angle) * sp + ship.vy,
      life: BULLET_LIFE,
    });
    audio.blip(880);
  };

  const tick = (dtMs: number) => {
    const dt = dtMs / 1000;
    if (phase !== "playing") return;

    if (invuln > 0) invuln -= dt;
    if (flash > 0) flash -= dt;

    if (keys.left) ship.angle -= TURN * dt;
    if (keys.right) ship.angle += TURN * dt;
    if (keys.up) {
      ship.vx += Math.cos(ship.angle) * THRUST * dt;
      ship.vy += Math.sin(ship.angle) * THRUST * dt;
      thrustPulse += dt;
      if (thrustPulse > 0.08) {
        thrustPulse = 0;
        audio.tone("sawtooth", 90, 70, 0.04, 0.12);
      }
    }
    if (keys.fire) {
      if (!fireLatch) {
        fireLatch = true;
        shoot();
      }
    } else {
      fireLatch = false;
    }

    const spd = Math.hypot(ship.vx, ship.vy);
    const maxSpd = 260;
    if (spd > maxSpd) {
      ship.vx = (ship.vx / spd) * maxSpd;
      ship.vy = (ship.vy / spd) * maxSpd;
    }
    ship.vx *= FRICTION;
    ship.vy *= FRICTION;
    ship.x = wrap(ship.x + ship.vx * dt, W, SHIP_R);
    ship.y = wrap(ship.y + ship.vy * dt, H, SHIP_R);

    for (const b of bullets) {
      b.x = wrap(b.x + b.vx * dt, W, 2);
      b.y = wrap(b.y + b.vy * dt, H, 2);
      b.life -= dt;
    }
    bullets = bullets.filter((b) => b.life > 0);

    for (const r of rocks) {
      r.x = wrap(r.x + r.vx * dt, W, r.r);
      r.y = wrap(r.y + r.vy * dt, H, r.r);
      r.rot += r.spin * dt;
    }

    // bullet vs rock
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      for (let ri = rocks.length - 1; ri >= 0; ri--) {
        const r = rocks[ri];
        if (dist2(b.x, b.y, r.x, r.y) < r.r * r.r) {
          bullets.splice(bi, 1);
          splitRock(r, ri);
          break;
        }
      }
    }

    // ship vs rock
    if (invuln <= 0) {
      for (const r of rocks) {
        if (dist2(ship.x, ship.y, r.x, r.y) < (r.r + SHIP_R * 0.7) ** 2) {
          killShip();
          break;
        }
      }
    }
  };

  const paint = (ctx: CanvasRenderingContext2D, now: number) => {
    drawCrtPlate(ctx, W, H);

    // stars
    ctx.fillStyle = "rgba(180,255,200,0.35)";
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 97 + 13) % Math.max(1, W - 4)) + 2;
      const sy = ((i * 53 + 29) % Math.max(1, H - 4)) + 2;
      ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }

    const drawRock = (r: Rock) => {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.beginPath();
      const n = r.verts.length;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = r.r * r.verts[i];
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = "#9dffb0";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    for (const r of rocks) drawRock(r);

    // bullets
    ctx.fillStyle = "#fff8c8";
    for (const b of bullets) {
      ctx.fillRect(b.x - 1.5, b.y - 1.5, 3, 3);
    }

    // ship
    if (phase === "playing" || phase === "paused" || phase === "ready") {
      const blink = invuln > 0 && Math.floor(now / 80) % 2 === 0;
      if (!blink || phase === "ready") {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle);
        ctx.strokeStyle = flash > 0 ? "#ff6666" : "#33ff66";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(SHIP_R, 0);
        ctx.lineTo(-SHIP_R * 0.75, SHIP_R * 0.7);
        ctx.lineTo(-SHIP_R * 0.4, 0);
        ctx.lineTo(-SHIP_R * 0.75, -SHIP_R * 0.7);
        ctx.closePath();
        ctx.stroke();
        if (keys.up && phase === "playing") {
          const flick = 0.6 + Math.sin(now * 0.04) * 0.4;
          ctx.strokeStyle = "#f4dfb4";
          ctx.beginPath();
          ctx.moveTo(-SHIP_R * 0.4, 0);
          ctx.lineTo(-SHIP_R * (1.1 + flick * 0.4), 0);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    drawHudBar(ctx, "ASTEROIDS", score, highScore, W, `L${level}  ♥${lives}`);

    if (phase === "ready") {
      drawCenterText(
        ctx,
        ["ASTEROIDS", "← → ROTATE · ↑ THRUST · SPACE FIRE", "PRESS SPACE TO START"],
        W,
        H,
      );
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED", "P OR ESC TO RESUME"], W, H, "#f4dfb4");
    } else if (phase === "over") {
      drawCenterText(
        ctx,
        ["GAME OVER", `SCORE ${String(score).padStart(5, "0")}`, "SPACE TO RESTART"],
        W,
        H,
        "#ff8888",
      );
    }
  };

  const loop = bootLoop(
    canvas,
    tick,
    paint,
    (w, h) => {
      const ox = ship.x / Math.max(1, W);
      const oy = ship.y / Math.max(1, H);
      W = w;
      H = h;
      if (phase === "ready") {
        ship.x = W / 2;
        ship.y = H / 2;
      } else {
        ship.x = clamp(ox * W, 0, W);
        ship.y = clamp(oy * H, 0, H);
      }
    },
  );

  emitPhase();
  emitHud();

  return {
    setKey: (action, down) => {
      if (action === "left") keys.left = down;
      else if (action === "right") keys.right = down;
      else if (action === "up") keys.up = down;
      else if (action === "fire") {
        keys.fire = down;
        if (down && (phase === "ready" || phase === "over")) startPlay();
      } else if (action === "pause" && down) {
        if (phase === "playing") {
          phase = "paused";
          emitPhase();
        } else if (phase === "paused") {
          phase = "playing";
          emitPhase();
        }
      }
    },
    togglePause: () => {
      if (phase === "playing") {
        phase = "paused";
        emitPhase();
      } else if (phase === "paused") {
        phase = "playing";
        emitPhase();
      }
    },
    toggleMute: () => {
      muted = !muted;
      audio.setMuted(muted);
      return muted;
    },
    restart: () => startPlay(),
    unlockAudio: () => audio.resume(),
    dispose: () => {
      loop.dispose();
      audio.dispose();
    },
  };
}
