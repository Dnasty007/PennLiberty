/** Canvas 2D renderer. All drawing is in CSS px; the component applies the
 *  DPR transform + disables smoothing for crisp pixels before calling this. */
import { COLORS, GRID, PLAYER, UFO } from "./constants";
import { invaderSprite, playerSprite, ufoSprite } from "./sprites";
import type { GameState } from "./types";

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

  // vignette to lift sprites off the mural
  const grad = ctx.createLinearGradient(0, 0, 0, s.height);
  grad.addColorStop(0, "rgba(5,16,30,0.32)");
  grad.addColorStop(1, "rgba(5,16,30,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s.width, s.height);

  // shield rings (pins drift below as DOM chips; ring shows the hitbox)
  for (const pin of s.pins) {
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, pin.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(214,176,106,0.30)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // invaders (+ explosion freeze)
  for (const inv of s.invaders) {
    if (inv.dying > 0) {
      drawBurst(ctx, inv.x, inv.y, 10, COLORS.gold);
      continue;
    }
    if (!inv.alive) continue;
    drawSprite(ctx, invaderSprite(inv.sprite, s.stepFrame), inv.x, inv.y, GRID.invaderWidth);
  }

  // ufo
  if (s.ufo.active) drawSprite(ctx, ufoSprite(), s.ufo.x, s.ufo.y, UFO.width);

  // player (blink while invulnerable)
  const blink = s.player.invuln > 0 && Math.floor(time / 90) % 2 === 0;
  if (s.phase !== "over" && !blink) {
    drawSprite(ctx, playerSprite(), s.player.x, s.player.y, PLAYER.width);
  }

  // bullets
  for (const b of s.playerBullets) {
    if (!b.active) continue;
    ctx.fillStyle = COLORS.goldLight;
    ctx.fillRect(b.x - 1.5, b.y - 6, 3, 12);
  }
  for (const b of s.enemyBullets) {
    if (!b.active) continue;
    ctx.fillStyle = COLORS.danger;
    ctx.fillRect(b.x - 1.5, b.y - 6, 3, 12);
  }

  // particles
  for (const p of s.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  drawHud(ctx, s);
  drawPhaseText(ctx, s, time);
}

function drawBurst(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 2, cy + Math.sin(a) * 2);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
}

function drawHud(ctx: CanvasRenderingContext2D, s: GameState) {
  ctx.font = "bold 13px 'Courier New', ui-monospace, monospace";
  ctx.textBaseline = "top";

  ctx.fillStyle = COLORS.goldLight;
  ctx.textAlign = "left";
  ctx.fillText(`SCORE ${String(s.score).padStart(5, "0")}`, 14, 14);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText(`WAVE ${s.wave}`, 14, 32);

  ctx.fillStyle = COLORS.gold;
  ctx.textAlign = "center";
  ctx.fillText(`HI ${String(s.highScore).padStart(5, "0")}`, s.width / 2, 14);

  // lives icons bottom-left
  const ship = playerSprite();
  const iconW = 20;
  for (let i = 0; i < s.lives; i++) {
    drawSprite(ctx, ship, 22 + i * (iconW + 6), s.height - 16, iconW);
  }
}

function drawPhaseText(ctx: CanvasRenderingContext2D, s: GameState, time: number) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (s.phase === "ready") {
    if (Math.floor(time / 450) % 2 === 0) {
      ctx.fillStyle = COLORS.goldLight;
      ctx.font = "bold 20px 'Courier New', ui-monospace, monospace";
      ctx.fillText("PRESS SPACE TO START", s.width / 2, s.height / 2);
    }
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "12px 'Courier New', ui-monospace, monospace";
    ctx.fillText("← → move · space fire · P pause · Esc quit", s.width / 2, s.height / 2 + 30);
  }

  if (s.phase === "wave-clear") {
    ctx.fillStyle = COLORS.goldLight;
    ctx.font = "bold 22px 'Courier New', ui-monospace, monospace";
    ctx.fillText(`WAVE ${s.wave + 1}`, s.width / 2, s.height / 2);
  }
}
