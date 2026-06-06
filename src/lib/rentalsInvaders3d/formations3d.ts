/** Per-wave enemy formation layouts. Pure: returns spawn specs in hero-pixel
 *  space; the engine turns them into Invaders with type-based hp/points. */
import type { FormationStyle } from "./constants3d";

export type SpawnSpec = { x: number; y: number; type: number };

function allowedMaxType(wave: number): number {
  if (wave >= 8) return 4;
  if (wave >= 6) return 3;
  if (wave >= 4) return 2;
  if (wave >= 2) return 1;
  return 0;
}

function typeForRow(row: number, rows: number, wave: number): number {
  const max = allowedMaxType(wave);
  const fromBottom = rows - 1 - row;
  return Math.min(max, fromBottom);
}

/** Lay out rows of given column counts, centered horizontally. */
function rows(width: number, top: number, rowStride: number, counts: number[], wave: number): SpawnSpec[] {
  const maxCount = Math.max(...counts, 1);
  const colStride = Math.min((width * 0.66) / maxCount, 54);
  const cells: SpawnSpec[] = [];
  counts.forEach((count, row) => {
    const rowW = (count - 1) * colStride;
    const startX = width / 2 - rowW / 2;
    for (let c = 0; c < count; c++) {
      cells.push({ x: startX + c * colStride, y: top + row * rowStride, type: typeForRow(row, counts.length, wave) });
    }
  });
  return cells;
}

export function buildFormationSpecs(
  style: FormationStyle,
  wave: number,
  width: number,
  height: number,
): SpawnSpec[] {
  const top = 56 + Math.min((wave - 1) * 3, 24);
  const rowStride = 32;

  switch (style) {
    case "diamond":
      return rows(width, top, rowStride, [3, 5, 7, 5, 3], wave);

    case "arrow":
      return rows(width, top, rowStride, [9, 7, 5, 3, 1], wave);

    case "spearhead":
      return rows(width, top, rowStride, [1, 3, 5, 7, 9], wave);

    case "columns": {
      const colsN = 6;
      const perCol = 4;
      const span = width * 0.72;
      const startX = width / 2 - span / 2;
      const colStride = span / (colsN - 1);
      const cells: SpawnSpec[] = [];
      for (let col = 0; col < colsN; col++) {
        for (let r = 0; r < perCol; r++) {
          cells.push({
            x: startX + col * colStride,
            y: top + r * rowStride,
            type: typeForRow(r, perCol, wave),
          });
        }
      }
      return cells;
    }

    case "arc": {
      const cells: SpawnSpec[] = [];
      const span = width * 0.74;
      const startX = width / 2 - span / 2;
      [11, 9].forEach((n, band) => {
        for (let i = 0; i < n; i++) {
          const norm = n > 1 ? i / (n - 1) - 0.5 : 0;
          const x = startX + ((i + (band ? 0.5 : 0)) / (n - 1)) * span;
          const y = top + band * rowStride + Math.pow(norm * 2, 2) * 46;
          cells.push({ x, y, type: Math.min(allowedMaxType(wave), band + (Math.abs(norm) < 0.2 ? 1 : 0)) });
        }
      });
      return cells;
    }

    case "checker": {
      const colsN = 10;
      const rowsN = 5;
      const colStride = Math.min((width * 0.66) / colsN, 50);
      const startX = width / 2 - ((colsN - 1) * colStride) / 2;
      const cells: SpawnSpec[] = [];
      for (let r = 0; r < rowsN; r++) {
        for (let c = 0; c < colsN; c++) {
          if ((r + c) % 2 !== 0) continue;
          cells.push({ x: startX + c * colStride, y: top + r * rowStride, type: typeForRow(r, rowsN, wave) });
        }
      }
      return cells;
    }

    case "grid":
    default:
      return rows(width, top, rowStride, [10, 10, 10, 10, 10], wave);
  }
}
