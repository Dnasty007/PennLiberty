/**
 * Classic Pong for Penn Liberty Arcade.
 * Player left paddle · AI right · first to WIN_SCORE.
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

const HS_KEY = "pl-arcade-pong-hs";
const TITLE = "PONG";
const WIN_SCORE = 7;
const PADDLE_W = 10;
const PADDLE_H = 56;
const BALL_R = 5;
const BASE_SPEED = 260;
const PADDLE_SPEED = 320;

type Keys = {
  up: boolean;
  down: boolean;
  fire: boolean;
  pause: boolean;
};

export function createGame(opts: CreateClassicOpts): ClassicController {
  const { canvas, onPhaseChange, onHud } = opts;
  const audio = new BeepAudio();
  audio.resume();

  let muted = false;
  let phase: Phase = "ready";
  let scoreL = 0;
  let scoreR = 0;
  let highScore = loadHs(HS_KEY);
  let rally = 0;
  let maxRally = 0;
  let w = 320;
  let h = 240;

  let pY = 0;
  let aiY = 0;
  let ballX = 0;
  let ballY = 0;
  let ballVx = 0;
  let ballVy = 0;
  let serveDir = 1;
  let fireWasDown = false;
  let pauseWasDown = false;

  const keys: Keys = {
    up: false,
    down: false,
    fire: false,
    pause: false,
  };

  /** Display score = player points; HS = best player score / max rally. */
  const displayScore = () => Math.max(scoreL, maxRally);

  const hud = (): HudInfo => ({
    score: displayScore(),
    highScore,
    extra: `${scoreL}–${scoreR}  R${rally}`,
  });

  const setPhase = (p: Phase) => {
    phase = p;
    onPhaseChange?.(p, hud());
  };

  const emitHud = () => onHud?.(hud());

  const maybeHs = () => {
    const v = Math.max(scoreL, maxRally);
    if (v > highScore) {
      highScore = v;
      saveHs(HS_KEY, highScore);
    }
  };

  const centerPaddles = () => {
    pY = (h - PADDLE_H) / 2;
    aiY = (h - PADDLE_H) / 2;
  };

  const resetBall = (dir: number) => {
    ballX = w / 2;
    ballY = h / 2;
    const angle = rand(-0.45, 0.45);
    const speed = BASE_SPEED + Math.min(scoreL + scoreR, 12) * 8;
    ballVx = Math.cos(angle) * speed * dir;
    ballVy = Math.sin(angle) * speed;
    rally = 0;
  };

  const holdServe = () => {
    ballX = w / 2;
    ballY = h / 2;
    ballVx = 0;
    ballVy = 0;
    rally = 0;
  };

  const fullReset = () => {
    scoreL = 0;
    scoreR = 0;
    rally = 0;
    maxRally = 0;
    serveDir = Math.random() < 0.5 ? -1 : 1;
    fireWasDown = false;
    pauseWasDown = false;
    centerPaddles();
    holdServe();
    maybeHs();
    setPhase("ready");
    emitHud();
  };

  const startRally = () => {
    resetBall(serveDir);
    setPhase("playing");
    audio.blip(440);
    emitHud();
  };

  const pointScored = (leftScored: boolean) => {
    if (leftScored) {
      scoreL += 1;
      serveDir = 1;
      audio.score();
    } else {
      scoreR += 1;
      serveDir = -1;
      audio.die();
    }
    maybeHs();
    emitHud();

    if (scoreL >= WIN_SCORE) {
      audio.win();
      setPhase("win");
      return;
    }
    if (scoreR >= WIN_SCORE) {
      setPhase("over");
      return;
    }
    holdServe();
    setPhase("ready");
  };

  const bouncePaddle = (isLeft: boolean) => {
    const py = isLeft ? pY : aiY;
    const rel = (ballY - (py + PADDLE_H / 2)) / (PADDLE_H / 2);
    const clamped = clamp(rel, -1, 1);
    const speed = Math.min(
      Math.hypot(ballVx, ballVy) * 1.04 + 8,
      BASE_SPEED + 220,
    );
    const angle = clamped * 0.95;
    ballVx = Math.cos(angle) * speed * (isLeft ? 1 : -1);
    ballVy = Math.sin(angle) * speed;
    if (isLeft) ballX = 18 + PADDLE_W + BALL_R;
    else ballX = w - 18 - PADDLE_W - BALL_R;
    rally += 1;
    if (rally > maxRally) maxRally = rally;
    maybeHs();
    audio.blip(isLeft ? 380 : 300);
    emitHud();
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
      if (fireEdge) startRally();
    } else {
      fireWasDown = keys.fire;
    }

    // paddles move on ready + playing so player can position before serve
    if (phase === "ready" || phase === "playing") {
      if (keys.up) pY -= PADDLE_SPEED * dt;
      if (keys.down) pY += PADDLE_SPEED * dt;
      pY = clamp(pY, 8, h - PADDLE_H - 8);

      // AI tracks ball with slight lag / error
      if (phase === "playing") {
        const target = ballY - PADDLE_H / 2 + rand(-10, 10);
        const aiSpeed = PADDLE_SPEED * 0.78 + Math.min(scoreL, 6) * 6;
        if (aiY + PADDLE_H / 2 < target - 4) aiY += aiSpeed * dt;
        else if (aiY + PADDLE_H / 2 > target + 4) aiY -= aiSpeed * dt;
      } else {
        // idle drift toward center when waiting
        const mid = (h - PADDLE_H) / 2;
        aiY += (mid - aiY) * Math.min(1, dt * 2);
      }
      aiY = clamp(aiY, 8, h - PADDLE_H - 8);
    }

    if (phase !== "playing") return;

    ballX += ballVx * dt;
    ballY += ballVy * dt;

    if (ballY - BALL_R < 0) {
      ballY = BALL_R;
      ballVy = Math.abs(ballVy);
      audio.blip(160);
    } else if (ballY + BALL_R > h) {
      ballY = h - BALL_R;
      ballVy = -Math.abs(ballVy);
      audio.blip(160);
    }

    // left paddle
    if (
      ballVx < 0 &&
      ballX - BALL_R <= 18 + PADDLE_W &&
      ballX - BALL_R >= 18 - 4 &&
      ballY + BALL_R >= pY &&
      ballY - BALL_R <= pY + PADDLE_H
    ) {
      bouncePaddle(true);
    }

    // right paddle
    if (
      ballVx > 0 &&
      ballX + BALL_R >= w - 18 - PADDLE_W &&
      ballX + BALL_R <= w - 18 + 4 &&
      ballY + BALL_R >= aiY &&
      ballY - BALL_R <= aiY + PADDLE_H
    ) {
      bouncePaddle(false);
    }

    if (ballX + BALL_R < 0) pointScored(false);
    else if (ballX - BALL_R > w) pointScored(true);
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, w, h);

    // center dashed line
    ctx.strokeStyle = "rgba(51,255,102,0.28)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 44);
    ctx.lineTo(w / 2, h - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    drawHudBar(
      ctx,
      TITLE,
      displayScore(),
      highScore,
      w,
      `${scoreL}–${scoreR}`,
    );

    // big mid-score
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(51,255,102,0.55)";
    ctx.fillText(String(scoreL), w / 2 - 40, 48);
    ctx.fillText(String(scoreR), w / 2 + 40, 48);

    // paddles
    ctx.fillStyle = "#33ff66";
    ctx.shadowColor = "#33ff66";
    ctx.shadowBlur = 8;
    ctx.fillRect(18, pY, PADDLE_W, PADDLE_H);
    ctx.fillStyle = "#5ec8ff";
    ctx.shadowColor = "#5ec8ff";
    ctx.fillRect(w - 18 - PADDLE_W, aiY, PADDLE_W, PADDLE_H);
    ctx.shadowBlur = 0;

    // ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = "#e8ffe8";
    ctx.shadowColor = "#e8ffe8";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (phase === "ready") {
      drawCenterText(
        ctx,
        [
          scoreL === 0 && scoreR === 0 ? "PONG" : "SERVE",
          "SPACE TO SERVE",
          "W/S  ↑↓  ·  P PAUSE  ·  FIRST TO 7",
        ],
        w,
        h,
      );
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED", "P TO RESUME"], w, h, "#f4dfb4");
    } else if (phase === "win") {
      drawCenterText(
        ctx,
        ["YOU WIN!", `${scoreL}–${scoreR}`, "R OR RESTART"],
        w,
        h,
        "#33ff66",
      );
    } else if (phase === "over") {
      drawCenterText(
        ctx,
        ["CPU WINS", `${scoreL}–${scoreR}`, "R OR RESTART"],
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
      pY = clamp(pY, 8, Math.max(8, h - PADDLE_H - 8));
      aiY = clamp(aiY, 8, Math.max(8, h - PADDLE_H - 8));
      if (phase === "ready" || ballVx === 0) {
        ballX = w / 2;
        ballY = h / 2;
      }
    },
  );

  {
    const m = loop.measure();
    w = m.w;
    h = m.h;
    fullReset();
  }

  return {
    setKey: (action: string, down: boolean) => {
      if (action === "up") keys.up = down;
      else if (action === "down") keys.down = down;
      else if (action === "fire") {
        keys.fire = down;
        if (down && phase === "ready") startRally();
        else if (down && (phase === "over" || phase === "win")) fullReset();
      } else if (action === "pause") keys.pause = down;
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
