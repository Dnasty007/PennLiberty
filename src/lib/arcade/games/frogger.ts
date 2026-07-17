/**
 * Classic Frogger-style crossing for Penn Liberty Rentals arcade.
 * Grid hop across traffic · 3 lives · goal rows for score.
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

const HS_KEY = "pl-arcade-frogger-hs";
const COLS = 11;
const ROWS = 13; // 0 = goal, 1-5 cars, 6 mid, 7-11 cars, 12 start
const LIVES_START = 3;
const MOVE_COOLDOWN = 0.12;
const GOAL_SLOTS = 5;

type Car = {
  row: number;
  x: number; // in cell units (0..COLS)
  w: number; // width in cells
  speed: number; // cells/sec (signed)
  color: string;
};

const ROW_KIND: ("goal" | "road" | "safe" | "start")[] = [
  "goal",
  "road",
  "road",
  "road",
  "road",
  "road",
  "safe",
  "road",
  "road",
  "road",
  "road",
  "road",
  "start",
];

const CAR_COLORS = ["#ff5555", "#f4dfb4", "#5ec8ff", "#ff88cc", "#ffaa44", "#aaffaa"];

export function createGame(opts: CreateClassicOpts): ClassicController {
  const { canvas, onPhaseChange, onHud } = opts;
  const audio = new BeepAudio();
  audio.resume();

  let phase: Phase = "ready";
  let score = 0;
  let highScore = loadHs(HS_KEY);
  let lives = LIVES_START;
  let muted = false;
  let level = 1;
  let moveCd = 0;
  let deathFlash = 0;
  let hopAnim = 0;

  let frogC = Math.floor(COLS / 2);
  let frogR = ROWS - 1;
  let farthest = frogR;
  const goalsFilled: boolean[] = Array(GOAL_SLOTS).fill(false);

  let cars: Car[] = [];

  let W = 320;
  let H = 240;
  let cellW = 28;
  let cellH = 18;
  let ox = 0;
  let oy = 0;

  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  const edge = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  const hud = (): HudInfo => ({
    score,
    highScore,
    extra: `L${level} · ♥${lives}`,
  });

  const emitPhase = () => onPhaseChange?.(phase, hud());
  const emitHud = () => onHud?.(hud());

  const commitScore = () => {
    if (score > highScore) {
      highScore = score;
      saveHs(HS_KEY, highScore);
    }
    emitHud();
  };

  const layout = () => {
    cellW = Math.floor(W / COLS);
    cellH = Math.floor((H - 48) / ROWS);
    const boardW = cellW * COLS;
    const boardH = cellH * ROWS;
    ox = Math.floor((W - boardW) / 2);
    oy = 44 + Math.floor((H - 48 - boardH) / 2);
  };

  const spawnCars = () => {
    cars = [];
    const speedBase = 1.4 + (level - 1) * 0.22;
    for (let row = 0; row < ROWS; row++) {
      if (ROW_KIND[row] !== "road") continue;
      const dir = row % 2 === 0 ? 1 : -1;
      const speed = dir * (speedBase + (row % 3) * 0.35 + rand(0, 0.4));
      const count = row < 6 ? 3 : 2 + (row % 2);
      const gap = COLS / count;
      const w = row % 3 === 0 ? 2 : 1.4;
      for (let i = 0; i < count; i++) {
        cars.push({
          row,
          x: i * gap + rand(0, gap * 0.3),
          w,
          speed,
          color: CAR_COLORS[(row + i) % CAR_COLORS.length],
        });
      }
    }
  };

  const resetFrog = () => {
    frogC = Math.floor(COLS / 2);
    frogR = ROWS - 1;
    farthest = frogR;
    moveCd = 0.2;
    hopAnim = 0;
  };

  const startPlay = () => {
    score = 0;
    lives = LIVES_START;
    level = 1;
    goalsFilled.fill(false);
    phase = "playing";
    resetFrog();
    spawnCars();
    deathFlash = 0;
    emitPhase();
    emitHud();
    audio.blip(520);
  };

  const nextLevel = () => {
    level += 1;
    goalsFilled.fill(false);
    score += 500;
    commitScore();
    audio.win();
    spawnCars();
    resetFrog();
  };

  const die = () => {
    audio.die();
    lives -= 1;
    deathFlash = 0.4;
    if (lives <= 0) {
      phase = "over";
      commitScore();
      emitPhase();
      return;
    }
    resetFrog();
    emitHud();
  };

  const tryMove = (dc: number, dr: number) => {
    if (phase !== "playing" || moveCd > 0) return;
    const nc = clamp(frogC + dc, 0, COLS - 1);
    const nr = clamp(frogR + dr, 0, ROWS - 1);
    if (nc === frogC && nr === frogR) return;
    frogC = nc;
    frogR = nr;
    moveCd = MOVE_COOLDOWN;
    hopAnim = 0.1;
    audio.blip(340 + (ROWS - frogR) * 18);

    if (frogR < farthest) {
      farthest = frogR;
      score += 10;
      commitScore();
    }

    // goal row
    if (frogR === 0) {
      const slot = Math.floor((frogC / COLS) * GOAL_SLOTS);
      const slotC = Math.floor((slot + 0.5) * (COLS / GOAL_SLOTS));
      // must land near a goal pad
      if (Math.abs(frogC - slotC) <= 1 && !goalsFilled[slot]) {
        goalsFilled[slot] = true;
        score += 200;
        commitScore();
        audio.score();
        if (goalsFilled.every(Boolean)) {
          nextLevel();
        } else {
          resetFrog();
        }
      } else {
        // missed pad / already filled
        die();
      }
    }
  };

  const carHitsFrog = (c: Car): boolean => {
    if (c.row !== frogR) return false;
    const fx = frogC + 0.5;
    const period = COLS + 4;
    for (const off of [0, period, -period]) {
      const left = c.x + off;
      const right = left + c.w;
      if (fx > left + 0.12 && fx < right - 0.12) return true;
    }
    return false;
  };

  const tick = (dtMs: number) => {
    const dt = dtMs / 1000;
    if (moveCd > 0) moveCd -= dt;
    if (deathFlash > 0) deathFlash -= dt;
    if (hopAnim > 0) hopAnim -= dt;

    if (phase !== "playing") return;

    // edge-triggered hop
    if (edge.left) {
      edge.left = false;
      tryMove(-1, 0);
    }
    if (edge.right) {
      edge.right = false;
      tryMove(1, 0);
    }
    if (edge.up) {
      edge.up = false;
      tryMove(0, -1);
    }
    if (edge.down) {
      edge.down = false;
      tryMove(0, 1);
    }

    const period = COLS + 4;
    for (const c of cars) {
      c.x += c.speed * dt;
      if (c.x > COLS + 2) c.x -= period;
      if (c.x < -c.w - 2) c.x += period;
    }

    if (ROW_KIND[frogR] === "road") {
      for (const c of cars) {
        if (carHitsFrog(c)) {
          die();
          break;
        }
      }
    }
  };

  const paint = (ctx: CanvasRenderingContext2D) => {
    drawCrtPlate(ctx, W, H);
    layout();

    const boardW = cellW * COLS;
    const boardH = cellH * ROWS;

    // board background
    for (let r = 0; r < ROWS; r++) {
      const y = oy + r * cellH;
      const kind = ROW_KIND[r];
      if (kind === "goal") ctx.fillStyle = "#0a3d28";
      else if (kind === "safe" || kind === "start") ctx.fillStyle = "#143d22";
      else ctx.fillStyle = r % 2 === 0 ? "#1a1a1a" : "#121212";
      ctx.fillRect(ox, y, boardW, cellH);

      // lane markers on road
      if (kind === "road") {
        ctx.strokeStyle = "rgba(255,255,200,0.12)";
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.moveTo(ox + 4, y + cellH - 1);
        ctx.lineTo(ox + boardW - 4, y + cellH - 1);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // goal pads
    for (let s = 0; s < GOAL_SLOTS; s++) {
      const cx = ox + ((s + 0.5) * boardW) / GOAL_SLOTS;
      const padW = cellW * 1.4;
      ctx.fillStyle = goalsFilled[s] ? "#33ff66" : "#1a6640";
      ctx.fillRect(cx - padW / 2, oy + 2, padW, cellH - 4);
      if (goalsFilled[s]) {
        ctx.fillStyle = "#0a2010";
        ctx.font = `bold ${Math.max(10, cellH - 6)}px 'Courier New', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("★", cx, oy + cellH / 2);
      }
    }

    // cars — draw primary + wrap ghosts so edges stay continuous
    const period = COLS + 4;
    for (const c of cars) {
      const y = oy + c.row * cellH + 2;
      const ch = cellH - 4;
      for (const off of [0, period, -period]) {
        const xCells = c.x + off;
        if (xCells + c.w < -1 || xCells > COLS + 1) continue;
        const x = ox + xCells * cellW;
        const ww = c.w * cellW;
        ctx.fillStyle = c.color;
        ctx.fillRect(x, y, ww, ch);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x + 2, y + 2, Math.max(2, ww - 4), 3);
        ctx.fillStyle = "#fff8c0";
        if (c.speed > 0) ctx.fillRect(x + ww - 4, y + ch * 0.3, 3, ch * 0.4);
        else ctx.fillRect(x + 1, y + ch * 0.3, 3, ch * 0.4);
      }
    }

    // frog
    if (phase !== "over" || deathFlash > 0) {
      const bob = hopAnim > 0 ? -3 : 0;
      const fx = ox + frogC * cellW + cellW / 2;
      const fy = oy + frogR * cellH + cellH / 2 + bob;
      const s = Math.min(cellW, cellH) * 0.38;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.fillStyle = deathFlash > 0 ? "#ff4444" : "#33ff66";
      // body
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      // eyes
      ctx.fillStyle = "#e8ffe8";
      ctx.beginPath();
      ctx.arc(-s * 0.35, -s * 0.35, s * 0.28, 0, Math.PI * 2);
      ctx.arc(s * 0.35, -s * 0.35, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0a2010";
      ctx.beginPath();
      ctx.arc(-s * 0.35, -s * 0.35, s * 0.12, 0, Math.PI * 2);
      ctx.arc(s * 0.35, -s * 0.35, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // border
    ctx.strokeStyle = "rgba(51,255,102,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, boardW - 1, boardH - 1);

    drawHudBar(ctx, "FROGGER", score, highScore, W, `L${level}  ♥${lives}`);

    if (phase === "ready") {
      drawCenterText(
        ctx,
        ["FROGGER", "ARROWS / WASD TO HOP", "REACH ALL ★ PADS", "PRESS SPACE TO START"],
        W,
        H,
      );
    } else if (phase === "paused") {
      drawCenterText(ctx, ["PAUSED", "P OR ESC TO RESUME"], W, H, "#f4dfb4");
    } else if (phase === "over") {
      drawCenterText(
        ctx,
        ["GAME OVER", `SCORE ${String(score).padStart(5, "0")}`, "SPACE TO RESTART"],
        W,
        H,
        "#ff8888",
      );
    }
  };

  const loop = bootLoop(
    canvas,
    tick,
    paint,
    (w, h) => {
      W = w;
      H = h;
      layout();
    },
  );

  emitPhase();
  emitHud();

  const pressDir = (dir: "left" | "right" | "up" | "down", down: boolean) => {
    if (down && !keys[dir]) edge[dir] = true;
    keys[dir] = down;
  };

  return {
    setKey: (action, down) => {
      if (action === "left") pressDir("left", down);
      else if (action === "right") pressDir("right", down);
      else if (action === "up") pressDir("up", down);
      else if (action === "down") pressDir("down", down);
      else if (action === "fire" && down && (phase === "ready" || phase === "over")) {
        startPlay();
      } else if (action === "pause" && down) {
        if (phase === "playing") {
          phase = "paused";
          emitPhase();
        } else if (phase === "paused") {
          phase = "playing";
          emitPhase();
        }
      }
    },
    togglePause: () => {
      if (phase === "playing") {
        phase = "paused";
        emitPhase();
      } else if (phase === "paused") {
        phase = "playing";
        emitPhase();
      }
    },
    toggleMute: () => {
      muted = !muted;
      audio.setMuted(muted);
      return muted;
    },
    restart: () => startPlay(),
    unlockAudio: () => audio.resume(),
    dispose: () => {
      loop.dispose();
      audio.dispose();
    },
  };
}
