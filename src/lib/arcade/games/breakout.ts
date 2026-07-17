/**
 * Classic Breakout for Penn Liberty Arcade.
 * Paddle · ball · colorful brick rows · lives · levels.
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

const HS_KEY = "pl-arcade-breakout-hs";
const TITLE = "BREAKOUT";
const PADDLE_W = 72;
const PADDLE_H = 10;
const BALL_R = 5;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_GAP = 3;
const TOP_MARGIN = 52;
const ROW_COLORS = [
  "#ff4466",
  "#ff8844",
  "#ffcc33",
  "#33ff66",
  "#5ec8ff",
  "#c88cff",
];
const ROW_POINTS = [70, 50, 40, 30, 20, 10];

type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  color: string;
  points: number;
};

type Keys = {
  left: boolean;
  right: boolean;
  fire: boolean;
  pause: boolean;
};

export function createGame(opts: CreateClassicOpts): ClassicController {
  const { canvas, onPhaseChange, onHud } = opts;
  const audio = new BeepAudio();
  audio.resume();

  let muted = false;
  let phase: Phase = "ready";
  let score = 0;
  let highScore = loadHs(HS_KEY);
  let lives = 3;
  let level = 1;
  let w = 320;
  let h = 240;

  let paddleX = 0;
  let paddleY = 0;
  let ballX = 0;
  let ballY = 0;
  let ballVx = 0;
  let ballVy = 0;
  let ballStuck = true;
  let bricks: Brick[] = [];
  let fireWasDown = false;
  let pauseWasDown = false;
  let pointerAim: number | null = null;

  const keys: Keys = {
    left: false,
    right: false,
    fire: false,
    pause: false,
  };

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: `L${level} · ♥${lives}`,
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

  const buildBricks = () => {
    const pad = 10;
    const usable = Math.max(80, w - pad * 2);
    const bw = (usable - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
    const bh = 14;
    const list: Brick[] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        list.push({
          x: pad + c * (bw + BRICK_GAP),
          y: TOP_MARGIN + r * (bh + BRICK_GAP),
          w: bw,
          h: bh,
          alive: true,
          color: ROW_COLORS[r % ROW_COLORS.length]!,
          points: ROW_POINTS[r % ROW_POINTS.length]!,
        });
      }
    }
    bricks = list;
  };

  const stickBall = () => {
    ballStuck = true;
    ballVx = 0;
    ballVy = 0;
    ballX = paddleX + PADDLE_W / 2;
    ballY = paddleY - BALL_R - 1;
  };

  const launchBall = () => {
    if (!ballStuck) return;
    ballStuck = false;
    const angle = rand(-0.55, 0.55);
    const speed = 220 + level * 18;
    ballVx = Math.sin(angle) * speed;
    ballVy = -Math.abs(Math.cos(angle) * speed);
    audio.blip(660);
  };

  const resetRound = () => {
    paddleX = (w - PADDLE_W) / 2;
    paddleY = h - 28;
    stickBall();
  };

  const fullReset = () => {
    score = 0;
    lives = 3;
    level = 1;
    fireWasDown = false;
    pauseWasDown = false;
    pointerAim = null;
    buildBricks();
    resetRound();
    maybeHs();
    setPhase("ready");
    emitHud();
  };

  const nextLevel = () => {
    level += 1;
    buildBricks();
    resetRound();
    audio.win();
    setPhase("ready");
    emitHud();
  };

  const loseLife = () => {
    lives -= 1;
    audio.die();
    maybeHs();
    if (lives <= 0) {
      setPhase("over");
      emitHud();
      return;
    }
    resetRound();
    setPhase("ready");
    emitHud();
  };

  const bounceFromPaddle = () => {
    const hit = (ballX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
    const clamped = clamp(hit, -1, 1);
    const speed = Math.hypot(ballVx, ballVy) || 220 + level * 18;
    const maxAngle = 1.15;
    const angle = clamped * maxAngle;
    ballVx = Math.sin(angle) * speed;
    ballVy = -Math.abs(Math.cos(angle) * speed);
    ballY = paddleY - BALL_R - 0.5;
    audio.blip(320 + Math.abs(clamped) * 200);
  };

  const update = (dtMs: number) => {
    const dt = dtMs / 1000;

    if (keys.pause && !pauseWasDown) {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    }
    pauseWasDown = keys.pause;

    if (phase === "ready") {
      const fireEdge = keys.fire && !fireWasDown;
      fireWasDown = keys.fire;
      if (fireEdge) {
        setPhase("playing");
        launchBall();
      }
    } else {
      fireWasDown = keys.fire;
    }

    if (phase !== "playing" && phase !== "ready") return;

    const speed = 340;
    if (pointerAim !== null) {
      paddleX = clamp(pointerAim - PADDLE_W / 2, 0, w - PADDLE_W);
    } else {
      if (keys.left) paddleX -= speed * dt;
      if (keys.right) paddleX += speed * dt;
      paddleX = clamp(paddleX, 0, w - PADDLE_W);
    }

    if (ballStuck) {
      ballX = paddleX + PADDLE_W / 2;
      ballY = paddleY - BALL_R - 1;
      return;
    }

    if (phase !== "playing") return;

    ballX += ballVx * dt;
    ballY += ballVy * dt;

    if (ballX - BALL_R < 0) {
      ballX = BALL_R;
      ballVx = Math.abs(ballVx);
      audio.blip(180);
    } else if (ballX + BALL_R > w) {
      ballX = w - BALL_R;
      ballVx = -Math.abs(ballVx);
      audio.blip(180);
    }
    if (ballY - BALL_R < 0) {
      ballY = BALL_R;
      ballVy = Math.abs(ballVy);
      audio.blip(200);
    }

    if (
      ballVy > 0 &&
      ballY + BALL_R >= paddleY &&
      ballY + BALL_R <= paddleY + PADDLE_H + 6 &&
      ballX >= paddleX - BALL_R &&
      ballX <= paddleX + PADDLE_W + BALL_R
    ) {
      bounceFromPaddle();
    }

    if (ballY - BALL_R > h + 8) {
      loseLife();
      return;
    }

    for (const b of bricks) {
      if (!b.alive) continue;
      const nearestX = clamp(ballX, b.x, b.x + b.w);
      const nearestY = clamp(ballY, b.y, b.y + b.h);
      const dx = ballX - nearestX;
      const dy = ballY - nearestY;
      if (dx * dx + dy * dy > BALL_R * BALL_R) continue;

      b.alive = false;
      score += b.points * (1 + Math.floor((level - 1) / 2));
      maybeHs();
      audio.hit(280 + b.points * 2);
      emitHud();

      const overlapL = ballX + BALL_R - b.x;
      const overlapR = b.x + b.w - (ballX - BALL_R);
      const overlapT = ballY + BALL_R - b.y;
      const overlapB = b.y + b.h - (ballY - BALL_R);
      const minX = Math.min(overlapL, overlapR);
      const minY = Math.min(overlapT, overlapB);
      if (minX < minY) ballVx = -ballVx;
      else ballVy = -ballVy;

      // slight speed-up after hits
      const sp = Math.hypot(ballVx, ballVy);
      const cap = 420 + level * 25;
      if (sp < cap) {
        const f = 1.012;
        ballVx *= f;
        ballVy *= f;
      }
      break;
    }

    if (bricks.every((b) => !b.alive)) {
      nextLevel();
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, w, h);

    // playfield border glow
    ctx.strokeStyle = "rgba(51,255,102,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    drawHudBar(ctx, TITLE, score, highScore, w, `L${level}  ♥${lives}`);

    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(b.x, b.y, b.w, 2);
    }

    // paddle
    ctx.fillStyle = "#33ff66";
    ctx.shadowColor = "#33ff66";
    ctx.shadowBlur = 8;
    ctx.fillRect(paddleX, paddleY, PADDLE_W, PADDLE_H);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(232,255,232,0.35)";
    ctx.fillRect(paddleX, paddleY, PADDLE_W, 2);

    // ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = "#e8ffe8";
    ctx.shadowColor = "#33ff66";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (phase === "ready") {
      drawCenterText(
        ctx,
        ["BREAKOUT", "SPACE / CLICK TO LAUNCH", "← →  A D  ·  P PAUSE"],
        w,
        h,
      );
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED", "P TO RESUME"], w, h, "#f4dfb4");
    } else if (phase === "over") {
      drawCenterText(
        ctx,
        ["GAME OVER", `SCORE ${score}`, "R OR RESTART"],
        w,
        h,
        "#ff6688",
      );
    }
  };

  const loop = bootLoop(
    canvas,
    (dt) => update(dt),
    (ctx) => render(ctx),
    (nw, nh) => {
      w = nw;
      h = nh;
      paddleY = h - 28;
      paddleX = clamp(paddleX, 0, Math.max(0, w - PADDLE_W));
      if (bricks.length === 0) buildBricks();
      else {
        // rebuild brick layout to new width, keep alive flags by index
        const alive = bricks.map((b) => b.alive);
        buildBricks();
        for (let i = 0; i < bricks.length && i < alive.length; i++) {
          bricks[i]!.alive = alive[i]!;
        }
      }
      if (ballStuck) stickBall();
    },
  );

  // initial layout
  {
    const m = loop.measure();
    w = m.w;
    h = m.h;
    fullReset();
  }

  return {
    setKey: (action: string, down: boolean) => {
      if (action === "left") keys.left = down;
      else if (action === "right") keys.right = down;
      else if (action === "fire") {
        keys.fire = down;
        if (down && phase === "ready") {
          setPhase("playing");
          launchBall();
        } else if (down && phase === "over") {
          fullReset();
        }
      } else if (action === "pause") keys.pause = down;
    },
    pointer: (kind, x) => {
      if (kind === "move" || kind === "down") {
        pointerAim = x;
        if (kind === "down") {
          audio.resume();
          if (phase === "ready") {
            setPhase("playing");
            launchBall();
          } else if (phase === "over") {
            fullReset();
          }
        }
      }
      if (kind === "up") {
        /* keep last aim for keyboard hybrid */
      }
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
    restart: () => fullReset(),
    unlockAudio: () => audio.resume(),
    dispose: () => {
      loop.dispose();
      audio.dispose();
    },
  };
}
