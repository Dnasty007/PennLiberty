import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Rental } from "@/lib/data";
import {
  spawnPhysicsBodies,
  stepPhysicsSimulation,
  type PhysicsBody,
  type PointerState,
} from "@/lib/rentalHeroPhysics";

export type RentalsHeroPhysicsHandle = {
  getBodies: () => PhysicsBody[];
  getBounds: () => { width: number; height: number };
};

type RentalsHeroPhysicsProps = {
  rentals: Rental[];
  onOpenRentalDetails?: (id: number) => void;
  /** "game" calms the drift, drops repulsion, and makes chips non-interactive. */
  mode?: "browse" | "game";
};

export const RentalsHeroPhysics = forwardRef<
  RentalsHeroPhysicsHandle,
  RentalsHeroPhysicsProps
>(function RentalsHeroPhysics({ rentals, onOpenRentalDetails, mode = "browse" }, ref) {
  const layerRef = useRef<HTMLDivElement>(null);
  const bodiesRef = useRef<PhysicsBody[]>([]);
  const pinRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pointerRef = useRef<PointerState | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const pinnedIndexRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const resizeTimerRef = useRef<number | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [hoveredRentalId, setHoveredRentalId] = useState<number | null>(null);

  const rentalIds = rentals.map((r) => r.id).join(",");

  const readBounds = useCallback(() => {
    const el = layerRef.current;
    if (!el) return { width: 0, height: 0 };
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getBodies: () => bodiesRef.current,
      getBounds: () => readBounds(),
    }),
    [readBounds],
  );

  const syncDomPositions = useCallback((bodies: PhysicsBody[]) => {
    for (const body of bodies) {
      const el = pinRefs.current.get(body.rentalId);
      if (!el) continue;
      el.style.left = `${body.x}px`;
      el.style.top = `${body.y}px`;
    }
  }, []);

  const respawn = useCallback(() => {
    const bounds = readBounds();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const ids = rentals.map((r) => r.id);
    const next = spawnPhysicsBodies(ids, bounds);
    bodiesRef.current = next;
    syncDomPositions(next);
  }, [rentals, readBounds, syncDomPositions]);

  useEffect(() => {
    respawn();
  }, [rentalIds, respawn]);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (resizeTimerRef.current != null) {
        window.clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = window.setTimeout(() => {
        respawn();
      }, 120);
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (resizeTimerRef.current != null) {
        window.clearTimeout(resizeTimerRef.current);
      }
    };
  }, [respawn]);

  useEffect(() => {
    const onWindowMouseUp = () => {
      pinnedIndexRef.current = null;
    };
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => window.removeEventListener("mouseup", onWindowMouseUp);
  }, []);

  useEffect(() => {
    const tick = () => {
      const bounds = readBounds();
      const bodies = bodiesRef.current;

      // Game mode freezes the pins where they are → stable energy shields that
      // don't wander or "reset" between waves. Browse mode keeps them floating.
      if (
        modeRef.current !== "game" &&
        bodies.length > 0 &&
        bounds.width > 0 &&
        bounds.height > 0
      ) {
        stepPhysicsSimulation(
          bodies,
          bounds,
          pointerRef.current,
          hoveredIndexRef.current,
          pinnedIndexRef.current,
        );
        syncDomPositions(bodies);
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [readBounds, syncDomPositions]);

  const toLocalPoint = (clientX: number, clientY: number) => {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const updatePointer = (point: { x: number; y: number } | null) => {
    if (!point) {
      pointerRef.current = null;
      lastPointerRef.current = null;
      return;
    }

    const last = lastPointerRef.current;
    const speed = last ? Math.hypot(point.x - last.x, point.y - last.y) : 0;
    lastPointerRef.current = point;
    pointerRef.current = { ...point, speed };
  };

  const gameMode = mode === "game";

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 z-[20] hidden md:block"
      onMouseMove={(e) => {
        if (gameMode) return;
        const point = toLocalPoint(e.clientX, e.clientY);
        if (!point) return;
        updatePointer(point);
      }}
      onMouseLeave={() => {
        updatePointer(null);
        pinnedIndexRef.current = null;
        hoveredIndexRef.current = null;
        setHoveredRentalId(null);
      }}
    >
      {rentals.map((rental, index) => {
        const isHovered = hoveredRentalId === rental.id;

        return (
          <div
            key={rental.id}
            ref={(el) => {
              if (el) pinRefs.current.set(rental.id, el);
              else pinRefs.current.delete(rental.id);
            }}
            className="rental-pin rental-pin--physics absolute -translate-x-1/2 -translate-y-1/2 will-change-[left,top]"
            style={{ zIndex: isHovered ? 30 : 20 }}
          >
            <button
              type="button"
              disabled={gameMode}
              onClick={() => !gameMode && onOpenRentalDetails?.(rental.id)}
              className={`rental-pin-chip max-w-[11rem] rounded-2xl border px-3 py-2 text-center text-xs font-medium text-white shadow-[0_12px_34px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-[border-color,background-color,box-shadow,transform] duration-200 sm:max-w-[12rem] ${
                gameMode ? "pointer-events-none opacity-0" : ""
              } ${
                isHovered
                  ? "scale-105 border-[#d6b06a]/70 bg-black/78 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
                  : "border-[#d6b06a]/25 bg-black/58 hover:border-[#d6b06a]/60 hover:bg-black/75"
              }`}
              onMouseEnter={() => {
                if (gameMode) return;
                hoveredIndexRef.current = index;
                setHoveredRentalId(rental.id);
              }}
              onMouseLeave={() => {
                if (gameMode) return;
                if (pinnedIndexRef.current !== index) {
                  hoveredIndexRef.current = null;
                  setHoveredRentalId(null);
                }
              }}
              onMouseDown={() => {
                if (gameMode) return;
                pinnedIndexRef.current = index;
                hoveredIndexRef.current = index;
                setHoveredRentalId(rental.id);
                const body = bodiesRef.current[index];
                if (body) {
                  body.vx = 0;
                  body.vy = 0;
                }
              }}
              onMouseUp={() => {
                if (gameMode) return;
                pinnedIndexRef.current = null;
              }}
            >
              <span className="line-clamp-2 leading-snug">{rental.title}</span>
              <span className="mt-1 block font-semibold tracking-tight text-[#f4dfb4]">
                {rental.price}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
});
