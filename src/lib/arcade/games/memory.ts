/**
 * Memory / Concentration card-match for Penn Liberty Arcade.
 * 4×4 grid · 8 color/symbol pairs · moves + timer scoring.
 * HS key pl-arcade-memory-hs.
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

const HS_KEY = "pl-arcade-memory-hs";
const TITLE = "MEMORY";
const COLS = 4;
const ROWS = 4;
const PAIR_COUNT = (COLS * ROWS) / 2;
const TOP_UI = 48;
const FLIP_BACK_MS = 650;

type Sym = {
  id: number;
  color: string;
  mark: string;
};

const SYMBOLS: readonly Sym[] = [
  { id: 0, color: "#33ff66", mark: "●" },
  { id: 1, color: "#5ec8ff", mark: "▲" },
  { id: 2, color: "#ff5555", mark: "■" },
  { id: 3, color: "#f4dfb4", mark: "◆" },
  { id: 4, color: "#a78bfa", mark: "★" },
  { id: 5, color: "#2dd4bf", mark: "✦" },
  { id: 6, color: "#f4a261", mark: "▼" },
  { id: 7, color: "#e879f9", mark: "✚" },
];

type Card = {
  sym: number;
  faceUp: boolean;
  matched: boolean;
};

type Keys = {
  pause: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function deal(): Card[] {
  const ids: number[] = [];
  for (let i = 0; i < PAIR_COUNT; i++) ids.push(i, i);
  return shuffle(ids).map((sym) => ({
    sym,
    faceUp: false,
    matched: false,
  }));
}

/** Higher score for fewer moves and less time. */
function calcScore(moves: number, seconds: number): number {
  return Math.max(0, 1000 - moves * 12 - Math.floor(seconds) * 2);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rw: number,
  rh: number,
  r: number,
) {
  const rr = Math.min(r, rw / 2, rh / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + rw, y, x + rw, y + rh, rr);
  ctx.arcTo(x + rw, y + rh, x, y + rh, rr);
  ctx.arcTo(x, y + rh, x, y, rr);
  ctx.arcTo(x, y, x + rw, y, rr);
  ctx.closePath();
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

  let cards = deal();
  let open: number[] = [];
  let lock = false;
  let flipTimer = 0;
  let pendingFlip: number[] | null = null;
  let moves = 0;
  let matchedPairs = 0;
  let seconds = 0;
  let hover: number | null = null;

  let cardW = 48;
  let cardH = 48;
  let gap = 8;
  let originX = 0;
  let originY = TOP_UI;

  let pauseWasDown = false;
  const keys: Keys = { pause: false };

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: `MOV ${String(moves).padStart(3, "0")} ⏱${String(Math.floor(seconds)).padStart(3, "0")} ${matchedPairs}/${PAIR_COUNT}`,
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

  const layoutBoard = () => {
    const pad = 18;
    gap = 8;
    const availW = Math.max(80, w - pad * 2);
    const availH = Math.max(80, h - TOP_UI - pad);
    const cw = Math.floor((availW - gap * (COLS - 1)) / COLS);
    const ch = Math.floor((availH - gap * (ROWS - 1)) / ROWS);
    const side = Math.max(28, Math.min(cw, ch));
    cardW = side;
    cardH = side;
    const gw = side * COLS + gap * (COLS - 1);
    const gh = side * ROWS + gap * (ROWS - 1);
    originX = Math.floor((w - gw) / 2);
    originY = TOP_UI + Math.floor((availH - gh) / 2);
  };

  const hitCard = (x: number, y: number): number | null => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = originX + c * (cardW + gap);
        const cy = originY + r * (cardH + gap);
        if (x >= cx && x < cx + cardW && y >= cy && y < cy + cardH) {
          return r * COLS + c;
        }
      }
    }
    return null;
  };

  const fullReset = () => {
    cards = deal();
    open = [];
    lock = false;
    flipTimer = 0;
    pendingFlip = null;
    moves = 0;
    matchedPairs = 0;
    seconds = 0;
    score = 0;
    hover = null;
    keys.pause = false;
    pauseWasDown = false;
    layoutBoard();
    setPhase("ready");
    emitHud();
  };

  const tryWin = () => {
    if (matchedPairs < PAIR_COUNT) return;
    score = calcScore(moves, seconds);
    maybeHs();
    audio.win();
    setPhase("win");
    emitHud();
  };

  const flipCard = (idx: number) => {
    if (lock) return;
    if (phase === "ready") setPhase("playing");
    if (phase !== "playing") return;

    const card = cards[idx];
    if (!card || card.faceUp || card.matched) return;
    if (open.includes(idx)) return;

    card.faceUp = true;
    open.push(idx);
    audio.blip(400 + open.length * 80);

    if (open.length < 2) {
      emitHud();
      return;
    }

    moves += 1;
    score = calcScore(moves, seconds);
    const a = open[0]!;
    const b = open[1]!;
    const ca = cards[a]!;
    const cb = cards[b]!;

    if (ca.sym === cb.sym) {
      ca.matched = true;
      cb.matched = true;
      matchedPairs += 1;
      open = [];
      audio.score();
      score = calcScore(moves, seconds);
      tryWin();
      emitHud();
    } else {
      lock = true;
      pendingFlip = [a, b];
      flipTimer = FLIP_BACK_MS;
      audio.hit(160);
      emitHud();
    }
  };

  const update = (dtMs: number) => {
    if (keys.pause && !pauseWasDown) {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    }
    pauseWasDown = keys.pause;

    if (phase !== "playing") return;

    seconds += dtMs / 1000;
    if (!lock) score = calcScore(moves, seconds);

    if (lock && pendingFlip) {
      flipTimer -= dtMs;
      if (flipTimer <= 0) {
        for (const i of pendingFlip) {
          const card = cards[i];
          if (card && !card.matched) card.faceUp = false;
        }
        open = [];
        pendingFlip = null;
        lock = false;
        flipTimer = 0;
      }
    }
    emitHud();
  };

  const render = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, w, h);
    drawHudBar(
      ctx,
      TITLE,
      score,
      highScore,
      w,
      `MOV ${String(moves).padStart(3, "0")} ⏱${String(Math.floor(seconds)).padStart(3, "0")} ${matchedPairs}/${PAIR_COUNT}`,
    );

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const card = cards[idx]!;
        const x = originX + c * (cardW + gap);
        const y = originY + r * (cardH + gap);
        const isHover =
          hover === idx &&
          !card.faceUp &&
          !card.matched &&
          (phase === "playing" || phase === "ready") &&
          !lock;
        const radius = Math.max(4, Math.floor(cardW * 0.12));

        if (card.faceUp || card.matched) {
          const sym = SYMBOLS[card.sym] ?? SYMBOLS[0]!;
          ctx.fillStyle = card.matched
            ? "rgba(20,50,30,0.9)"
            : "rgba(8,28,20,0.95)";
          roundRect(ctx, x, y, cardW, cardH, radius);
          ctx.fill();
          ctx.strokeStyle = card.matched
            ? `${sym.color}88`
            : "rgba(51,255,102,0.5)";
          ctx.lineWidth = 2;
          roundRect(ctx, x + 0.5, y + 0.5, cardW - 1, cardH - 1, radius);
          ctx.stroke();

          ctx.fillStyle = "rgba(0,10,8,0.45)";
          const inset = Math.max(4, cardW * 0.1);
          roundRect(
            ctx,
            x + inset,
            y + inset,
            cardW - inset * 2,
            cardH - inset * 2,
            radius * 0.6,
          );
          ctx.fill();

          ctx.font = `bold ${Math.floor(cardW * 0.42)}px 'Courier New', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = sym.color;
          if (card.matched) ctx.globalAlpha = 0.55;
          ctx.fillText(sym.mark, x + cardW / 2, y + cardH / 2 + 1);
          ctx.globalAlpha = 1;

          ctx.fillStyle = sym.color;
          ctx.globalAlpha = card.matched ? 0.35 : 0.85;
          ctx.beginPath();
          ctx.arc(
            x + cardW / 2,
            y + cardH * 0.78,
            Math.max(3, cardW * 0.07),
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          const g = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
          g.addColorStop(0, isHover ? "#1a4a32" : "#0c281c");
          g.addColorStop(1, isHover ? "#0f3022" : "#061810");
          ctx.fillStyle = g;
          roundRect(ctx, x, y, cardW, cardH, radius);
          ctx.fill();
          ctx.strokeStyle = isHover
            ? "rgba(51,255,102,0.7)"
            : "rgba(51,255,102,0.35)";
          ctx.lineWidth = 2;
          roundRect(ctx, x + 0.5, y + 0.5, cardW - 1, cardH - 1, radius);
          ctx.stroke();

          ctx.strokeStyle = "rgba(51,255,102,0.18)";
          ctx.lineWidth = 1;
          const m = Math.max(6, cardW * 0.18);
          ctx.beginPath();
          ctx.moveTo(x + cardW / 2, y + m);
          ctx.lineTo(x + cardW - m, y + cardH / 2);
          ctx.lineTo(x + cardW / 2, y + cardH - m);
          ctx.lineTo(x + m, y + cardH / 2);
          ctx.closePath();
          ctx.stroke();

          ctx.font = `bold ${Math.floor(cardW * 0.22)}px 'Courier New', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "rgba(51,255,102,0.35)";
          ctx.fillText("PL", x + cardW / 2, y + cardH / 2);
        }
      }
    }

    if (phase === "ready") {
      drawCenterText(
        ctx,
        ["MEMORY", "CLICK CARDS TO MATCH PAIRS", "P PAUSE"],
        w,
        h,
      );
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED", "P TO RESUME"], w, h, "#f4dfb4");
    } else if (phase === "win") {
      drawCenterText(
        ctx,
        ["MATCHED!", `SCORE ${score} · ${moves} MOVES`, "R OR RESTART"],
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
      layoutBoard();
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
      if (action === "pause") keys.pause = down;
      else if (action === "fire" && down) {
        if (phase === "win") fullReset();
      }
    },
    pointer: (kind, x, y) => {
      const idx = hitCard(x, y);
      if (kind === "move") {
        hover = idx;
        return;
      }
      if (kind === "down") {
        audio.resume();
        hover = idx;
        if (phase === "paused") return;
        if (phase === "win") {
          fullReset();
          return;
        }
        if (idx === null) return;
        flipCard(idx);
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
