/** Canvas 2D renderer — classic 1978 green CRT look with light gold accents.
 *  Drawing is in CSS px; the component applies DPR + disables smoothing. */
import { bunkerCellSize } from "./bunkers";
import { COLORS, GRID, PLAYER, UFO } from "./constants";
import {
  explosionSprite,
  invaderSprite,
  playerSprite,
  SPRITE_COLORS,
  ufoSprite,
} from "./sprites";
import type { Bunker, GameState } from "./types";

const CRT = {
  green: SPRITE_COLORS.green,
  phosphor: SPRITE_COLORS.phosphor,
  ufo: SPRITE_COLORS.ufo,
  bunker: SPRITE_COLORS.bunker,
  gold: COLORS.gold,
  goldLight: COLORS.goldLight,
  enemyBullet: "#ff6688",
  score: "#33ff66",
} as const;

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  cx: number,
  cy: number,
  targetW: number,
) {
  const scale = targetW / sprite.width;
  const w = targetW;
  const h = sprite.height * scale;
  ctx.drawImage(sprite, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
}

export function render(ctx: CanvasRenderingContext2D, s: GameState, time: number) {
  ctx.clearRect(0, 0, s.width, s.height);
  ctx.save();

  // screen shake
  if (s.shake > 0) {
    const amp = 3 * (s.shake / 220);
    ctx.translate((Math.random() - 0.5) * amp * 2, (Math.random() - 0.5) * amp * 2);
  }

  // Darken mural for arcade CRT plate
  const grad = ctx.createLinearGradient(0, 0, 0, s.height);
  grad.addColorStop(0, "rgba(2, 10, 6, 0.42)");
  grad.addColorStop(0.55, "rgba(2, 12, 8, 0.52)");
  grad.addColorStop(1, "rgba(0, 6, 4, 0.68)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s.width, s.height);

  // Soft vignette
  const vig = ctx.createRadialGradient(
    s.width / 2,
    s.height / 2,
    Math.min(s.width, s.height) * 0.28,
    s.width / 2,
    s.height / 2,
    Math.max(s.width, s.height) * 0.72,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, s.width, s.height);

  // Classic destructible bunkers only (no pin shield rings)
  drawBunkers(ctx, s.bunkers, bunkerCellSize(s.width));

  // Invaders (+ explosion freeze)
  for (const inv of s.invaders) {
    if (inv.dying > 0) {
      const fr: 0 | 1 = inv.dying > 55 ? 0 : 1;
      drawSprite(ctx, explosionSprite(fr), inv.x, inv.y, GRID.invaderWidth * 0.95);
      continue;
    }
    if (!inv.alive) continue;
    drawSprite(ctx, invaderSprite(inv.sprite, s.stepFrame), inv.x, inv.y, GRID.invaderWidth);
  }

  // UFO
  if (s.ufo.active) drawSprite(ctx, ufoSprite(), s.ufo.x, s.ufo.y, UFO.width);

  // Player (blink while invulnerable)
  const blink = s.player.invuln > 0 && Math.floor(time / 90) % 2 === 0;
  if (s.phase !== "over" && s.phase !== "dying" && !blink) {
    drawSprite(ctx, playerSprite(), s.player.x, s.player.y, PLAYER.width);
  }
  if (s.phase === "dying") {
    drawSprite(ctx, explosionSprite(Math.floor(time / 80) % 2 === 0 ? 0 : 1), s.player.x, s.player.y, PLAYER.width);
  }

  // Bullets — player = green laser; enemy = zigzag-ish red dash
  for (const b of s.playerBullets) {
    if (!b.active) continue;
    ctx.fillStyle = CRT.green;
    ctx.fillRect(Math.round(b.x - 1.5), Math.round(b.y - 6), 3, 12);
    // slight gold tip accent
    ctx.fillStyle = CRT.goldLight;
    ctx.fillRect(Math.round(b.x - 1.5), Math.round(b.y - 6), 3, 2);
  }
  for (const b of s.enemyBullets) {
    if (!b.active) continue;
    drawEnemyBullet(ctx, b.x, b.y, time);
  }

  // Particles
  for (const p of s.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Subtle CRT scanlines
  drawScanlines(ctx, s.width, s.height);

  ctx.restore();

  drawHud(ctx, s);
  drawPhaseText(ctx, s, time);
}

function drawBunkers(
  ctx: CanvasRenderingContext2D,
  bunkers: Bunker[],
  cell: number,
) {
  if (!bunkers.length) return;
  const block = Math.max(2, Math.round(cell));
  for (const bunker of bunkers) {
    for (const b of bunker.blocks) {
      if (!b.alive) continue;
      ctx.fillStyle = CRT.bunker;
      ctx.fillRect(
        Math.round(b.x - block / 2),
        Math.round(b.y - block / 2),
        block,
        block,
      );
      // tiny gold edge so brand peeks through
      ctx.fillStyle = "rgba(214,176,106,0.35)";
      ctx.fillRect(
        Math.round(b.x - block / 2),
        Math.round(b.y - block / 2),
        block,
        1,
      );
    }
  }
}

function drawEnemyBullet(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  // Classic zigzag / lightning bolt enemy shot
  const phase = Math.floor(time / 60) % 2;
  ctx.fillStyle = CRT.enemyBullet;
  if (phase === 0) {
    ctx.fillRect(Math.round(x - 1), Math.round(y - 6), 2, 3);
    ctx.fillRect(Math.round(x), Math.round(y - 3), 2, 3);
    ctx.fillRect(Math.round(x - 1), Math.round(y), 2, 3);
    ctx.fillRect(Math.round(x), Math.round(y + 3), 2, 3);
  } else {
    ctx.fillRect(Math.round(x), Math.round(y - 6), 2, 3);
    ctx.fillRect(Math.round(x - 1), Math.round(y - 3), 2, 3);
    ctx.fillRect(Math.round(x), Math.round(y), 2, 3);
    ctx.fillRect(Math.round(x - 1), Math.round(y + 3), 2, 3);
  }
}

function drawScanlines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#000";
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
  // faint phosphor glow band
  ctx.globalAlpha = 0.03;
  ctx.fillStyle = CRT.green;
  for (let y = 1; y < h; y += 6) {
    ctx.fillRect(0, y, w, 1);
  }
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, s: GameState) {
  // Classic SCORE (left) / HI-SCORE (center) arcade layout
  ctx.font = "bold 14px 'Courier New', ui-monospace, monospace";
  ctx.textBaseline = "top";
  ctx.fillStyle = CRT.score;

  ctx.textAlign = "left";
  ctx.fillText("SCORE", 14, 10);
  ctx.fillStyle = CRT.phosphor;
  ctx.fillText(String(s.score).padStart(4, "0"), 14, 26);

  ctx.fillStyle = CRT.score;
  ctx.textAlign = "center";
  ctx.fillText("HI-SCORE", s.width / 2, 10);
  ctx.fillStyle = CRT.goldLight;
  ctx.fillText(String(s.highScore).padStart(4, "0"), s.width / 2, 26);

  ctx.fillStyle = CRT.score;
  ctx.textAlign = "right";
  ctx.fillText("WAVE", s.width - 14, 10);
  ctx.fillStyle = CRT.phosphor;
  ctx.fillText(String(s.wave).padStart(2, "0"), s.width - 14, 26);

  // Lives as small ships bottom-left (classic)
  const ship = playerSprite();
  const iconW = 22;
  ctx.fillStyle = CRT.score;
  ctx.font = "bold 12px 'Courier New', ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(String(Math.max(0, s.lives)), 12, s.height - 16);
  for (let i = 0; i < s.lives; i++) {
    drawSprite(ctx, ship, 32 + i * (iconW + 8), s.height - 16, iconW);
  }
}

function drawPhaseText(ctx: CanvasRenderingContext2D, s: GameState, time: number) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (s.phase === "ready") {
    if (Math.floor(time / 450) % 2 === 0) {
      ctx.fillStyle = CRT.green;
      ctx.font = "bold 20px 'Courier New', ui-monospace, monospace";
      ctx.fillText("PRESS SPACE TO START", s.width / 2, s.height / 2);
    }
    ctx.fillStyle = "rgba(232,255,232,0.65)";
    ctx.font = "12px 'Courier New', ui-monospace, monospace";
    ctx.fillText("← → move · space fire · P pause · Esc quit", s.width / 2, s.height / 2 + 30);
  }

  if (s.phase === "wave-clear") {
    ctx.fillStyle = CRT.green;
    ctx.font = "bold 22px 'Courier New', ui-monospace, monospace";
    ctx.fillText(`WAVE ${s.wave + 1}`, s.width / 2, s.height / 2);
    ctx.fillStyle = CRT.goldLight;
    ctx.font = "13px 'Courier New', ui-monospace, monospace";
    ctx.fillText("GET READY", s.width / 2, s.height / 2 + 28);
  }

  // paused / game-over chrome is drawn by React (buttons for resume/quit)
}
