import { useCallback, useEffect, useRef, useState } from "react";

type CardImageCyclerProps = {
  images: string[];
  alt: string;
  /** Milliseconds between transitions (default 3500) */
  interval?: number;
  /** Additional classes for the img element */
  imgClassName?: string;
  /** Light mode styling */
  lightMode?: boolean;
};

const FADE_MS = 1000;

// #region agent log
function dbg(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
) {
  if (!import.meta.env.DEV) return;
  const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
  fetch(`http://${host}:7457/ingest/ed9b07e2-465a-482e-b5a8-7dd1854cf52a`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "0b913a" },
    body: JSON.stringify({
      sessionId: "0b913a",
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

function preload(src: string) {
  const img = new Image();
  img.src = src;
}

/**
 * Auto-cycling image component for property cards.
 * Two-layer crossfade (mobile-safe), preloads next image, pauses on desktop hover.
 */
export function CardImageCycler({
  images,
  alt,
  interval = 3500,
  imgClassName = "",
  lightMode = false,
}: CardImageCyclerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const [fadeInNext, setFadeInNext] = useState(false);
  const [skipTransition, setSkipTransition] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const cycleTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const cycleCountRef = useRef(0);

  const total = images.length;
  const hasMultiple = total > 1;
  const safeCurrent = images[currentIdx] ?? images[0];
  const safeNext = images[nextIdx] ?? images[0];

  // Preload current, next, and the one after
  useEffect(() => {
    if (!safeCurrent) return;
    preload(safeCurrent);
    if (hasMultiple) {
      preload(safeNext);
      preload(images[(nextIdx + 1) % total] ?? safeNext);
    }
  }, [safeCurrent, safeNext, hasMultiple, images, nextIdx, total]);

  // Only cycle when the card is on screen (helps mobile performance)
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !hasMultiple) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // #region agent log
        dbg(
          "CardImageCycler:intersection",
          "visibility",
          {
            alt: alt.slice(0, 30),
            isIntersecting: entry.isIntersecting,
            ratio: entry.intersectionRatio,
            cycles: cycleCountRef.current,
          },
          "H2",
        );
        // #endregion
        setIsVisible(entry.isIntersecting);
      },
      { root: null, rootMargin: "80px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMultiple, alt]);

  const clearCycleTimer = useCallback(() => {
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
  }, []);

  const beginFade = useCallback(() => {
    if (!hasMultiple) return;

    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
    }

    // #region agent log
    dbg(
      "CardImageCycler:beginFade",
      "fade start",
      { alt: alt.slice(0, 30), currentIdx, nextIdx, cycles: cycleCountRef.current },
      "H3",
    );
    // #endregion

    setFadeInNext(true);

    fadeTimerRef.current = window.setTimeout(() => {
      const newCurrent = nextIdx;
      const newNext = (nextIdx + 1) % total;
      cycleCountRef.current += 1;

      // #region agent log
      dbg(
        "CardImageCycler:fadeComplete",
        "fade done",
        {
          alt: alt.slice(0, 30),
          newCurrent,
          newNext,
          cycles: cycleCountRef.current,
        },
        "H3",
      );
      // #endregion

      // Snap top layer without transition; use setTimeout (not rAF) — rAF is throttled on mobile Safari
      setSkipTransition(true);
      setFadeInNext(false);
      setCurrentIdx(newCurrent);
      setNextIdx(newNext);

      window.setTimeout(() => setSkipTransition(false), 50);
    }, FADE_MS);
  }, [hasMultiple, nextIdx, total, alt, currentIdx]);

  // Schedule next cycle — never block on skipTransition (was instantReset; rAF stuck on mobile)
  useEffect(() => {
    clearCycleTimer();

    const blocked = !hasMultiple || !isVisible || isHovered || fadeInNext;
    if (blocked) {
      // #region agent log
      dbg(
        "CardImageCycler:schedule",
        "blocked",
        {
          alt: alt.slice(0, 30),
          hasMultiple,
          isVisible,
          isHovered,
          fadeInNext,
          skipTransition,
          currentIdx,
          cycles: cycleCountRef.current,
        },
        blocked && !isVisible ? "H2" : fadeInNext ? "H3" : "H4",
      );
      // #endregion
      return;
    }

    // #region agent log
    dbg(
      "CardImageCycler:schedule",
      "scheduled",
      { alt: alt.slice(0, 30), interval, currentIdx, cycles: cycleCountRef.current },
      "H4",
    );
    // #endregion

    cycleTimerRef.current = window.setTimeout(() => {
      beginFade();
    }, interval);

    return clearCycleTimer;
  }, [
    hasMultiple,
    isVisible,
    isHovered,
    fadeInNext,
    currentIdx,
    interval,
    beginFade,
    clearCycleTimer,
    alt,
  ]);

  // Clear fade timer on unmount only
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  const supportsHover =
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const fadeClass = skipTransition
    ? ""
    : "transition-opacity duration-1000 ease-in-out";

  const showDebug =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("pl_cycler_debug");

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => supportsHover && setIsHovered(true)}
      onMouseLeave={() => supportsHover && setIsHovered(false)}
    >
      {/* Base layer — always the current photo */}
      <img
        src={safeCurrent}
        alt={alt}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
        style={{ zIndex: 1 }}
      />

      {/* Top layer — next photo fades in */}
      {hasMultiple && (
        <img
          src={safeNext}
          alt=""
          loading="eager"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover ${fadeClass} ${imgClassName}`}
          style={{
            zIndex: 2,
            opacity: fadeInNext ? 1 : 0,
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        />
      )}

      {/* Photo counter */}
      {hasMultiple && (
        <div
          className={`absolute bottom-2.5 right-2.5 z-10 flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums backdrop-blur-md ${
            lightMode
              ? "bg-white/85 text-black/75 shadow-sm ring-1 ring-black/10"
              : "bg-black/65 text-white/95 shadow-lg ring-1 ring-white/20"
          }`}
        >
          <span>{currentIdx + 1}</span>
          <span className="mx-0.5 text-[9px] opacity-50">/</span>
          <span>{total}</span>
        </div>
      )}

      {showDebug && (
        <div className="absolute left-1 top-1 z-20 max-w-[90%] rounded bg-red-600/90 px-1 py-0.5 text-[8px] text-white">
          c:{cycleCountRef.current} v:{isVisible ? 1 : 0} f:{fadeInNext ? 1 : 0}
        </div>
      )}

      {hasMultiple && isHovered && (
        <div
          className={`absolute bottom-2.5 left-2.5 z-10 hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-md md:flex ${
            lightMode
              ? "bg-white/85 text-black/65 shadow-sm ring-1 ring-black/10"
              : "bg-black/65 text-white/80 shadow-lg ring-1 ring-white/20"
          }`}
        >
          <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
            <rect x="1" y="1" width="3" height="8" rx="0.5" />
            <rect x="6" y="1" width="3" height="8" rx="0.5" />
          </svg>
          <span>Paused</span>
        </div>
      )}
    </div>
  );
}
