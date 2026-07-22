import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X, ClipboardCheck, Maximize2, ChevronUp } from "lucide-react";
import {
  formatRuntime,
  getFeaturedOwnerVideo,
  getGridOwnerVideos,
  getMobilePreviewVideos,
  getSortedOwnerVideos,
  type OwnerVideo,
} from "@/lib/ownerVideos";
import { PENN_PHONE_DISPLAY, PENN_PHONE_TEL } from "@/lib/brand";

/** iOS/iPadOS Safari video APIs */
type VideoWithWebkit = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Exit browser / iOS system fullscreen if active (no-op otherwise). */
async function exitAnyFullscreen(video: HTMLVideoElement | null): Promise<void> {
  const v = video as VideoWithWebkit | null;
  try {
    if (v?.webkitDisplayingFullscreen && typeof v.webkitExitFullscreen === "function") {
      v.webkitExitFullscreen();
    }
  } catch {
    /* ignore */
  }
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch {
    /* ignore */
  }
}

/**
 * Prefer fullscreen on the *stage* (keeps our X visible on Android/desktop).
 * iOS often only supports webkitEnterFullscreen on the video element — after Done,
 * user returns to our stage which still has the Close control.
 */
async function enterStageOrVideoFullscreen(
  stage: HTMLElement | null,
  video: HTMLVideoElement | null,
): Promise<void> {
  if (video?.paused) {
    try {
      await video.play();
    } catch {
      /* continue */
    }
  }

  const v = video as VideoWithWebkit | null;

  // 1) Fullscreen the stage shell (X stays on screen) — Chrome/Android/desktop
  if (stage) {
    const anyStage = stage as HTMLElement & {
      requestFullscreen?: () => Promise<void>;
      webkitRequestFullscreen?: () => void;
    };
    try {
      if (typeof anyStage.requestFullscreen === "function") {
        await anyStage.requestFullscreen();
        return;
      }
      if (typeof anyStage.webkitRequestFullscreen === "function") {
        anyStage.webkitRequestFullscreen();
        return;
      }
    } catch {
      /* try video path */
    }
  }

  // 2) iOS system player (Done returns to our stage + X)
  if (v && typeof v.webkitEnterFullscreen === "function") {
    v.webkitEnterFullscreen();
    return;
  }

  if (video && typeof video.requestFullscreen === "function") {
    await video.requestFullscreen();
  }
}

type OwnersVideoLibraryProps = {
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
};

