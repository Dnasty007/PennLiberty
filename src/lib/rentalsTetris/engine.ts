/** Fixed-timestep classic Tetris simulation. */
import {
  ARR_MS,
  CLEAR_FLASH_MS,
  COLS,
  DAS_DELAY_MS,
  GRAVITY_MS,
  HARD_DROP_POINTS,
  HIGH_SCORE_KEY,
  LINE_SCORES,
  LINES_PER_LEVEL,
  ROWS,
  SOFT_DROP_POINTS,
  STEP_MS,
} from "./constants";
import {
  getShape,
  PIECE_COLOR_INDEX,
  PIECE_ORDER,
  spawnX,
  spawnY,
} from "./pieces";
import type { ActivePiece, GameState, Phase, PieceId } from "./types";

export type KeyAction =
  | "left"
  | "right"
  | "soft"
  | "hard"
  | "rotCW"
  | "rotCCW"
  | "pause";

export type EngineCallbacks = {
  onPhaseChange?: (phase: Phase, state: GameState) => void;
  onLineClear?: (count: number) => void;
  onLock?: () => void;
  onRotate?: () => void;
  onMove?: () => void;
};

export function loadHighScore(): number {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    /* private mode */
  }
}

function emptyBoard(): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function shuffleBag(): PieceId[] {
  const bag = [...PIECE_ORDER];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = bag[i]!;
    bag[i] = bag[j]!;
    bag[j] = t;
  }
  return bag;
}

function gravityForLevel(level: number): number {
  const i = Math.min(level, GRAVITY_MS.length - 1);
  return GRAVITY_MS[i]!;
}

function cellsOf(piece: ActivePiece): { x: number; y: number }[] {
  const shape = getShape(piece.id, piece.rot);
  const out: { x: number; y: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (shape[r]![c]) out.push({ x: piece.x + c, y: piece.y + r });
    }
  }
  return out;
}

function fits(board: number[][], piece: ActivePiece): boolean {
  for (const { x, y } of cellsOf(piece)) {
    if (x < 0 || x >= COLS || y >= ROWS) return false;
    if (y < 0) continue;
    if (board[y]![x]) return false;
  }
  return true;
}

function lockPiece(state: GameState) {
  const p = state.active;
  if (!p) return;
  const color = PIECE_COLOR_INDEX[p.id];
  for (const { x, y } of cellsOf(p)) {
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      state.board[y]![x] = color;
    }
  }
  state.active = null;
}

function findFullRows(board: number[][]): number[] {
  const rows: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    if (board[r]!.every((c) => c !== 0)) rows.push(r);
  }
  return rows;
}

function collapseRows(board: number[][], rows: number[]) {
  if (!rows.length) return;
  const kill = new Set(rows);
  const kept: number[][] = [];
  for (let r = 0; r < ROWS; r++) {
    if (!kill.has(r)) kept.push(board[r]!);
  }
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(0));
  for (let r = 0; r < ROWS; r++) board[r] = kept[r]!;
}

function nextFromBag(state: GameState): PieceId {
  if (state.bag.length === 0) state.bag = shuffleBag();
  return state.bag.pop()!;
}

function spawnPiece(state: GameState): boolean {
  const id = state.next;
  state.next = nextFromBag(state);
  const piece: ActivePiece = {
    id,
    rot: 0,
    x: spawnX(id),
    y: spawnY(),
  };
  if (!fits(state.board, piece)) {
    state.active = piece;
    return false; // topped out
  }
  state.active = piece;
  state.dropTimer = gravityForLevel(state.level);
  return true;
}

export function ghostY(state: GameState): number | null {
  if (!state.active) return null;
  let ghost = { ...state.active };
  while (fits(state.board, { ...ghost, y: ghost.y + 1 })) {
    ghost = { ...ghost, y: ghost.y + 1 };
  }
  return ghost.y;
}

