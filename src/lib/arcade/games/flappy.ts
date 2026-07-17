/**
 * SKY HOP — Flappy-style bird for Penn Liberty Rentals arcade.
 * Flap · gravity · pipe gaps · score per pipe · original name/art.
 */
import {
  BeepAudio,
  bootLoop,
  clamp,
  drawCenterText,
  drawHudBar,
  loadHs,
  rand,
  saveHs,
  type ClassicController,
  type CreateClassicOpts,
  type HudInfo,
  type Phase,
} from "@/lib/arcade/shared";

const HS_KEY = "pl-arcade-flappy-hs";
const GRAVITY = 980;
const FLAP_V = -320;
const PIPE_W = 48;
const PIPE_GAP = 118;
const PIPE_SPEED = 140;
const PIPE_SPACING = 210;
const BIRD_R = 12;
const GROUND_H = 36;

type Pipe = {
  x: number;
  gapY: number; // center of gap
  passed: boolean;
};

export function createGame(opts: CreateClassicOpts): ClassicController {
  const { canvas, onPhaseChange, onHud } = opts;
  const audio = new BeepAudio();
  audio.resume();

  let phase: Phase = "ready";
  let score = 0;
  let highScore = loadHs(HS_KEY);
  let muted = false;
  let flash = 0;
  let wing = 0;

  let W = 320;
  let H = 240;
  let birdX = 80;
  let birdY = 120;
  let birdVy = 0;
  let pipes: Pipe[] = [];
  let scroll = 0;
  let readyBob = 0;

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: "SKY HOP",
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

  const gapRange = () => {
    const top = 70;
    const bot = H - GROUND_H - 70;
    return { top, bot };
  };

  const makePipe = (x: number): Pipe => {
    const { top, bot } = gapRange();
    const margin = PIPE_GAP / 2 + 8;
    return {
      x,
      gapY: rand(top + margin, Math.max(top + margin + 1, bot - margin)),
      passed: false,
    };
  };

  const resetWorld = () => {
    birdX = Math.min(96, W * 0.28);
    birdY = H * 0.42;
    birdVy = 0;
    pipes = [];
    const startX = W + 40;
    for (let i = 0; i < 4; i++) {
      pipes.push(makePipe(startX + i * PIPE_SPACING));
    }
    scroll = 0;
    flash = 0;
  };

  const startPlay = () => {
    score = 0;
    phase = "playing";
    resetWorld();
    birdVy = FLAP_V * 0.55;
    emitPhase();
    emitHud();
    audio.blip(600);
  };

  const flap = () => {
    if (phase === "ready" || phase === "over") {
      startPlay();
      return;
    }
    if (phase !== "playing") return;
    birdVy = FLAP_V;
    wing = 0.15;
    audio.blip(520);
  };

  const gameOver = () => {
    if (phase !== "playing") return;
    phase = "over";
    flash = 0.35;
    audio.die();
    commitScore();
    emitPhase();
  };

  const tick = (dtMs: number) => {
    const dt = dtMs / 1000;
    if (flash > 0) flash -= dt;
    if (wing > 0) wing -= dt;
    readyBob += dt;

    if (phase === "ready") {
      birdY = H * 0.42 + Math.sin(readyBob * 3) * 8;
      scroll += PIPE_SPEED * 0.35 * dt;
      return;
    }
    if (phase !== "playing") return;

    birdVy += GRAVITY * dt;
    birdVy = clamp(birdVy, -480, 520);
    birdY += birdVy * dt;
    scroll += PIPE_SPEED * dt;

    const speed = PIPE_SPEED * (1 + Math.min(score, 20) * 0.012);
    for (const p of pipes) {
      p.x -= speed * dt;
    }

    // recycle pipes
    while (pipes.length && pipes[0].x + PIPE_W < -10) {
      pipes.shift();
      const last = pipes[pipes.length - 1];
      pipes.push(makePipe((last?.x ?? W) + PIPE_SPACING));
    }

    // score
    for (const p of pipes) {
      if (!p.passed && p.x + PIPE_W < birdX - BIRD_R) {
        p.passed = true;
        score += 1;
        audio.score();
        commitScore();
      }
    }

    // ceiling / ground
    const groundY = H - GROUND_H;
    if (birdY - BIRD_R < 44) {
      birdY = 44 + BIRD_R;
      gameOver();
      return;
    }
    if (birdY + BIRD_R > groundY) {
      birdY = groundY - BIRD_R;
      gameOver();
      return;
    }

    // pipes
    for (const p of pipes) {
      const inX = birdX + BIRD_R * 0.7 > p.x && birdX - BIRD_R * 0.7 < p.x + PIPE_W;
      if (!inX) continue;
      const gapTop = p.gapY - PIPE_GAP / 2;
      const gapBot = p.gapY + PIPE_GAP / 2;
      if (birdY - BIRD_R * 0.65 < gapTop || birdY + BIRD_R * 0.65 > gapBot) {
        gameOver();
        return;
      }
    }
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, p: Pipe) => {
    const gapTop = p.gapY - PIPE_GAP / 2;
    const gapBot = p.gapY + PIPE_GAP / 2;
    const groundY = H - GROUND_H;
    const cap = 14;

    const body = (x: number, y: number, w: number, h: number) => {
      if (h <= 0) return;
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, "#1a7a3a");
      g.addColorStop(0.35, "#33ff66");
      g.addColorStop(0.7, "#1f8f44");
      g.addColorStop(1, "#0d4a24");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    };

    // top pipe
    body(p.x, 44, PIPE_W, Math.max(0, gapTop - 44 - cap));
    body(p.x - 4, gapTop - cap, PIPE_W + 8, cap);

    // bottom pipe
    body(p.x - 4, gapBot, PIPE_W + 8, cap);
    body(p.x, gapBot + cap, PIPE_W, Math.max(0, groundY - gapBot - cap));
  };

  const drawBird = (ctx: CanvasRenderingContext2D, now: number) => {
    const tilt = clamp(birdVy / 400, -0.6, 0.9);
    ctx.save();
    ctx.translate(birdX, birdY);
    ctx.rotate(phase === "ready" ? Math.sin(now * 0.004) * 0.15 : tilt);

    // body
    ctx.fillStyle = flash > 0 ? "#ff8888" : "#f4dfb4";
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R, BIRD_R * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // wing
    const wingY = wing > 0 ? -6 : 2;
    ctx.fillStyle = "#d6b06a";
    ctx.beginPath();
    ctx.ellipse(-2, wingY, BIRD_R * 0.55, BIRD_R * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(5, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#102018";
    ctx.beginPath();
    ctx.arc(6, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    // beak
    ctx.fillStyle = "#ff8844";
    ctx.beginPath();
    ctx.moveTo(BIRD_R - 2, 0);
    ctx.lineTo(BIRD_R + 8, 2);
    ctx.lineTo(BIRD_R - 2, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const paint = (ctx: CanvasRenderingContext2D, now: number) => {
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0a2030");
    sky.addColorStop(0.55, "#0d3028");
    sky.addColorStop(1, "#0a1810");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // soft CRT veil (lighter so sky reads)
    ctx.fillStyle = "rgba(0,8,6,0.25)";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#000";
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    ctx.restore();

    // parallax hills
    ctx.fillStyle = "rgba(20,60,40,0.55)";
    for (let i = 0; i < 6; i++) {
      const hx = ((i * 90 - (scroll * 0.25) % 90) + W + 40) % (W + 80) - 40;
      ctx.beginPath();
      ctx.moveTo(hx - 50, H - GROUND_H);
      ctx.quadraticCurveTo(hx, H - GROUND_H - 40 - (i % 3) * 10, hx + 50, H - GROUND_H);
      ctx.fill();
    }

    // pipes
    if (phase !== "ready") {
      for (const p of pipes) drawPipe(ctx, p);
    } else {
      // decorative idle pipes far right
      for (const p of pipes) drawPipe(ctx, p);
    }

    // ground
    const gy = H - GROUND_H;
    ctx.fillStyle = "#1a3d22";
    ctx.fillRect(0, gy, W, GROUND_H);
    ctx.fillStyle = "#33ff66";
    ctx.fillRect(0, gy, W, 3);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    const tile = 18;
    const off = scroll % tile;
    for (let x = -tile + off; x < W; x += tile) {
      ctx.fillRect(x, gy + 8, tile * 0.5, 4);
    }

    // bird
    if (phase === "ready") {
      birdX = Math.min(96, W * 0.28);
    }
    drawBird(ctx, now);

    if (flash > 0) {
      ctx.fillStyle = `rgba(255,80,80,${flash * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }

    drawHudBar(ctx, "SKY HOP", score, highScore, W, phase === "playing" ? "FLAP!" : "");

    if (phase === "ready") {
      drawCenterText(
        ctx,
        ["SKY HOP", "SPACE / CLICK TO FLAP", "PRESS SPACE TO START"],
        W,
        H,
      );
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED", "P OR ESC TO RESUME"], W, H, "#f4dfb4");
    } else if (phase === "over") {
      drawCenterText(
        ctx,
        ["GAME OVER", `SCORE ${String(score).padStart(5, "0")}`, "SPACE / CLICK TO RETRY"],
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
      W = w;
      H = h;
      if (phase === "ready") {
        birdX = Math.min(96, W * 0.28);
        birdY = H * 0.42;
      }
    },
  );

  // seed decorative pipes for ready screen
  resetWorld();
  emitPhase();
  emitHud();

  return {
    setKey: (action, down) => {
      if (action === "fire" && down) flap();
      else if (action === "pause" && down) {
        if (phase === "playing") {
          phase = "paused";
          emitPhase();
        } else if (phase === "paused") {
          phase = "playing";
          emitPhase();
        }
      }
    },
    pointer: (kind) => {
      if (kind === "down") flap();
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
