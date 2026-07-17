/**
 * Classic Minesweeper for Penn Liberty Arcade.
 * 9×9 beginner · 10 mines · flood fill · flag with right-click path or F.
 * Score = max(0, 999 − seconds); HS key pl-arcade-mines-hs.
 */
import {
  BeepAudio,
  bootLoop,
  drawCenterText,
  drawCrtPlate,
  drawHudBar,
  loadHs,
  saveHs,
  type ClassicController,
  type CreateClassicOpts,
  type HudInfo,
  type Phase,
} from "@/lib/arcade/shared";

const HS_KEY = "pl-arcade-mines-hs";
const TITLE = "MINES";
const COLS = 9;
const ROWS = 9;
const MINES = 10;
const TOP_UI = 48;

/** Classic number colors (phosphor variants). */
const NUM_COLORS = [
  "",
  "#5ec8ff",
  "#33ff66",
  "#ff5555",
  "#a78bfa",
  "#f4a261",
  "#2dd4bf",
  "#e8ffe8",
  "#94a3b8",
] as const;

type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adj: number;
};

type Keys = {
  pause: boolean;
  /** Secondary / right-button held — pointer down flags instead of reveals. */
  secondary: boolean;
  /** Keyboard F held (edge-triggered flag on hover). */
  f: boolean;
};

function emptyGrid(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adj: 0,
    })),
  );
}

function neighbors(r: number, c: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) out.push([nr, nc]);
    }
  }
  return out;
}

function placeMines(grid: Cell[][], safeR: number, safeC: number) {
  let placed = 0;
  let guard = 0;
  while (placed < MINES && guard < 10_000) {
    guard++;
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (grid[r]![c]!.mine) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    grid[r]![c]!.mine = true;
    placed++;
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r]![c]!;
      if (cell.mine) {
        cell.adj = -1;
        continue;
      }
      cell.adj = neighbors(r, c).filter(([nr, nc]) => grid[nr]![nc]!.mine)
        .length;
    }
  }
}

function countRevealed(grid: Cell[][]): number {
  let n = 0;
  for (const row of grid) for (const cell of row) if (cell.revealed) n++;
  return n;
}

function countFlags(grid: Cell[][]): number {
  let n = 0;
  for (const row of grid) for (const cell of row) if (cell.flagged) n++;
  return n;
}

function floodReveal(grid: Cell[][], r: number, c: number): number {
  const stack: Array<[number, number]> = [[r, c]];
  let opened = 0;
  while (stack.length) {
    const pair = stack.pop();
    if (!pair) break;
    const [cr, cc] = pair;
    const cell = grid[cr]![cc]!;
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    opened++;
    if (cell.adj === 0 && !cell.mine) {
      for (const [nr, nc] of neighbors(cr, cc)) {
        const n = grid[nr]![nc]!;
        if (!n.revealed && !n.flagged) stack.push([nr, nc]);
      }
    }
  }
  return opened;
}

