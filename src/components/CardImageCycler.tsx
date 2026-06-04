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

  const total = images.length;
  const hasMultiple = total > 1;
  const safeCurrent = images[currentIdx] ?? images[0];
  const safeNext = images[nextIdx] ?? images[0];

  useEffect(() => {
    if (!safeCurrent) return;
    preload(safeCurrent);
    if (hasMultiple) {
      preload(safeNext);
      preload(images[(nextIdx + 1) % total] ?? safeNext);
    }
  }, [safeCurrent, safeNext, hasMultiple, images, nextIdx, total]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !hasMultiple) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { root: null, rootMargin: "80px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMultiple]);

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

    setFadeInNext(true);

    fadeTimerRef.current = window.setTimeout(() => {
      const newCurrent = nextIdx;
      const newNext = (nextIdx + 1) % total;

      // Snap top layer without transition — setTimeout (not rAF) for mobile Safari
      setSkipTransition(true);
      setFadeInNext(false);
      setCurrentIdx(newCurrent);
      setNextIdx(newNext);

      window.setTimeout(() => setSkipTransition(false), 50);
    }, FADE_MS);
  }, [hasMultiple, nextIdx, total]);

  useEffect(() => {
    clearCycleTimer();

    if (!hasMultiple || !isVisible || isHovered || fadeInNext) {
      return;
    }

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
  ]);

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

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => supportsHover && setIsHovered(true)}
      onMouseLeave={() => supportsHover && setIsHovered(false)}
    >
      <img
        src={safeCurrent}
        alt={alt}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
        style={{ zIndex: 1 }}
      />

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
