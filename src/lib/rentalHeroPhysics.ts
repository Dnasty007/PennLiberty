export type PhysicsBody = {
  rentalId: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

export type PhysicsBounds = {
  width: number;
  height: number;
};

export type PointerState = {
  x: number;
  y: number;
  /** Cursor speed in px/frame — low speed means the user is aiming to click. */
  speed: number;
};

const CONFIG = {
  damping: 0.984,
  wallBounce: 0.55,
  repulseRadius: 128,
  repulseStrength: 1.75,
  driftStrength: 0.017,
  /** Only while mouse-down on a chip — keeps clicks reliable without killing float. */
  pinnedDamping: 0.28,
  maxSpeed: 4.6,
  wallPad: 10,
  minSeparation: 6,
  defaultRadius: 54,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function separatePair(a: PhysicsBody, b: PhysicsBody): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 0.001;
  const minDist = a.radius + b.radius + CONFIG.minSeparation;

  if (dist >= minDist) return;

  const overlap = (minDist - dist) / 2;
  const nx = dx / dist;
  const ny = dy / dist;

  a.x -= nx * overlap;
  a.y -= ny * overlap;
  b.x += nx * overlap;
  b.y += ny * overlap;

  const relVel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (relVel > 0) {
    const impulse = relVel * 0.45;
    a.vx -= impulse * nx;
    a.vy -= impulse * ny;
    b.vx += impulse * nx;
    b.vy += impulse * ny;
  }
}

function resolveAllOverlaps(bodies: PhysicsBody[], iterations = 6): void {
  for (let n = 0; n < iterations; n++) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        separatePair(bodies[i]!, bodies[j]!);
      }
    }
  }
}

function keepInsideWalls(body: PhysicsBody, bounds: PhysicsBounds): void {
  const pad = CONFIG.wallPad;
  const minX = pad + body.radius;
  const maxX = bounds.width - pad - body.radius;
  const minY = pad + body.radius;
  const maxY = bounds.height - pad - body.radius;

  if (body.x < minX) {
    body.x = minX;
    body.vx *= -CONFIG.wallBounce;
  } else if (body.x > maxX) {
    body.x = maxX;
    body.vx *= -CONFIG.wallBounce;
  }

  if (body.y < minY) {
    body.y = minY;
    body.vy *= -CONFIG.wallBounce;
  } else if (body.y > maxY) {
    body.y = maxY;
    body.vy *= -CONFIG.wallBounce;
  }
}

function shuffleIndices(count: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

function randomDriftVelocity(): { vx: number; vy: number } {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1.1 + Math.random() * 2.2;
  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
}

/** Scatter pins across the full hero — jittered grid + random drift, not a center ring. */
export function spawnPhysicsBodies(
  rentalIds: number[],
  bounds: PhysicsBounds,
  radius = CONFIG.defaultRadius,
): PhysicsBody[] {
  const { width, height } = bounds;
  if (width <= 0 || height <= 0 || rentalIds.length === 0) return [];

  const pad = radius + 20;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  if (innerW <= 0 || innerH <= 0) return [];

  const count = rentalIds.length;
  const aspect = width / height;
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellW = innerW / cols;
  const cellH = innerH / rows;
  const slotOrder = shuffleIndices(count);

  const bodies: PhysicsBody[] = rentalIds.map((rentalId, i) => {
    const slot = slotOrder[i]!;
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const jitterX = 0.18 + Math.random() * 0.64;
    const jitterY = 0.18 + Math.random() * 0.64;
    const nudgeX = (Math.random() - 0.5) * cellW * 0.22;
    const nudgeY = (Math.random() - 0.5) * cellH * 0.22;
    const x = pad + col * cellW + cellW * jitterX + nudgeX;
    const y = pad + row * cellH + cellH * jitterY + nudgeY;
    const drift = randomDriftVelocity();

    return {
      rentalId,
      x: clamp(x, pad, width - pad),
      y: clamp(y, pad, height - pad),
      vx: drift.vx,
      vy: drift.vy,
      radius,
    };
  });

  resolveAllOverlaps(bodies, 16);
  bodies.forEach((body) => keepInsideWalls(body, bounds));
  return bodies;
}

/** Per-frame overrides — game mode calms the drift and disables repulsion. */
export type StepOptions = {
  driftStrength?: number;
  maxSpeed?: number;
  repulsion?: boolean;
};

export function stepPhysicsSimulation(
  bodies: PhysicsBody[],
  bounds: PhysicsBounds,
  pointer: PointerState | null,
  hoveredIndex: number | null,
  pinnedIndex: number | null,
  options?: StepOptions,
): void {
  if (bounds.width <= 0 || bounds.height <= 0) return;

  const driftStrength = options?.driftStrength ?? CONFIG.driftStrength;
  const maxSpeed = options?.maxSpeed ?? CONFIG.maxSpeed;
  const allowRepulsion = options?.repulsion ?? true;

  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i]!;
    const isHovered = hoveredIndex === i;
    const isPinned = pinnedIndex === i;

    if (!isPinned) {
      body.vx += (Math.random() - 0.5) * driftStrength;
      body.vy += (Math.random() - 0.5) * driftStrength;
    }

    if (pointer && allowRepulsion && !isPinned && !isHovered) {
      const dx = body.x - pointer.x;
      const dy = body.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 0.001;

      if (dist < CONFIG.repulseRadius) {
        const t = 1 - dist / CONFIG.repulseRadius;
        const push = CONFIG.repulseStrength * t * t;
        body.vx += (dx / dist) * push;
        body.vy += (dy / dist) * push;
      }
    }

    const damp = isPinned ? CONFIG.pinnedDamping : CONFIG.damping;
    body.vx *= damp;
    body.vy *= damp;

    const speed = Math.hypot(body.vx, body.vy);
    if (speed > maxSpeed) {
      body.vx = (body.vx / speed) * maxSpeed;
      body.vy = (body.vy / speed) * maxSpeed;
    }

    body.x += body.vx;
    body.y += body.vy;
    keepInsideWalls(body, bounds);
  }

  resolveAllOverlaps(bodies, 4);
}

/** Even grid for prefers-reduced-motion desktop fallback. */
export function staticHeroPinPercents(count: number): Array<{ top: string; left: string }> {
  if (count <= 0) return [];

  const cols = Math.ceil(Math.sqrt(count * 1.35));
  const rows = Math.ceil(count / cols);

  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = ((col + 0.5) / cols) * 100;
    const top = ((row + 0.5) / rows) * 100;
    return {
      top: `${top.toFixed(1)}%`,
      left: `${left.toFixed(1)}%`,
    };
  });
}
