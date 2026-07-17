/**
 * Classic Snake for Penn Liberty Arcade.
 * Grid movement · die on wall/self · grow on food · speed up.
 */
import {
  BeepAudio,
  bootLoop,
  clamp,
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

const HS_KEY = "pl-arcade-snake-hs";
const TITLE = "SNAKE";
const GRID_TARGET = 20;
const TOP_UI = 48;
const BASE_STEP_MS = 140;
const MIN_STEP_MS = 55;

type Dir = "left" | "right" | "up" | "down";
type Cell = { x: number; y: number };

type Keys = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  fire: boolean;
  pause: boolean;
};

const OPPOSITE: Record<Dir, Dir> = {
  left: "right",
  right: "left",
  up: "down",
  down: "up",
};

const DIR_DELTA: Record<Dir, Cell> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

function cellsEqual(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function createGame(opts: CreateClassicOpts): ClassicController {
  const { canvas, onPhaseChange, onHud } = opts;
  const audio = new BeepAudio();
  audio.resume();

  let muted = false;
  let phase: Phase = "ready";
  let score = 0;
  let highScore = loadHs(HS_KEY);
  let foodsEaten = 0;
  let w = 320;
  let h = 240;

  let cols = GRID_TARGET;
  let rows = GRID_TARGET;
  let cell = 14;
  let originX = 0;
  let originY = TOP_UI;
  let boardW = 0;
  let boardH = 0;

  let snake: Cell[] = [];
  let dir: Dir = "right";
  let pendingDir: Dir | null = null;
  let food: Cell = { x: 0, y: 0 };
  let accum = 0;
  let fireWasDown = false;
  let pauseWasDown = false;
  const edgeKeys: Record<Dir, boolean> = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  const keys: Keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    pause: false,
  };

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: `LEN ${snake.length}`,
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
    const availW = Math.max(80, w - 16);
    const availH = Math.max(80, h - TOP_UI - 12);
    cell = Math.max(8, Math.floor(Math.min(availW, availH) / GRID_TARGET));
    cols = Math.max(10, Math.floor(availW / cell));
    rows = Math.max(10, Math.floor(availH / cell));
    boardW = cols * cell;
    boardH = rows * cell;
    originX = Math.floor((w - boardW) / 2);
    originY = TOP_UI + Math.floor((h - TOP_UI - 8 - boardH) / 2);
  };

  const randomEmptyCell = (): Cell => {
    const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
    const free: Cell[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!occupied.has(`${x},${y}`)) free.push({ x, y });
      }
    }
    if (free.length === 0) return { x: 0, y: 0 };
    return free[Math.floor(Math.random() * free.length)]!;
  };

  const spawnFood = () => {
    food = randomEmptyCell();
  };

  const resetSnake = () => {
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    dir = "right";
    pendingDir = null;
    foodsEaten = 0;
    score = 0;
    accum = 0;
    spawnFood();
  };

  const fullReset = () => {
    fireWasDown = false;
    pauseWasDown = false;
    layoutGrid();
    resetSnake();
    maybeHs();
    setPhase("ready");
    emitHud();
  };

  const stepMs = () =>
    Math.max(MIN_STEP_MS, BASE_STEP_MS - foodsEaten * 4);

  const tryQueueDir = (d: Dir) => {
    // never reverse into self in one frame (vs current or pending)
    const against = pendingDir ?? dir;
    if (d === OPPOSITE[against]) return;
    if (d === against) return;
    pendingDir = d;
  };

  const pollDirectionEdges = () => {
    const order: Dir[] = ["up", "down", "left", "right"];
    for (const d of order) {
      const down = keys[d];
      if (down && !edgeKeys[d]) tryQueueDir(d);
      edgeKeys[d] = down;
    }
  };

  const die = () => {
    audio.die();
    maybeHs();
    setPhase("over");
    emitHud();
  };

  const step = () => {
    if (pendingDir) {
      if (pendingDir !== OPPOSITE[dir]) dir = pendingDir;
      pendingDir = null;
    }
    const d = DIR_DELTA[dir];
    const head = snake[0]!;
    const next: Cell = { x: head.x + d.x, y: head.y + d.y };

    // wall = death (classic)
    if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows) {
      die();
      return;
    }

    // self collision (allow tail cell if we will move off it without growing)
    const willGrow = cellsEqual(next, food);
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i]!;
      if (!cellsEqual(s, next)) continue;
      if (!willGrow && i === snake.length - 1) continue;
      die();
      return;
    }

    snake.unshift(next);
    if (willGrow) {
      foodsEaten += 1;
      score = foodsEaten * 10;
      maybeHs();
      audio.score();
      spawnFood();
      emitHud();
    } else {
      snake.pop();
      audio.blip(180 + Math.min(foodsEaten, 20) * 8);
    }
  };

  const beginPlay = () => {
    if (phase === "over") {
      resetSnake();
    }
    accum = 0;
    setPhase("playing");
    audio.blip(520);
    emitHud();
  };

  const update = (dtMs: number) => {
    pollDirectionEdges();

    if (keys.pause && !pauseWasDown) {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    }
    pauseWasDown = keys.pause;

    if (phase === "ready" || phase === "over") {
      const fireEdge = keys.fire && !fireWasDown;
      fireWasDown = keys.fire;
      // also start on any direction press
      const dirStart =
        keys.left || keys.right || keys.up || keys.down;
      if (fireEdge || (phase === "ready" && dirStart)) {
        if (phase === "over" && fireEdge) {
          fullReset();
          beginPlay();
        } else if (phase === "ready") {
          beginPlay();
        }
      }
      return;
    }
    fireWasDown = keys.fire;

    if (phase !== "playing") return;

    accum += dtMs;
    const interval = stepMs();
    while (accum >= interval) {
      accum -= interval;
      step();
      if (phase !== "playing") break;
    }
  };

  const cellRect = (c: Cell) => ({
    x: originX + c.x * cell,
    y: originY + c.y * cell,
    s: cell - 1,
  });

  const render = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, w, h);
    drawHudBar(ctx, TITLE, score, highScore, w, `LEN ${snake.length}`);

    // board plate
    ctx.fillStyle = "rgba(0,20,12,0.65)";
    ctx.fillRect(originX - 2, originY - 2, boardW + 4, boardH + 4);
    ctx.strokeStyle = "rgba(51,255,102,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(originX - 2.5, originY - 2.5, boardW + 5, boardH + 5);

    // faint grid
    ctx.strokeStyle = "rgba(51,255,102,0.06)";
    ctx.beginPath();
    for (let x = 0; x <= cols; x++) {
      const px = originX + x * cell;
      ctx.moveTo(px, originY);
      ctx.lineTo(px, originY + boardH);
    }
    for (let y = 0; y <= rows; y++) {
      const py = originY + y * cell;
      ctx.moveTo(originX, py);
      ctx.lineTo(originX + boardW, py);
    }
    ctx.stroke();

    // food
    {
      const r = cellRect(food);
      ctx.fillStyle = "#ff6688";
      ctx.shadowColor = "#ff4466";
      ctx.shadowBlur = 10;
      ctx.fillRect(r.x + 1, r.y + 1, r.s - 1, r.s - 1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(r.x + 2, r.y + 2, Math.max(1, r.s / 3), Math.max(1, r.s / 3));
    }

    // snake
    for (let i = snake.length - 1; i >= 0; i--) {
      const r = cellRect(snake[i]!);
      const t = i === 0 ? 1 : 0.45 + (1 - i / snake.length) * 0.45;
      ctx.fillStyle =
        i === 0
          ? "#33ff66"
          : `rgba(51,255,102,${clamp(t, 0.35, 0.9).toFixed(2)})`;
      if (i === 0) {
        ctx.shadowColor = "#33ff66";
        ctx.shadowBlur = 8;
      }
      ctx.fillRect(r.x, r.y, r.s, r.s);
      ctx.shadowBlur = 0;
      if (i === 0) {
        ctx.fillStyle = "rgba(232,255,232,0.5)";
        ctx.fillRect(r.x + 2, r.y + 2, Math.max(1, r.s - 4), 2);
      }
    }

    if (phase === "ready") {
      drawCenterText(
        ctx,
        ["SNAKE", "ARROWS / WASD TO START", "P PAUSE · DON'T HIT WALLS"],
        w,
        h,
      );
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED", "P TO RESUME"], w, h, "#f4dfb4");
    } else if (phase === "over") {
      drawCenterText(
        ctx,
        ["GAME OVER", `SCORE ${score}`, "SPACE / R TO RETRY"],
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
      const prevCols = cols;
      const prevRows = rows;
      layoutGrid();
      // clamp entities if grid shrank
      if (cols !== prevCols || rows !== prevRows) {
        snake = snake.map((c) => ({
          x: clamp(c.x, 0, cols - 1),
          y: clamp(c.y, 0, rows - 1),
        }));
        food = {
          x: clamp(food.x, 0, cols - 1),
          y: clamp(food.y, 0, rows - 1),
        };
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
      if (
        action === "left" ||
        action === "right" ||
        action === "up" ||
        action === "down"
      ) {
        keys[action] = down;
        if (down) {
          tryQueueDir(action);
          if (phase === "ready") beginPlay();
        }
      } else if (action === "fire") {
        keys.fire = down;
        if (down) {
          if (phase === "ready") beginPlay();
          else if (phase === "over") {
            fullReset();
            beginPlay();
          }
        }
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