function scrollToPropertyReview() {
  document
    .getElementById("owners-property-review")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function VideoCard({
  video,
  lightMode,
  mutedText,
  subtleText,
  featured,
  onPlay,
}: {
  video: OwnerVideo;
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
  featured?: boolean;
  onPlay: (v: OwnerVideo) => void;
}) {
  const card = lightMode
    ? "border-black/10 bg-black/[0.02] hover:border-[#d6b06a]/45 hover:bg-black/[0.04]"
    : "border-white/[0.08] bg-[rgba(255,255,255,0.025)] hover:border-[#d6b06a]/35 hover:bg-[rgba(255,255,255,0.04)]";
  const title = lightMode ? "text-black" : "text-white";
  const meta = subtleText;

  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className={`group flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/70 ${card} ${
        featured ? "md:flex-row md:items-stretch" : ""
      }`}
      aria-label={`Play video: ${video.title}`}
    >
      <div
        className={`relative overflow-hidden bg-[#16233f]/10 ${
          featured ? "aspect-video w-full md:aspect-auto md:w-[52%] md:min-h-[220px]" : "aspect-video w-full"
        }`}
      >
        <img
          src={video.poster}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#08111f]/55 via-[#08111f]/10 to-transparent"
        />
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#d6b06a] text-[#08111f] shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition group-hover:scale-105 md:h-14 md:w-14">
          <Play className="h-5 w-5 fill-current md:h-6 md:w-6" aria-hidden />
        </span>
        <span
          className={`absolute bottom-2.5 right-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums tracking-wide ${
            lightMode ? "bg-black/55 text-white" : "bg-black/60 text-white/95"
          }`}
        >
          {formatRuntime(video.runtimeSec)}
        </span>
      </div>
      <div className={`flex flex-1 flex-col justify-center p-4 md:p-5 ${featured ? "md:px-6" : ""}`}>
        <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${meta}`}>
          Owner info · {video.id}
        </div>
        <h3 className={`mt-1.5 text-base font-semibold leading-snug md:text-lg ${title}`}>{video.title}</h3>
        <p className={`mt-2 text-[13px] leading-relaxed md:text-sm ${mutedText}`}>{video.blurb}</p>
      </div>
    </button>
  );
}

function OwnerVideoModal({
  video,
  onClose,
}: {
  video: OwnerVideo;
  lightMode: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [ended, setEnded] = useState(false);
  const [fsBusy, setFsBusy] = useState(false);
  const appleTouch = isAppleTouchDevice();

  /** Always leave system FS, pause, and return to the library (never stuck full-screen). */
  const closeToLibrary = useCallback(async () => {
    const el = videoRef.current;
    try {
      el?.pause();
    } catch {
      /* ignore */
    }
    await exitAnyFullscreen(el);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void closeToLibrary();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [closeToLibrary]);

  // When user leaves iOS/system fullscreen via Done, stay on our stage (X still visible)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onWebkitEnd = () => {
      // Ensure video is still playable in our stage with controls + Close
      try {
        el.setAttribute("playsinline", "true");
        el.setAttribute("webkit-playsinline", "true");
      } catch {
        /* ignore */
      }
    };
    el.addEventListener("webkitendfullscreen", onWebkitEnd);
    return () => el.removeEventListener("webkitendfullscreen", onWebkitEnd);
  }, [video.src]);

  useEffect(() => {
    setEnded(false);
    const el = videoRef.current;
    if (!el) return;
    // Always playsInline in *our* stage so Close (X) stays under our control.
    // System expand is opt-in via Expand / native arrows.
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    el.setAttribute("x-webkit-airplay", "allow");
    el.load();
    const play = el.play();
    if (play) void play.catch(() => {});

    return () => {
      // Never leave a stuck system-fullscreen session if the modal unmounts
      void exitAnyFullscreen(el);
      try {
        el.pause();
      } catch {
        /* ignore */
      }
    };
  }, [video.src]);

  const goFullscreen = useCallback(async () => {
    if (fsBusy) return;
    setFsBusy(true);
    try {
      await enterStageOrVideoFullscreen(stageRef.current, videoRef.current);
    } catch {
      /* stage is already full-viewport; ignore */
    } finally {
      setFsBusy(false);
    }
  }, [fsBusy]);

  const goReview = () => {
    void closeToLibrary().then(() => {
      window.setTimeout(scrollToPropertyReview, 80);
    });
  };

  return createPortal(
    <div
      ref={stageRef}
      className="fixed inset-0 z-[90] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-pl-no-page-swipe
    >
      {/* Always-on chrome: never lose the way back to the library */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[95] flex items-start justify-between gap-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent px-3 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4"
      >
        <div className="pointer-events-none min-w-0 pt-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dcb672]">
            Owner info · {video.id}
          </div>
          <h2 id={titleId} className="truncate text-sm font-semibold text-white sm:text-base">
            {video.title}
          </h2>
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void goFullscreen()}
            disabled={fsBusy}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/25 disabled:opacity-60"
            aria-label="Full screen"
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
            <span className="hidden xs:inline sm:inline">Expand</span>
          </button>
          <button
            type="button"
            onClick={() => void closeToLibrary()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d6b06a] text-[#08111f] shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition hover:brightness-105 active:scale-95"
            aria-label="Close and back to videos"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <video
          ref={videoRef}
          key={video.src}
          className="h-full w-full object-contain"
          controls
          playsInline
          poster={video.poster}
          preload="auto"
          onEnded={() => setEnded(true)}
          onDoubleClick={() => void goFullscreen()}
        >
          <source src={video.src} type="video/mp4" />
        </video>
      </div>

      <div className="z-[95] flex flex-col gap-3 border-t border-white/10 bg-black/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className={`text-sm leading-relaxed ${ended ? "opacity-100" : "opacity-80"}`}>
          {ended
            ? "Ready to talk about your property?"
            : appleTouch
              ? "Done / Close (X) returns to the video list. Expand uses the system full-screen player."
              : "Close (X) returns to the video list anytime."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void closeToLibrary()}
            className="rounded-full border border-white/30 px-4 py-2.5 text-xs font-semibold transition hover:border-white/60"
          >
            Back to videos
          </button>
          <a
            href={`tel:${PENN_PHONE_TEL}`}
            className="rounded-full border border-white/25 px-3.5 py-2 text-xs font-semibold transition hover:border-[#d6b06a]/50"
          >
            {PENN_PHONE_DISPLAY}
          </a>
          <button
            type="button"
            onClick={goReview}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#d6b06a] px-4 py-2 text-xs font-semibold text-[#08111f] transition hover:brightness-105"
          >
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
            Free property review
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MoreVideosSheet({
  videos,
  lightMode,
  mutedText,
  subtleText,
  onPlay,
  onClose,
}: {
  videos: OwnerVideo[];
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
  onPlay: (v: OwnerVideo) => void;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const sheet = lightMode
    ? "border-black/12 bg-[#f7f5f0] text-black"
    : "border-white/12 bg-[#0a1526] text-white";

  return createPortal(
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-pl-no-page-swipe
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close more videos"
        onClick={onClose}
      />
      <div
        className={`relative z-[1] flex max-h-[min(88dvh,720px)] w-full max-w-lg flex-col rounded-t-[24px] border shadow-2xl sm:rounded-[24px] ${sheet}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3.5 dark:border-white/10 sm:px-5">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a67c32] dark:text-[#dcb672]">
              Owner info library
            </div>
            <h2 id={titleId} className="mt-0.5 text-base font-semibold sm:text-lg">
              All videos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/[0.04] transition hover:bg-black/[0.08] dark:border-white/15 dark:bg-white/[0.06]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {videos.map((v) => (
            <li key={v.id}>
              <VideoCard
                video={v}
                lightMode={lightMode}
                mutedText={mutedText}
                subtleText={subtleText}
                onPlay={(vid) => {
                  onClose();
                  // Let sheet unmount before player mounts
                  window.setTimeout(() => onPlay(vid), 60);
                }}
              />
            </li>
          ))}
        </ul>

        <div className="border-t border-black/10 px-4 py-3 dark:border-white/10 sm:px-5">
          <p className={`text-center text-xs ${subtleText}`}>
            {videos.length} videos · about one minute each
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function OwnersVideoLibrary({ lightMode, mutedText, subtleText }: OwnersVideoLibraryProps) {
  const featured = getFeaturedOwnerVideo();
  const grid = getGridOwnerVideos();
  const allVideos = getSortedOwnerVideos();
  const { preview: mobilePreview } = getMobilePreviewVideos();
  const [active, setActive] = useState<OwnerVideo | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const open = useCallback((v: OwnerVideo) => {
    setMoreOpen(false);
    setActive(v);
  }, []);
  const close = useCallback(() => setActive(null), []);

  const shell = lightMode
    ? "border-black/12 bg-gradient-to-br from-white/75 to-white/50 shadow-[inset_0_0_0_1px_rgba(214,176,106,0.12)]"
    : "border-white/[0.10] bg-[linear-gradient(150deg,rgba(18,32,54,0.5),rgba(7,13,26,0.36))] shadow-[inset_0_0_0_1px_rgba(214,176,106,0.08)]";
  const eyebrow = lightMode ? "text-[#99773d]" : "text-[#dcb672]";
  const h2c = lightMode ? "text-black" : "text-white";
  const moreBtn = lightMode
    ? "border-black/12 bg-white/80 text-black hover:border-[#d6b06a]/45 hover:bg-white"
    : "border-white/15 bg-white/[0.06] text-white hover:border-[#d6b06a]/40 hover:bg-white/[0.1]";

  return (
    <section
      id="owner-videos"
      className="relative scroll-mt-24 md:scroll-mt-[6.75rem]"
      aria-labelledby="owners-video-library-heading"
    >
      <div className={`overflow-hidden rounded-[28px] border p-5 backdrop-blur-lg md:p-8 lg:p-9 ${shell}`}>
        <div className="max-w-2xl">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>
            Owner info library
          </span>
          <h2
            id="owners-video-library-heading"
            className={`mt-3 text-[1.625rem] font-semibold leading-[1.14] tracking-[-0.015em] md:text-[2rem] ${h2c}`}
          >
            Short videos on how we work
          </h2>
          <p className={`mt-4 text-[0.98rem] leading-relaxed md:text-[1.0625rem] ${mutedText}`}>
            Process explainers for owners — who we are, onboarding, maintenance, placement, and compliance.
            Click to play. About one minute each.
          </p>
        </div>

        {/* Mobile: first 3 only — keeps the page short as the library grows */}
        <ul className="mt-7 space-y-3 md:hidden">
          {mobilePreview.map((v, i) => (
            <li key={v.id}>
              <VideoCard
                video={v}
                lightMode={lightMode}
                mutedText={mutedText}
                subtleText={subtleText}
                featured={i === 0}
                onPlay={open}
              />
            </li>
          ))}
        </ul>

        {allVideos.length > mobilePreview.length ? (
          <div className="mt-4 md:hidden">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition ${moreBtn}`}
            >
              <ChevronUp className="h-4 w-4 text-[#d6b06a]" aria-hidden />
              More videos
              <span className={`tabular-nums ${subtleText}`}>({allVideos.length})</span>
            </button>
          </div>
        ) : null}

        {/* Desktop / tablet: full shelf (featured + grid) */}
        <div className="mt-9 hidden md:block">
          <VideoCard
            video={featured}
            lightMode={lightMode}
            mutedText={mutedText}
            subtleText={subtleText}
            featured
            onPlay={open}
          />
        </div>

        <ul className="mt-4 hidden gap-3 md:grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {grid.map((v) => (
            <li key={v.id}>
              <VideoCard
                video={v}
                lightMode={lightMode}
                mutedText={mutedText}
                subtleText={subtleText}
                onPlay={open}
              />
            </li>
          ))}
        </ul>

        <div
          className={`mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between ${
            lightMode ? "border-black/10" : "border-white/[0.08]"
          }`}
        >
          <p className={`text-sm ${subtleText}`}>
            Prefer to talk through your property? Start with a free review.
          </p>
          <button
            type="button"
            onClick={scrollToPropertyReview}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#d6b06a] px-5 py-2.5 text-sm font-semibold text-[#08111f] shadow-[0_12px_28px_rgba(214,176,106,0.25)] transition hover:brightness-105"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden />
            Get a free property review
          </button>
        </div>
      </div>

      {moreOpen && allVideos.length > 0 ? (
        <MoreVideosSheet
          videos={allVideos}
          lightMode={lightMode}
          mutedText={mutedText}
          subtleText={subtleText}
          onPlay={open}
          onClose={() => setMoreOpen(false)}
        />
      ) : null}

      {active ? <OwnerVideoModal video={active} lightMode={lightMode} onClose={close} /> : null}
    </section>
  );
}