export class TetrisEngine {
  state: GameState;
  private cb: EngineCallbacks;
  private accumulator = 0;
  private readonly maxFrame = 250;

  constructor(width: number, height: number, cb: EngineCallbacks = {}) {
    this.cb = cb;
    this.state = this.fresh(width, height, loadHighScore());
  }

  private fresh(width: number, height: number, highScore: number): GameState {
    const bag = shuffleBag();
    const first = bag.pop()!;
    return {
      phase: "ready",
      score: 0,
      highScore,
      level: 0,
      lines: 0,
      board: emptyBoard(),
      active: null,
      next: first,
      bag,
      dropTimer: gravityForLevel(0),
      softDrop: false,
      clearingRows: [],
      phaseTimer: 5000,
      width,
      height,
      keys: {
        left: false,
        right: false,
        soft: false,
        hard: false,
        rotCW: false,
        rotCCW: false,
      },
      edge: {
        left: false,
        right: false,
        hard: false,
        rotCW: false,
        rotCCW: false,
      },
      moveRepeat: 0,
      moveDir: 0,
    };
  }

  getState(): GameState {
    return this.state;
  }

  setKey(action: KeyAction, down: boolean) {
    const s = this.state;
    if (action === "pause") {
      if (down) this.togglePause();
      return;
    }
    if (action === "left") {
      if (down && !s.keys.left) s.edge.left = true;
      s.keys.left = down;
      if (!down && s.moveDir === -1) s.moveDir = 0;
    } else if (action === "right") {
      if (down && !s.keys.right) s.edge.right = true;
      s.keys.right = down;
      if (!down && s.moveDir === 1) s.moveDir = 0;
    } else if (action === "soft") {
      s.keys.soft = down;
      s.softDrop = down;
    } else if (action === "hard") {
      if (down && !s.keys.hard) s.edge.hard = true;
      s.keys.hard = down;
    } else if (action === "rotCW") {
      if (down && !s.keys.rotCW) s.edge.rotCW = true;
      s.keys.rotCW = down;
    } else if (action === "rotCCW") {
      if (down && !s.keys.rotCCW) s.edge.rotCCW = true;
      s.keys.rotCCW = down;
    }
  }

  togglePause() {
    if (this.state.phase === "playing") this.setPhase("paused");
    else if (this.state.phase === "paused") this.setPhase("playing");
  }

  restart() {
    const { width, height } = this.state;
    this.state = this.fresh(width, height, loadHighScore());
    this.accumulator = 0;
    this.cb.onPhaseChange?.(this.state.phase, this.state);
  }

  setBounds(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.state.width = width;
    this.state.height = height;
  }

  update(realDtMs: number) {
    this.accumulator += Math.min(realDtMs, this.maxFrame);
    while (this.accumulator >= STEP_MS) {
      this.tick(STEP_MS);
      this.accumulator -= STEP_MS;
    }
  }

  private setPhase(phase: Phase) {
    if (this.state.phase === phase) return;
    this.state.phase = phase;
    if (phase === "over" && this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      saveHighScore(this.state.highScore);
    }
    this.cb.onPhaseChange?.(phase, this.state);
  }

  private tick(stepMs: number) {
    const s = this.state;

    switch (s.phase) {
      case "ready":
        s.phaseTimer -= stepMs;
        if (s.keys.hard || s.edge.hard || s.phaseTimer <= 0) {
          s.edge.hard = false;
          // Peek: first spawn uses next, then pulls another next
          if (!spawnPiece(s)) {
            this.setPhase("over");
          } else {
            this.setPhase("playing");
          }
        }
        break;

      case "playing":
        this.tickPlaying(stepMs);
        break;

      case "clearing":
        s.phaseTimer -= stepMs;
        if (s.phaseTimer <= 0) {
          collapseRows(s.board, s.clearingRows);
          s.clearingRows = [];
          if (!spawnPiece(s)) this.setPhase("over");
          else this.setPhase("playing");
        }
        break;

      case "paused":
      case "over":
        break;
    }
  }

