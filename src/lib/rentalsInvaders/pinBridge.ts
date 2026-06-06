import type { PhysicsBody } from "@/lib/rentalHeroPhysics";
import type { PinObstacle } from "./types";

/**
 * Physics overrides applied to the floating rental pins while the game is
 * active: calmer drift, no cursor repulsion, pins still collide with each
 * other. Browse mode is untouched (see RentalsHeroPhysics).
 */
export const GAME_PHYSICS = {
  driftStrength: 0.004,
  maxSpeed: 1.8,
  repulsion: false,
} as const;

/** Source of truth is the physics ref — copy bodies into bare obstacles. */
export function toPinObstacles(bodies: PhysicsBody[]): PinObstacle[] {
  return bodies.map((b) => ({ x: b.x, y: b.y, radius: b.radius }));
}