function scoreFromSeconds(secs: number): number {
  return Math.max(0, 999 - Math.floor(secs));
}

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

  let grid = emptyGrid();
  let mined = false;
  let seconds = 0;
  let exploded: { r: number; c: number } | null = null;
  let hover: { r: number; c: number } | null = null;

  let cell = 24;
  let originX = 0;
  let originY = TOP_UI;

  let pauseWasDown = false;
  let fWasDown = false;

  const keys: Keys = {
    pause: false,
    secondary: false,
    f: false,
  };

  const flagsLeft = () => MINES - countFlags(grid);

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: `⏱${String(Math.floor(seconds)).padStart(3, "0")} ⚑${String(Math.max(0, flagsLeft())).padStart(2, "0")}`,
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

  const layoutGrid = () => {
    const pad = 16;
    const availW = Math.max(40, w - pad * 2);
    const availH = Math.max(40, h - TOP_UI - pad);
    cell = Math.max(12, Math.floor(Math.min(availW / COLS, availH / ROWS)));
    const gw = cell * COLS;
    const gh = cell * ROWS;
    originX = Math.floor((w - gw) / 2);
    originY = TOP_UI + Math.floor((availH - gh) / 2);
  };

  const hitCell = (x: number, y: number): { r: number; c: number } | null => {
    if (
      x < originX ||
      y < originY ||
      x >= originX + cell * COLS ||
      y >= originY + cell * ROWS
    ) {
      return null;
    }
    const c = Math.floor((x - originX) / cell);
    const r = Math.floor((y - originY) / cell);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return { r, c };
  };

  const fullReset = () => {
    grid = emptyGrid();
    mined = false;
    seconds = 0;
    score = 0;
    exploded = null;
    hover = null;
    keys.pause = false;
    keys.secondary = false;
    keys.f = false;
    pauseWasDown = false;
    fWasDown = false;
    layoutGrid();
    setPhase("ready");
    emitHud();
  };

  const ensureMines = (r: number, c: number) => {
    if (mined) return;
    placeMines(grid, r, c);
    mined = true;
  };

  const checkWin = () => {
    const need = COLS * ROWS - MINES;
    if (countRevealed(grid) < need) return;
    score = scoreFromSeconds(seconds);
    maybeHs();
    for (const row of grid) {
      for (const cellState of row) {
        if (cellState.mine) cellState.flagged = true;
      }
    }
    audio.win();
    setPhase("win");
    emitHud();
  };

  const revealAt = (r: number, c: number) => {
    if (phase === "ready") setPhase("playing");
    if (phase !== "playing") return;
    const cellState = grid[r]![c]!;
    if (cellState.revealed || cellState.flagged) return;

    ensureMines(r, c);

    if (grid[r]![c]!.mine) {
      grid[r]![c]!.revealed = true;
      exploded = { r, c };
      for (const row of grid) {
        for (const m of row) {
          if (m.mine) m.revealed = true;
        }
      }
      score = 0;
      audio.die();
      setPhase("over");
      emitHud();
      return;
    }

    const opened = floodReveal(grid, r, c);
    if (opened > 0) audio.blip(opened > 4 ? 620 : 480);
    score = scoreFromSeconds(seconds);
    checkWin();
    emitHud();
  };

  const flagAt = (r: number, c: number) => {
    if (phase === "ready") setPhase("playing");
    if (phase !== "playing") return;
    const cellState = grid[r]![c]!;
    if (cellState.revealed) return;
    cellState.flagged = !cellState.flagged;
    audio.blip(cellState.flagged ? 360 : 280);
    emitHud();
  };

  const update = (dtMs: number) => {
    if (keys.pause && !pauseWasDown) {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    }
    pauseWasDown = keys.pause;

    // KeyF edge: toggle flag on hovered cell
    if (keys.f && !fWasDown && hover) {
      if (phase === "playing" || phase === "ready") {
        flagAt(hover.r, hover.c);
      }
    }
    fWasDown = keys.f;

    if (phase === "playing") {
      seconds += dtMs / 1000;
      score = scoreFromSeconds(seconds);
      emitHud();
    }
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, w, h);
    drawHudBar(
      ctx,
      TITLE,
      score,
      highScore,
      w,
      `⏱${String(Math.floor(seconds)).padStart(3, "0")} ⚑${String(Math.max(0, flagsLeft())).padStart(2, "0")}`,
    );

    // board frame
    ctx.fillStyle = "rgba(0,20,12,0.65)";
    ctx.fillRect(originX - 3, originY - 3, cell * COLS + 6, cell * ROWS + 6);
    ctx.strokeStyle = "rgba(51,255,102,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      originX - 3.5,
      originY - 3.5,
      cell * COLS + 7,
      cell * ROWS + 7,
    );

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cellState = grid[r]![c]!;
        const x = originX + c * cell;
        const y = originY + r * cell;
        const pad = Math.max(1, Math.floor(cell * 0.06));
        const s = cell - pad * 2;
        const isHover =
          hover !== null &&
          hover.r === r &&
          hover.c === c &&
          (phase === "playing" || phase === "ready");

        if (!cellState.revealed) {
          ctx.fillStyle = isHover ? "#1a4a32" : "#0d3022";
          ctx.fillRect(x + pad, y + pad, s, s);
          ctx.strokeStyle = "rgba(80,200,120,0.45)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + pad, y + pad + s);
          ctx.lineTo(x + pad, y + pad);
          ctx.lineTo(x + pad + s, y + pad);
          ctx.stroke();
          ctx.strokeStyle = "rgba(0,0,0,0.45)";
          ctx.beginPath();
          ctx.moveTo(x + pad + s, y + pad);
          ctx.lineTo(x + pad + s, y + pad + s);
          ctx.lineTo(x + pad, y + pad + s);
          ctx.stroke();

          if (cellState.flagged) {
            const cx = x + cell / 2;
            const cy = y + cell / 2;
            const fs = cell * 0.22;
            ctx.fillStyle = "#ff5555";
            ctx.beginPath();
            ctx.moveTo(cx - fs * 0.3, cy - fs);
            ctx.lineTo(cx + fs, cy - fs * 0.2);
            ctx.lineTo(cx - fs * 0.3, cy + fs * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#f4dfb4";
            ctx.lineWidth = Math.max(1, cell * 0.06);
            ctx.beginPath();
            ctx.moveTo(cx - fs * 0.3, cy - fs);
            ctx.lineTo(cx - fs * 0.3, cy + fs);
            ctx.stroke();
          }
        } else {
          const hit =
            exploded !== null &&
            exploded.r === r &&
            exploded.c === c &&
            cellState.mine;
          ctx.fillStyle = hit ? "rgba(180,40,40,0.85)" : "rgba(4,18,12,0.9)";
          ctx.fillRect(x + pad, y + pad, s, s);
          ctx.strokeStyle = "rgba(0,0,0,0.35)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + pad + 0.5, y + pad + 0.5, s - 1, s - 1);

          if (cellState.mine) {
            const cx = x + cell / 2;
            const cy = y + cell / 2;
            const rad = cell * 0.18;
            ctx.fillStyle = hit ? "#ff8888" : "#e8ffe8";
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = Math.max(1, cell * 0.05);
            for (let a = 0; a < 4; a++) {
              const ang = (a * Math.PI) / 4;
              ctx.beginPath();
              ctx.moveTo(
                cx + Math.cos(ang) * rad * 0.5,
                cy + Math.sin(ang) * rad * 0.5,
              );
              ctx.lineTo(
                cx + Math.cos(ang) * rad * 1.55,
                cy + Math.sin(ang) * rad * 1.55,
              );
              ctx.stroke();
            }
          } else if (cellState.adj > 0) {
            ctx.font = `bold ${Math.floor(cell * 0.55)}px 'Courier New', monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = NUM_COLORS[cellState.adj] ?? "#e8ffe8";
            ctx.fillText(String(cellState.adj), x + cell / 2, y + cell / 2 + 1);
          }
        }
      }
    }

    if (phase === "ready") {
      drawCenterText(
        ctx,
        ["MINESWEEPER", "CLICK TO REVEAL · F / RMB FLAG", "P PAUSE"],
        w,
        h,
      );
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED", "P TO RESUME"], w, h, "#f4dfb4");
    } else if (phase === "over") {
      drawCenterText(ctx, ["BOOM", "R OR RESTART"], w, h, "#ff6688");
    } else if (phase === "win") {
      drawCenterText(
        ctx,
        ["CLEAR!", `SCORE ${score}`, "R OR RESTART"],
        w,
        h,
        "#33ff66",
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
      layoutGrid();
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
      if (action === "pause") {
        keys.pause = down;
      } else if (action === "f" || action === "F") {
        keys.f = down;
      } else if (
        action === "flag" ||
        action === "secondary" ||
        action === "pointer-right"
      ) {
        // Host holds this while pointer fires for RMB flag path.
        keys.secondary = down;
      } else if (action === "fire" && down) {
        if (phase === "over" || phase === "win") fullReset();
      }
    },
    pointer: (kind, x, y) => {
      const hit = hitCell(x, y);
      if (kind === "move") {
        hover = hit;
        return;
      }
      if (kind === "down") {
        audio.resume();
        hover = hit;
        if (!hit) return;
        if (phase === "paused") return;
        if (phase === "over" || phase === "win") {
          fullReset();
          return;
        }
        // secondary held → right-click flag path; else reveal
        if (keys.secondary) flagAt(hit.r, hit.c);
        else revealAt(hit.r, hit.c);
        return;
      }
      // up — action committed on down
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
