/**
 * Missile Command–style defense for Penn Liberty Arcade.
 * Aim with mouse / arrows · fire ABMs · protect cities · survive waves.
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

const HS_KEY = "pl-arcade-missile-hs";
const TITLE = "MISSILE CMD";
const CITY_COUNT = 6;
const MAX_ABM = 3;

type Incoming = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t: number;
  speed: number;
  alive: boolean;
};
type Abm = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t: number;
  speed: number;
  alive: boolean;
};
type Blast = { x: number; y: number; r: number; maxR: number; growing: boolean };

export function createGame(opts: CreateClassicOpts): ClassicController {
  const { canvas, onPhaseChange, onHud } = opts;
  const audio = new BeepAudio();
  audio.resume();

  let muted = false;
  let phase: Phase = "ready";
  let score = 0;
  let highScore = loadHs(HS_KEY);
  let w = 320;
  let h = 240;
  let wave = 1;
  let cities: boolean[] = Array(CITY_COUNT).fill(true);
  let batteryAmmo = 30;
  let incoming: Incoming[] = [];
  let abms: Abm[] = [];
  let blasts: Blast[] = [];
  let spawnTimer = 0;
  let waveClearTimer = 0;
  let spawnedThisWave = 0;
  let waveBudget = 6;
  let crossX = 160;
  let crossY = 120;
  let fireWas = false;
  let pauseWas = false;
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    pause: false,
  };

  const groundY = () => h - 28;
  const batteryX = () => w / 2;

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: `W${wave} · ABM ${batteryAmmo}`,
  });

  const setPhase = (p: Phase) => {
    phase = p;
    onPhaseChange?.(p, hud());
  };

  const emitHud = () => onHud?.(hud());

  const maybeHs = () => {
    if (score > highScore) {
      highScore = score;
      saveHs(HS_KEY, highScore);
    }
  };

  const cityPositions = () => {
    const gy = groundY();
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < CITY_COUNT; i++) {
      const t = (i + 0.5) / CITY_COUNT;
      pts.push({ x: 20 + t * (w - 40), y: gy });
    }
    return pts;
  };

  const pointOn = (a: Incoming | Abm) => ({
    x: a.x0 + (a.x1 - a.x0) * a.t,
    y: a.y0 + (a.y1 - a.y0) * a.t,
  });

  const addBlast = (x: number, y: number, maxR: number) => {
    blasts.push({ x, y, r: 4, maxR, growing: true });
    audio.hit(140);
  };

  const launchAbm = (tx: number, ty: number) => {
    if (batteryAmmo <= 0 || abms.filter((a) => a.alive).length >= MAX_ABM) return;
    const bx = batteryX();
    const by = groundY() - 8;
    const dist = Math.hypot(tx - bx, ty - by) || 1;
    batteryAmmo -= 1;
    abms.push({
      x0: bx,
      y0: by,
      x1: tx,
      y1: Math.min(ty, groundY() - 20),
      t: 0,
      speed: Math.min(2.2, 280 / dist),
      alive: true,
    });
    audio.blip(660);
    emitHud();
  };

  const destroyCityNear = (x: number) => {
    const pts = cityPositions();
    for (let i = 0; i < pts.length; i++) {
      if (!cities[i]) continue;
      if (Math.abs(pts[i]!.x - x) < 28) {
        cities[i] = false;
        audio.die();
        addBlast(pts[i]!.x, pts[i]!.y - 6, 22);
      }
    }
    emitHud();
    if (!cities.some(Boolean)) {
      maybeHs();
      setPhase("over");
    }
  };

  const resetWave = (nextWave: number) => {
    wave = nextWave;
    batteryAmmo = Math.max(16, 34 - nextWave * 2);
    incoming = [];
    abms = [];
    blasts = [];
    spawnTimer = 500;
    waveClearTimer = 0;
    spawnedThisWave = 0;
    waveBudget = 5 + nextWave * 2;
    emitHud();
  };

  const softReset = () => {
    score = 0;
    cities = Array(CITY_COUNT).fill(true);
    resetWave(1);
    crossX = w / 2;
    crossY = h * 0.4;
    emitHud();
  };

  softReset();

  const tick = (dt: number) => {
    if (keys.pause && !pauseWas) {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    }
    pauseWas = keys.pause;

    if (phase === "ready" || phase === "over") {
      if (keys.fire && !fireWas) {
        softReset();
        setPhase("playing");
      }
      fireWas = keys.fire;
      return;
    }
    if (phase !== "playing") {
      fireWas = keys.fire;
      return;
    }

    const sp = 200 * (dt / 1000);
    if (keys.left) crossX -= sp;
    if (keys.right) crossX += sp;
    if (keys.up) crossY -= sp;
    if (keys.down) crossY += sp;
    crossX = clamp(crossX, 8, w - 8);
    crossY = clamp(crossY, 44, groundY() - 16);

    if (keys.fire && !fireWas) launchAbm(crossX, crossY);
    fireWas = keys.fire;

    if (spawnedThisWave < waveBudget) {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && incoming.filter((m) => m.alive).length < 5) {
        const targets = cityPositions()
          .map((p, i) => ({ p, i }))
          .filter(({ i }) => cities[i]);
        if (targets.length) {
          const pick = targets[Math.floor(Math.random() * targets.length)]!;
          incoming.push({
            x0: rand(12, w - 12),
            y0: 42,
            x1: pick.p.x + rand(-10, 10),
            y1: groundY(),
            t: 0,
            speed: 0.11 + wave * 0.014 + rand(0, 0.04),
            alive: true,
          });
          spawnedThisWave += 1;
          spawnTimer = Math.max(320, 1150 - wave * 70);
        }
      }
    }

    for (const m of incoming) {
      if (!m.alive) continue;
      m.t += m.speed * (dt / 1000);
      const p = pointOn(m);
      for (const b of blasts) {
        if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 2) {
          m.alive = false;
          score += 25 * wave;
          audio.score();
          maybeHs();
          emitHud();
          break;
        }
      }
      if (m.alive && m.t >= 1) {
        m.alive = false;
        destroyCityNear(m.x1);
      }
    }

    for (const a of abms) {
      if (!a.alive) continue;
      a.t += a.speed * (dt / 1000);
      if (a.t >= 1) {
        a.alive = false;
        const p = pointOn(a);
        addBlast(p.x, p.y, 26 + Math.min(12, wave));
      }
    }

    for (const b of blasts) {
      if (b.growing) {
        b.r += 60 * (dt / 1000);
        if (b.r >= b.maxR) b.growing = false;
      } else {
        b.r -= 45 * (dt / 1000);
      }
    }
    blasts = blasts.filter((b) => b.r > 1.5);

    if (
      spawnedThisWave >= waveBudget &&
      !incoming.some((m) => m.alive) &&
      !abms.some((a) => a.alive) &&
      phase === "playing"
    ) {
      waveClearTimer += dt;
      if (waveClearTimer > 700) {
        score += cities.filter(Boolean).length * 100 + batteryAmmo * 5;
        maybeHs();
        audio.win();
        resetWave(wave + 1);
      }
    }
  };

  const paint = (ctx: CanvasRenderingContext2D, now: number) => {
    drawCrtPlate(ctx, w, h);
    drawHudBar(ctx, TITLE, score, highScore, w, `W${wave} ABM${batteryAmmo}`);

    const gy = groundY();
    ctx.fillStyle = "#1a3d28";
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = "#33ff66";
    ctx.fillRect(0, gy, w, 2);

    const bx = batteryX();
    ctx.fillStyle = "#5ec8ff";
    ctx.beginPath();
    ctx.moveTo(bx, gy - 14);
    ctx.lineTo(bx - 10, gy);
    ctx.lineTo(bx + 10, gy);
    ctx.closePath();
    ctx.fill();

    const pts = cityPositions();
    for (let i = 0; i < pts.length; i++) {
      if (!cities[i]) continue;
      const c = pts[i]!;
      ctx.fillStyle = "#f4dfb4";
      ctx.fillRect(c.x - 10, c.y - 14, 20, 14);
      ctx.fillStyle = "#33ff66";
      ctx.fillRect(c.x - 6, c.y - 20, 5, 6);
      ctx.fillRect(c.x + 2, c.y - 18, 4, 4);
    }

    for (const m of incoming) {
      if (!m.alive) continue;
      const p = pointOn(m);
      ctx.strokeStyle = "#ff6688";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(m.x0, m.y0);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.fillStyle = "#ffccdd";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const a of abms) {
      if (!a.alive) continue;
      const p = pointOn(a);
      ctx.strokeStyle = "#5ec8ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x0, a.y0);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    for (const b of blasts) {
      ctx.strokeStyle = `rgba(255,220,120,${clamp(b.r / b.maxR, 0.2, 0.9)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(1, b.r), 0, Math.PI * 2);
      ctx.stroke();
    }

    if (phase === "playing" || phase === "ready") {
      const pulse = 6 + Math.sin(now / 120) * 1.5;
      ctx.strokeStyle = "#33ff66";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(crossX - pulse, crossY);
      ctx.lineTo(crossX + pulse, crossY);
      ctx.moveTo(crossX, crossY - pulse);
      ctx.lineTo(crossX, crossY + pulse);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(crossX, crossY, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (phase === "ready") {
      drawCenterText(
        ctx,
        ["MISSILE COMMAND", "MOUSE / ARROWS AIM", "CLICK OR SPACE FIRE"],
        w,
        h,
      );
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED"], w, h);
    } else if (phase === "over") {
      drawCenterText(ctx, ["CITIES LOST", `SCORE ${score}`, "SPACE RETRY"], w, h, "#ff6688");
    }
  };

  const loop = bootLoop(
    canvas,
    tick,
    paint,
    (nw, nh) => {
      w = nw;
      h = nh;
      crossX = clamp(crossX, 8, w - 8);
      crossY = clamp(crossY, 44, groundY() - 16);
    },
  );

  return {
    setKey: (action, down) => {
      if (action === "left") keys.left = down;
      else if (action === "right") keys.right = down;
      else if (action === "up") keys.up = down;
      else if (action === "down") keys.down = down;
      else if (action === "fire") keys.fire = down;
      else if (action === "pause") keys.pause = down;
    },
    pointer: (kind, x, y) => {
      crossX = clamp(x, 8, w - 8);
      crossY = clamp(y, 44, groundY() - 16);
      if (kind !== "down") return;
      if (phase === "ready" || phase === "over") {
        softReset();
        setPhase("playing");
        return;
      }
      if (phase === "playing") launchAbm(crossX, crossY);
    },
    togglePause: () => {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    },
    toggleMute: () => {
      muted = !muted;
      audio.setMuted(muted);
      return muted;
    },
    restart: () => {
      softReset();
      setPhase("ready");
    },
    unlockAudio: () => audio.resume(),
    dispose: () => {
      loop.dispose();
      audio.dispose();
    },
  };
}
