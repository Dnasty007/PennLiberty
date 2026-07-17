/**
 * Tron-style light-cycle duel for Penn Liberty Arcade.
 * You (green) vs AI (red) · leave a trail · don't crash.
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

const HS_KEY = "pl-arcade-tron-hs";
const TITLE = "LIGHT CYCLE";
const CELL = 8;

type Dir = "left" | "right" | "up" | "down";
type Pt = { x: number; y: number };

const DELTA: Record<Dir, Pt> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPP: Record<Dir, Dir> = {
  left: "right",
  right: "left",
  up: "down",
  down: "up",
};

type Bike = { x: number; y: number; dir: Dir; alive: boolean };

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
  let cols = 40;
  let rows = 24;
  let ox = 0;
  let oy = 48;
  let stepAcc = 0;
  let stepMs = 70;
  let round = 1;

  let you: Bike & { pending: Dir | null } = {
    x: 0,
    y: 0,
    dir: "right",
    alive: true,
    pending: null,
  };
  let cpu: Bike = { x: 0, y: 0, dir: "left", alive: true };
  let grid: number[][] = [];
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
  const keyEdge: Partial<Record<Dir, boolean>> = {};

  const hud = (): HudInfo => ({ score, highScore, extra: `R${round}` });
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

  const rebuildDims = () => {
    const playH = Math.max(80, h - 56);
    const playW = Math.max(80, w - 16);
    cols = Math.floor(playW / CELL);
    rows = Math.floor(playH / CELL);
    ox = Math.floor((w - cols * CELL) / 2);
    oy = 48 + Math.floor((playH - rows * CELL) / 2);
  };

  const free = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < cols && y < rows && grid[y]![x] === 0;

  const look = (x: number, y: number, d: Dir, n = 1) => {
    const dd = DELTA[d];
    return { x: x + dd.x * n, y: y + dd.y * n };
  };

  const spawn = () => {
    rebuildDims();
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    you = {
      x: Math.floor(cols * 0.25),
      y: Math.floor(rows / 2),
      dir: "right",
      alive: true,
      pending: null,
    };
    cpu = {
      x: Math.floor(cols * 0.75),
      y: Math.floor(rows / 2),
      dir: "left",
      alive: true,
    };
    grid[you.y]![you.x] = 1;
    grid[cpu.y]![cpu.x] = 2;
    stepAcc = 0;
    stepMs = Math.max(42, 75 - round * 2);
  };

  const softReset = () => {
    score = 0;
    round = 1;
    spawn();
    emitHud();
  };

  softReset();

  const cpuThink = () => {
    if (!cpu.alive) return;
    const options: Dir[] = ["up", "down", "left", "right"];
    const ranked = options
      .filter((d) => d !== OPP[cpu.dir])
      .map((d) => {
        let dist = 0;
        for (let i = 1; i < 14; i++) {
          const p = look(cpu.x, cpu.y, d, i);
          if (!free(p.x, p.y)) break;
          dist = i;
        }
        const towardYou =
          (d === "left" && you.x < cpu.x) ||
          (d === "right" && you.x > cpu.x) ||
          (d === "up" && you.y < cpu.y) ||
          (d === "down" && you.y > cpu.y)
            ? 0.6
            : 0;
        const straight = d === cpu.dir ? 1.4 : 0;
        return { d, score: dist + towardYou + straight };
      })
      .sort((a, b) => b.score - a.score);
    if (ranked[0] && ranked[0].score > 0) cpu.dir = ranked[0].d;
  };

  const stepBike = (bike: Bike, trail: 1 | 2) => {
    if (!bike.alive) return;
    const n = look(bike.x, bike.y, bike.dir);
    if (!free(n.x, n.y)) {
      bike.alive = false;
      audio.die();
      return;
    }
    bike.x = n.x;
    bike.y = n.y;
    grid[bike.y]![bike.x] = trail;
  };

  const tick = (dt: number) => {
    if (keys.pause && !pauseWas) {
      if (phase === "playing") setPhase("paused");
      else if (phase === "paused") setPhase("playing");
    }
    pauseWas = keys.pause;

    (["left", "right", "up", "down"] as Dir[]).forEach((d) => {
      if (keys[d] && !keyEdge[d]) {
        keyEdge[d] = true;
        if (you.alive && d !== OPP[you.dir]) you.pending = d;
      }
      if (!keys[d]) keyEdge[d] = false;
    });

    if (phase === "ready" || phase === "over") {
      if (keys.fire && !fireWas) {
        softReset();
        setPhase("playing");
      }
      fireWas = keys.fire;
      return;
    }
    if (phase !== "playing") {
      fireWas = keys.fire;
      return;
    }

    stepAcc += dt;
    while (stepAcc >= stepMs) {
      stepAcc -= stepMs;
      if (you.pending && you.pending !== OPP[you.dir]) {
        you.dir = you.pending;
        you.pending = null;
      }
      cpuThink();
      stepBike(you, 1);
      stepBike(cpu, 2);

      if (you.alive && cpu.alive && you.x === cpu.x && you.y === cpu.y) {
        you.alive = false;
        cpu.alive = false;
        audio.die();
      }

      if (!you.alive) {
        maybeHs();
        setPhase("over");
        break;
      }
      if (!cpu.alive) {
        score += 100 * round;
        round += 1;
        maybeHs();
        audio.score();
        emitHud();
        spawn();
        break;
      }
    }
  };

  const paint = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, w, h);
    drawHudBar(ctx, TITLE, score, highScore, w, `R${round}`);

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(ox - 2, oy - 2, cols * CELL + 4, rows * CELL + 4);
    ctx.strokeStyle = "rgba(51,255,102,0.35)";
    ctx.strokeRect(ox - 2, oy - 2, cols * CELL + 4, rows * CELL + 4);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = grid[r]![c]!;
        if (!v) continue;
        ctx.fillStyle = v === 1 ? "#33ff66" : "#ff4466";
        ctx.fillRect(ox + c * CELL, oy + r * CELL, CELL - 1, CELL - 1);
      }
    }

    if (you.alive) {
      ctx.fillStyle = "#e8ffe8";
      ctx.fillRect(ox + you.x * CELL, oy + you.y * CELL, CELL - 1, CELL - 1);
    }
    if (cpu.alive) {
      ctx.fillStyle = "#ffccdd";
      ctx.fillRect(ox + cpu.x * CELL, oy + cpu.y * CELL, CELL - 1, CELL - 1);
    }

    if (phase === "ready") {
      drawCenterText(ctx, ["LIGHT CYCLE", "ARROWS / WASD STEER", "SPACE START"], w, h);
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED"], w, h);
    } else if (phase === "over") {
      drawCenterText(ctx, ["CRASHED", `SCORE ${score}`, "SPACE RETRY"], w, h, "#ff6688");
    }
  };

  const loop = bootLoop(
    canvas,
    tick,
    paint,
    (nw, nh) => {
      w = nw;
      h = nh;
      if (phase !== "playing") spawn();
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
    pointer: (kind) => {
      if (kind === "down" && (phase === "ready" || phase === "over")) {
        softReset();
        setPhase("playing");
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
