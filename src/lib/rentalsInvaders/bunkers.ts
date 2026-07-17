/**
 * Classic Space Invaders destructible bunkers (Taito 1978).
 * Four house-shaped pixel grids above the player; bullets and marching
 * invaders carve individual blocks.
 */
import { BUNKER } from "./constants";
import type { Bunker, BunkerBlock, Bullet, Invader } from "./types";

/**
 * Classic house silhouette (22×16), '#' filled, '.' empty.
 * Open underside so the player can tuck under the "legs".
 * Every row is exactly 22 chars.
 */
const SILHOUETTE: readonly string[] = [
  ".......########.......", // 7+8+7
  "......##########......", // 6+10+6
  ".....############.....", // 5+12+5
  "....##############....", // 4+14+4
  "...################...", // 3+16+3
  "..##################..", // 2+18+2
  ".####################.", // 1+20+1
  "######################", // 22
  "######################",
  "######################",
  "#####............#####", // 5+12+5 open underside
  "#####............#####",
  "#####............#####",
  "#####............#####",
  "#####............#####",
  "#####............#####",
];

/** Half-extent of a bunker block used for AABB collision (center-anchored). */
export function bunkerCellSize(playfieldWidth: number): number {
  return Math.max(2.5, BUNKER.cellAt720 * (playfieldWidth / 720));
}

function buildBlocks(
  originX: number,
  originY: number,
  cell: number,
): BunkerBlock[] {
  const blocks: BunkerBlock[] = [];
  const rows = SILHOUETTE.length;
  const cols = SILHOUETTE[0]!.length;

  for (let r = 0; r < rows; r++) {
    const line = SILHOUETTE[r]!;
    for (let c = 0; c < cols; c++) {
      if (line[c] !== "#") continue;
      blocks.push({
        x: originX + (c + 0.5) * cell,
        y: originY + (r + 0.5) * cell,
        alive: true,
      });
    }
  }
  return blocks;
}

/**
 * Spawn four evenly spaced bunkers in the lower third of the playfield,
 * sitting above the player. Call on wave start / restart.
 */
export function spawnBunkers(
  width: number,
  height: number,
  playerY: number,
): Bunker[] {
  const cell = bunkerCellSize(width);
  const cols = SILHOUETTE[0]!.length;
  const rows = SILHOUETTE.length;
  const bunkerW = cols * cell;
  const bunkerH = rows * cell;

  // Center bunkers horizontally with equal gutters.
  const count = BUNKER.count;
  const marginX = width * 0.08;
  const usable = width - marginX * 2 - bunkerW;
  const gap = count > 1 ? usable / (count - 1) : 0;

  // Bottom of bunker sits abovePlayer px above player center.
  const bottomY = playerY - BUNKER.abovePlayer;
  const originY = bottomY - bunkerH;

  const bunkers: Bunker[] = [];
  for (let i = 0; i < count; i++) {
    const originX = marginX + i * gap;
    bunkers.push({ blocks: buildBlocks(originX, originY, cell) });
  }

  // height unused for layout but kept for a stable API signature.
  void height;
  return bunkers;
}

/** Scale bunker centers when the canvas resizes (setBounds). */
export function scaleBunkers(
  bunkers: Bunker[],
  sx: number,
  sy: number,
): void {
  for (const bunker of bunkers) {
    for (const block of bunker.blocks) {
      block.x *= sx;
      block.y *= sy;
    }
  }
}

/**
 * If the bullet overlaps any alive block, destroy that block (and optionally
 * a small splash of neighbors for chunkier damage) and return true.
 * Caller should consume the bullet when true.
 */
export function damageBunkerAtBullet(
  bunkers: Bunker[],
  bullet: Bullet,
  cell: number,
): boolean {
  const half = cell * 0.55;
  for (const bunker of bunkers) {
    for (const block of bunker.blocks) {
      if (!block.alive) continue;
      if (
        Math.abs(bullet.x - block.x) <= half + 1.5 &&
        Math.abs(bullet.y - block.y) <= half + 4
      ) {
        carveAround(bunker, block.x, block.y, cell, 1.15);
        return true;
      }
    }
  }
  return false;
}

/**
 * Invaders marching through bunkers carve blocks they overlap
 * (classic SI behavior as the formation descends).
 */
export function carveBunkersByInvaders(
  bunkers: Bunker[],
  invaders: Invader[],
  invaderW: number,
  invaderH: number,
  cell: number,
): void {
  const halfW = invaderW * 0.4;
  const halfH = invaderH * 0.4;
  for (const inv of invaders) {
    if (!inv.alive) continue;
    for (const bunker of bunkers) {
      for (const block of bunker.blocks) {
        if (!block.alive) continue;
        if (
          Math.abs(inv.x - block.x) <= halfW + cell * 0.5 &&
          Math.abs(inv.y - block.y) <= halfH + cell * 0.5
        ) {
          block.alive = false;
        }
      }
    }
  }
}

/** Kill the hit block and a small radius of neighbors (pixel-chunk feel). */
function carveAround(
  bunker: Bunker,
  cx: number,
  cy: number,
  cell: number,
  radiusCells: number,
): void {
  const r = cell * radiusCells;
  const r2 = r * r;
  for (const block of bunker.blocks) {
    if (!block.alive) continue;
    const dx = block.x - cx;
    const dy = block.y - cy;
    if (dx * dx + dy * dy <= r2) block.alive = false;
  }
}
