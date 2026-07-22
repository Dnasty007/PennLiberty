import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X, ClipboardCheck } from "lucide-react";
import {
  formatRuntime,
  getFeaturedOwnerVideo,
  getGridOwnerVideos,
  type OwnerVideo,
} from "@/lib/ownerVideos";
import { PENN_PHONE_DISPLAY, PENN_PHONE_TEL } from "@/lib/brand";

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
  lightMode,
  onClose,
}: {
  video: OwnerVideo;
  lightMode: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();
  const [ended, setEnded] = useState(false);

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

  useEffect(() => {
    setEnded(false);
    const el = videoRef.current;
    if (!el) return;
    el.load();
    const play = el.play();
    if (play) void play.catch(() => {});
  }, [video.src]);

  const goReview = () => {
    onClose();
    // Allow modal unmount before scroll
    window.setTimeout(scrollToPropertyReview, 80);
  };

  const panel = lightMode
    ? "border-black/15 bg-[#f7f5f0] text-black"
    : "border-white/12 bg-[#0a1526] text-white";

  return createPortal(
    <div
      className="pl-overlay-enter fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-pl-no-page-swipe
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close video"
        onClick={onClose}
      />
      <div
        className={`pl-sheet-enter relative z-[1] flex max-h-[min(100dvh,920px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] border shadow-2xl sm:rounded-[24px] ${panel}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10 sm:px-5">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a67c32] dark:text-[#dcb672]">
              Owner info · {video.id}
            </div>
            <h2 id={titleId} className="mt-0.5 truncate text-base font-semibold sm:text-lg">
              {video.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/[0.04] transition hover:bg-black/[0.08] dark:border-white/15 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-black">
          <video
            ref={videoRef}
            key={video.src}
            className="aspect-video w-full"
            controls
            playsInline
            poster={video.poster}
            preload="metadata"
            onEnded={() => setEnded(true)}
          >
            <source src={video.src} type="video/mp4" />
          </video>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className={`text-sm leading-relaxed ${ended ? "opacity-100" : "opacity-80"}`}>
            {ended
              ? "Ready to talk about your property?"
              : "Short process explainers for owners under management."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${PENN_PHONE_TEL}`}
              className="rounded-full border border-black/12 px-3.5 py-2 text-xs font-semibold transition hover:border-[#d6b06a]/50 dark:border-white/15"
            >
              {PENN_PHONE_DISPLAY}
            </a>
            <button
              type="button"
              onClick={goReview}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#d6b06a] px-4 py-2 text-xs font-semibold text-[#08111f] shadow-[0_10px_24px_rgba(214,176,106,0.28)] transition hover:brightness-105"
            >
              <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
              Free property review
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function OwnersVideoLibrary({ lightMode, mutedText, subtleText }: OwnersVideoLibraryProps) {
  const featured = getFeaturedOwnerVideo();
  const grid = getGridOwnerVideos();
  const [active, setActive] = useState<OwnerVideo | null>(null);

  const open = useCallback((v: OwnerVideo) => setActive(v), []);
  const close = useCallback(() => setActive(null), []);

  const shell = lightMode
    ? "border-black/12 bg-gradient-to-br from-white/75 to-white/50 shadow-[inset_0_0_0_1px_rgba(214,176,106,0.12)]"
    : "border-white/[0.10] bg-[linear-gradient(150deg,rgba(18,32,54,0.5),rgba(7,13,26,0.36))] shadow-[inset_0_0_0_1px_rgba(214,176,106,0.08)]";
  const eyebrow = lightMode ? "text-[#99773d]" : "text-[#dcb672]";
  const h2c = lightMode ? "text-black" : "text-white";

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

        <div className="mt-7 md:mt-9">
          <VideoCard
            video={featured}
            lightMode={lightMode}
            mutedText={mutedText}
            subtleText={subtleText}
            featured
            onPlay={open}
          />
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
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

      {active ? <OwnerVideoModal video={active} lightMode={lightMode} onClose={close} /> : null}
    </section>
  );
}
