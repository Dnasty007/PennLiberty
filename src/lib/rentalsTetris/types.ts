/** Classic Tetris types for the Rentals-hero arcade. */

export type Phase = "ready" | "playing" | "paused" | "clearing" | "over";

export type PieceId = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/** 4×4 rotation matrices; 1 = filled cell of the active piece. */
export type Shape = readonly (readonly number[])[];

export type ActivePiece = {
  id: PieceId;
  /** Rotation index 0–3 */
  rot: number;
  /** Column of shape origin (top-left of 4×4) */
  x: number;
  /** Row of shape origin */
  y: number;
};

export type GameState = {
  phase: Phase;
  score: number;
  highScore: number;
  level: number;
  lines: number;
  /** 10×22 board (rows 0–1 hidden buffer); 0 empty, else color index 1–7 */
  board: number[][];
  active: ActivePiece | null;
  /** Next piece id */
  next: PieceId;
  /** Bag randomizer remaining */
  bag: PieceId[];
  /** Gravity timer ms */
  dropTimer: number;
  /** Soft-drop held */
  softDrop: boolean;
  /** Line-clear flash: rows being cleared */
  clearingRows: number[];
  phaseTimer: number;
  width: number;
  height: number;
  keys: {
    left: boolean;
    right: boolean;
    soft: boolean;
    hard: boolean;
    rotCW: boolean;
    rotCCW: boolean;
  };
  /** Edge-trigger locks so holds don't spam */
  edge: {
    left: boolean;
    right: boolean;
    hard: boolean;
    rotCW: boolean;
    rotCCW: boolean;
  };
  /** DAS / move repeat timers */
  moveRepeat: number;
  moveDir: -1 | 0 | 1;
};
