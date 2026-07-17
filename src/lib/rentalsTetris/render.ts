/** Canvas renderer — classic well + side panel on a CRT plate. */
import {
  COLS,
  HIDDEN_ROWS,
  PIECE_COLORS,
  ROWS,
  VISIBLE_ROWS,
} from "./constants";
import { cellsOf, ghostY } from "./engine";
import { getShape, INDEX_TO_PIECE, PIECE_COLOR_INDEX } from "./pieces";
import type { GameState, PieceId } from "./types";

function colorForIndex(idx: number): string {
  const id = INDEX_TO_PIECE[idx];
  return id ? PIECE_COLORS[id]! : "#33ff66";
}

function colorForPiece(id: PieceId): string {
  return PIECE_COLORS[id]!;
}

export function render(ctx: CanvasRenderingContext2D, s: GameState, time: number) {
  const W = s.width;
  const H = s.height;
  ctx.clearRect(0, 0, W, H);

  // CRT plate
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(2, 12, 10, 0.55)");
  grad.addColorStop(1, "rgba(0, 6, 4, 0.78)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Layout: well centered-left, panel on right
  const pad = Math.max(12, Math.min(W, H) * 0.04);
  const panelW = Math.min(160, W * 0.28);
  const wellAreaW = W - panelW - pad * 3;
  const wellAreaH = H - pad * 2 - 36;
  const cell = Math.floor(
    Math.min(wellAreaW / COLS, wellAreaH / VISIBLE_ROWS),
  );
  const wellW = cell * COLS;
  const wellH = cell * VISIBLE_ROWS;
  const wellX = pad + Math.max(0, (wellAreaW - wellW) / 2);
  const wellY = pad + 28 + Math.max(0, (wellAreaH - wellH) / 2);

  // Title
  ctx.font = "bold 13px 'Courier New', ui-monospace, monospace";
  ctx.fillStyle = "#33ff66";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("TETRIS", wellX, 10);
  ctx.fillStyle = "#e8ffe8";
  ctx.fillText(
    `SCORE ${String(s.score).padStart(6, "0")}`,
    wellX + 70,
    10,
  );

  // Well border
  ctx.strokeStyle = PIECE_COLORS.border!;
  ctx.lineWidth = 2;
  ctx.strokeRect(wellX - 2, wellY - 2, wellW + 4, wellH + 4);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(wellX, wellY, wellW, wellH);

  // Grid
  ctx.strokeStyle = PIECE_COLORS.grid!;
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(wellX + c * cell, wellY);
    ctx.lineTo(wellX + c * cell, wellY + wellH);
    ctx.stroke();
  }
  for (let r = 1; r < VISIBLE_ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(wellX, wellY + r * cell);
    ctx.lineTo(wellX + wellW, wellY + r * cell);
    ctx.stroke();
  }

  const boardY = (row: number) => wellY + (row - HIDDEN_ROWS) * cell;

  // Locked cells
  for (let r = HIDDEN_ROWS; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = s.board[r]![c]!;
      if (!v) continue;
      const clearing = s.clearingRows.includes(r);
      const flash = clearing && Math.floor(time / 60) % 2 === 0;
      drawBlock(
        ctx,
        wellX + c * cell,
        boardY(r),
        cell,
        flash ? "#e8ffe8" : colorForIndex(v),
      );
    }
  }

  // Ghost
  if (s.active && s.phase === "playing") {
    const gy = ghostY(s);
    if (gy !== null && gy !== s.active.y) {
      const ghost = { ...s.active, y: gy };
      for (const { x, y } of cellsOf(ghost)) {
        if (y < HIDDEN_ROWS) continue;
        ctx.fillStyle = PIECE_COLORS.ghost!;
        ctx.fillRect(
          wellX + x * cell + 1,
          boardY(y) + 1,
          cell - 2,
          cell - 2,
        );
      }
    }
  }

  // Active piece
  if (s.active && s.phase !== "over") {
    const col = colorForPiece(s.active.id);
    for (const { x, y } of cellsOf(s.active)) {
      if (y < HIDDEN_ROWS) continue;
      drawBlock(ctx, wellX + x * cell, boardY(y), cell, col);
    }
  }

  // Side panel
  const px = wellX + wellW + pad;
  const py = wellY;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.strokeStyle = "rgba(51,255,102,0.35)";
  ctx.lineWidth = 1;
  ctx.fillRect(px, py, panelW, wellH);
  ctx.strokeRect(px, py, panelW, wellH);

  ctx.fillStyle = "#33ff66";
  ctx.font = "bold 11px 'Courier New', ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText("NEXT", px + 12, py + 14);
  drawMiniPiece(ctx, s.next, px + 12, py + 32, Math.min(18, panelW / 6));

  ctx.fillStyle = "#33ff66";
  ctx.fillText("LEVEL", px + 12, py + 120);
  ctx.fillStyle = "#e8ffe8";
  ctx.font = "bold 20px 'Courier New', ui-monospace, monospace";
  ctx.fillText(String(s.level), px + 12, py + 138);

  ctx.fillStyle = "#33ff66";
  ctx.font = "bold 11px 'Courier New', ui-monospace, monospace";
  ctx.fillText("LINES", px + 12, py + 180);
  ctx.fillStyle = "#e8ffe8";
  ctx.font = "bold 20px 'Courier New', ui-monospace, monospace";
  ctx.fillText(String(s.lines), px + 12, py + 198);

  ctx.fillStyle = "#33ff66";
  ctx.font = "bold 11px 'Courier New', ui-monospace, monospace";
  ctx.fillText("HI-SCORE", px + 12, py + 240);
  ctx.fillStyle = "#f4dfb4";
  ctx.font = "bold 14px 'Courier New', ui-monospace, monospace";
  ctx.fillText(String(s.highScore).padStart(6, "0"), px + 12, py + 258);

  // Controls hint
  ctx.fillStyle = "rgba(232,255,232,0.45)";
  ctx.font = "10px 'Courier New', ui-monospace, monospace";
  ctx.fillText("←→ move", px + 12, py + wellH - 52);
  ctx.fillText("↑/X rot  Z ccw", px + 12, py + wellH - 38);
  ctx.fillText("↓ soft  SPC hard", px + 12, py + wellH - 24);
  ctx.fillText("P pause  ESC menu", px + 12, py + wellH - 10);

  // Scanlines
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#000";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.restore();

  // Phase text
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (s.phase === "ready") {
    if (Math.floor(time / 450) % 2 === 0) {
      ctx.fillStyle = "#33ff66";
      ctx.font = "bold 20px 'Courier New', ui-monospace, monospace";
      ctx.fillText("PRESS SPACE", wellX + wellW / 2, wellY + wellH / 2);
    }
  }
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  color: string,
) {
  const m = 1;
  ctx.fillStyle = color;
  ctx.fillRect(x + m, y + m, cell - m * 2, cell - m * 2);
  // highlight
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(x + m, y + m, cell - m * 2, 2);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x + m, y + cell - m - 2, cell - m * 2, 2);
}

function drawMiniPiece(
  ctx: CanvasRenderingContext2D,
  id: PieceId,
  x: number,
  y: number,
  cell: number,
) {
  const shape = getShape(id, 0);
  const color = colorForPiece(id);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r]![c]) continue;
      drawBlock(ctx, x + c * cell, y + r * cell, cell, color);
    }
  }
  void PIECE_COLOR_INDEX;
}
