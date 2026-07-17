/**
 * 2048 for Penn Liberty Arcade.
 * Swipe / arrow keys · merge tiles · reach 2048 (keep going for score).
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

const HS_KEY = "pl-arcade-2048-hs";
const TITLE = "2048";
const N = 4;

const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  0: { bg: "rgba(255,255,255,0.06)", fg: "#e8ffe8" },
  2: { bg: "#1e3a2f", fg: "#e8ffe8" },
  4: { bg: "#234d38", fg: "#e8ffe8" },
  8: { bg: "#2d6a4f", fg: "#fff" },
  16: { bg: "#40916c", fg: "#fff" },
  32: { bg: "#52b788", fg: "#05100a" },
  64: { bg: "#74c69d", fg: "#05100a" },
  128: { bg: "#f4dfb4", fg: "#05100a" },
  256: { bg: "#d6b06a", fg: "#05100a" },
  512: { bg: "#5ec8ff", fg: "#051018" },
  1024: { bg: "#c084fc", fg: "#fff" },
  2048: { bg: "#33ff66", fg: "#05100a" },
  4096: { bg: "#ff4466", fg: "#fff" },
};

type Dir = "left" | "right" | "up" | "down";

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
  let board: number[][] = empty();
  let won = false;
  let keepGoing = false;
  let edge: Partial<Record<Dir, boolean>> = {};
  let pauseWas = false;
  let fireWas = false;
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    pause: false,
  };
  let swipe: { x: number; y: number } | null = null;

  function empty(): number[][] {
    return Array.from({ length: N }, () => Array(N).fill(0));
  }

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: won ? "2048+" : "MERGE",
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

  const empties = () => {
    const list: { r: number; c: number }[] = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (board[r]![c] === 0) list.push({ r, c });
    return list;
  };

  const spawn = () => {
    const e = empties();
    if (!e.length) return;
    const pick = e[Math.floor(Math.random() * e.length)]!;
    board[pick.r]![pick.c] = Math.random() < 0.9 ? 2 : 4;
  };

  const softReset = () => {
    score = 0;
    board = empty();
    won = false;
    keepGoing = false;
    spawn();
    spawn();
    emitHud();
  };

  softReset();

  const slideLine = (line: number[]): { line: number[]; gained: number; moved: boolean } => {
    const filtered = line.filter((v) => v !== 0);
    const out: number[] = [];
    let gained = 0;
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const v = filtered[i]! * 2;
        out.push(v);
        gained += v;
        i += 2;
      } else {
        out.push(filtered[i]!);
        i += 1;
      }
    }
    while (out.length < N) out.push(0);
    const moved = out.some((v, idx) => v !== line[idx]);
    return { line: out, gained, moved };
  };

  const move = (dir: Dir): boolean => {
    let movedAny = false;
    let gained = 0;

    if (dir === "left" || dir === "right") {
      for (let r = 0; r < N; r++) {
        let row = board[r]!.slice();
        if (dir === "right") row = row.reverse();
        const res = slideLine(row);
        if (dir === "right") res.line.reverse();
        if (res.moved) movedAny = true;
        gained += res.gained;
        board[r] = res.line;
      }
    } else {
      for (let c = 0; c < N; c++) {
        let col = board.map((row) => row[c]!);
        if (dir === "down") col = col.reverse();
        const res = slideLine(col);
        if (dir === "down") res.line.reverse();
        if (res.moved) movedAny = true;
        gained += res.gained;
        for (let r = 0; r < N; r++) board[r]![c] = res.line[r]!;
      }
    }

    if (movedAny) {
      score += gained;
      if (gained > 0) audio.score();
      else audio.blip(200);
      spawn();
      maybeHs();
      emitHud();

      // win check
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
          if (board[r]![c]! >= 2048 && !won) {
            won = true;
            if (!keepGoing) {
              audio.win();
              setPhase("win");
            }
          }

      if (!canMove()) {
        maybeHs();
        setPhase("over");
      }
    }
    return movedAny;
  };

  const canMove = () => {
    if (empties().length) return true;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = board[r]![c]!;
        if (c + 1 < N && board[r]![c + 1] === v) return true;
        if (r + 1 < N && board[r + 1]![c] === v) return true;
      }
    }
    return false;
  };

  const tick = () => {
    if (keys.pause && !pauseWas) {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    }
    pauseWas = keys.pause;

    if (phase === "ready") {
      if (keys.fire && !fireWas) {
        softReset();
        setPhase("playing");
      }
      fireWas = keys.fire;
      return;
    }
    if (phase === "over") {
      if (keys.fire && !fireWas) {
        softReset();
        setPhase("playing");
      }
      fireWas = keys.fire;
      return;
    }
    if (phase === "win") {
      if (keys.fire && !fireWas) {
        keepGoing = true;
        setPhase("playing");
      }
      fireWas = keys.fire;
      return;
    }
    if (phase !== "playing") {
      fireWas = keys.fire;
      return;
    }

    (["left", "right", "up", "down"] as Dir[]).forEach((d) => {
      if (keys[d] && !edge[d]) {
        edge[d] = true;
        move(d);
      }
      if (!keys[d]) edge[d] = false;
    });
  };

  const boardLayout = () => {
    const size = Math.min(w - 24, h - 70);
    const x = (w - size) / 2;
    const y = 52 + (h - 60 - size) / 2;
    const gap = 6;
    const cell = (size - gap * (N + 1)) / N;
    return { x, y, size, gap, cell };
  };

  const paint = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, w, h);
    drawHudBar(ctx, TITLE, score, highScore, w, won ? "KEEP GOING" : "MERGE");

    const L = boardLayout();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.strokeStyle = "rgba(51,255,102,0.35)";
    ctx.lineWidth = 2;
    ctx.fillRect(L.x, L.y, L.size, L.size);
    ctx.strokeRect(L.x, L.y, L.size, L.size);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = board[r]![c]!;
        const colors = TILE_COLORS[v] ?? TILE_COLORS[4096]!;
        const tx = L.x + L.gap + c * (L.cell + L.gap);
        const ty = L.y + L.gap + r * (L.cell + L.gap);
        ctx.fillStyle = colors.bg;
        ctx.fillRect(tx, ty, L.cell, L.cell);
        if (v) {
          ctx.fillStyle = colors.fg;
          const fontSize = v >= 1000 ? L.cell * 0.32 : L.cell * 0.42;
          ctx.font = `bold ${Math.floor(fontSize)}px 'Courier New', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(v), tx + L.cell / 2, ty + L.cell / 2 + 1);
        }
      }
    }

    if (phase === "ready") {
      drawCenterText(ctx, ["2048", "ARROWS / SWIPE", "SPACE START"], w, h);
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED"], w, h);
    } else if (phase === "win") {
      drawCenterText(ctx, ["YOU MADE 2048!", "SPACE TO CONTINUE", "OR MENU TO QUIT"], w, h, "#33ff66");
    } else if (phase === "over") {
      drawCenterText(ctx, ["NO MOVES", `SCORE ${score}`, "SPACE RETRY"], w, h, "#ff6688");
    }
  };

  const loop = bootLoop(
    canvas,
    () => tick(),
    paint,
    (nw, nh) => {
      w = nw;
      h = nh;
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
      if (kind === "down") {
        swipe = { x, y };
        if (phase === "ready") {
          softReset();
          setPhase("playing");
        } else if (phase === "over") {
          softReset();
          setPhase("playing");
        } else if (phase === "win") {
          keepGoing = true;
          setPhase("playing");
        }
      }
      if (kind === "up" && swipe && phase === "playing") {
        const dx = x - swipe.x;
        const dy = y - swipe.y;
        if (Math.hypot(dx, dy) > 24) {
          if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
          else move(dy > 0 ? "down" : "up");
        }
        swipe = null;
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