  private tickPlaying(stepMs: number) {
    const s = this.state;
    if (!s.active) return;

    // Horizontal DAS
    this.handleMove(stepMs);
    // Rotations (edge)
    if (s.edge.rotCW) {
      s.edge.rotCW = false;
      this.tryRotate(1);
    }
    if (s.edge.rotCCW) {
      s.edge.rotCCW = false;
      this.tryRotate(-1);
    }
    // Hard drop
    if (s.edge.hard) {
      s.edge.hard = false;
      this.hardDrop();
      return;
    }

    // Gravity / soft drop
    const soft = s.softDrop;
    const interval = soft
      ? Math.min(50, gravityForLevel(s.level) / 8)
      : gravityForLevel(s.level);
    s.dropTimer -= stepMs;
    if (s.dropTimer <= 0) {
      s.dropTimer += interval;
      if (!this.tryShift(0, 1)) {
        this.lockAndResolve();
      } else if (soft) {
        s.score += SOFT_DROP_POINTS;
      }
    }
  }

  private handleMove(stepMs: number) {
    const s = this.state;
    const left = s.keys.left;
    const right = s.keys.right;

    if (s.edge.left) {
      s.edge.left = false;
      if (this.tryShift(-1, 0)) this.cb.onMove?.();
      s.moveDir = -1;
      s.moveRepeat = DAS_DELAY_MS;
      return;
    }
    if (s.edge.right) {
      s.edge.right = false;
      if (this.tryShift(1, 0)) this.cb.onMove?.();
      s.moveDir = 1;
      s.moveRepeat = DAS_DELAY_MS;
      return;
    }

    const dir = left && !right ? -1 : right && !left ? 1 : 0;
    if (dir === 0) {
      s.moveDir = 0;
      return;
    }
    if (s.moveDir !== dir) {
      s.moveDir = dir as -1 | 1;
      s.moveRepeat = DAS_DELAY_MS;
      return;
    }
    s.moveRepeat -= stepMs;
    if (s.moveRepeat <= 0) {
      if (this.tryShift(dir, 0)) this.cb.onMove?.();
      s.moveRepeat += ARR_MS;
    }
  }

  private tryShift(dx: number, dy: number): boolean {
    const s = this.state;
    if (!s.active) return false;
    const next = { ...s.active, x: s.active.x + dx, y: s.active.y + dy };
    if (!fits(s.board, next)) return false;
    s.active = next;
    return true;
  }

  private tryRotate(dir: 1 | -1) {
    const s = this.state;
    if (!s.active || s.active.id === "O") return;
    const rot = (((s.active.rot + dir) % 4) + 4) % 4;
    // Simple wall kicks: try 0, ±1, ±2 columns
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      const next = { ...s.active, rot, x: s.active.x + k };
      if (fits(s.board, next)) {
        s.active = next;
        this.cb.onRotate?.();
        return;
      }
    }
  }

  private hardDrop() {
    const s = this.state;
    if (!s.active) return;
    let dropped = 0;
    while (this.tryShift(0, 1)) dropped += 1;
    s.score += dropped * HARD_DROP_POINTS;
    this.lockAndResolve();
  }

  private lockAndResolve() {
    const s = this.state;
    lockPiece(s);
    this.cb.onLock?.();

    const full = findFullRows(s.board);
    if (full.length > 0) {
      s.clearingRows = full;
      const n = full.length as 1 | 2 | 3 | 4;
      const base = LINE_SCORES[n] ?? 0;
      s.score += base * (s.level + 1);
      s.lines += full.length;
      s.level = Math.floor(s.lines / LINES_PER_LEVEL);
      s.phaseTimer = CLEAR_FLASH_MS;
      this.cb.onLineClear?.(full.length);
      this.setPhase("clearing");
      return;
    }

    if (!spawnPiece(s)) this.setPhase("over");
  }
}

export { cellsOf, fits };
