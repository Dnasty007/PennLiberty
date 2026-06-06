import type { Bullet, Invader, PinObstacle } from "./types";

export function circleHitsCircle(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}

export function pointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number,
): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

/** Axis-aligned rect (center-anchored) overlap, used for bullet↔ship/invader. */
export function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return (
    Math.abs(ax - bx) * 2 < aw + bw && Math.abs(ay - by) * 2 < ah + bh
  );
}

export function bulletHitsPin(bullet: Bullet, pin: PinObstacle): boolean {
  return pointInCircle(bullet.x, bullet.y, pin.x, pin.y, pin.radius);
}

export function bulletHitsInvader(
  bullet: Bullet,
  invader: Invader,
  w: number,
  h: number,
): boolean {
  return rectsOverlap(bullet.x, bullet.y, 2, 8, invader.x, invader.y, w, h);
}
