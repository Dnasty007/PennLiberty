import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Mail, Phone, Play, Volume2, VolumeX, X } from "lucide-react";
import type { Rental } from "@/lib/data";
import { PENN_EMAIL, PENN_PHONE_DISPLAY, PENN_PHONE_TEL } from "@/lib/brand";

const PENN_PHONE = PENN_PHONE_DISPLAY;

function inquiryMailto(rental: Rental): string {
  const subject = encodeURIComponent(`Rental inquiry: ${rental.title}`);
  const body = encodeURIComponent(
    [
      "Hi Penn Liberty,",
      "",
      `I'm interested in this rental: ${rental.title}`,
      rental.address,
      `Advertised rent: ${rental.price}`,
      rental.meta,
      "",
      "My move-in timeline:",
      "",
      "Questions:",
    ].join("\n"),
  );
  return `mailto:${PENN_EMAIL}?subject=${subject}&body=${body}`;
}

// ─── Full-screen photo gallery ────────────────────────────────────────────────

type PhotoGalleryProps = {
  images: string[];
  initialIndex: number;
  title: string;
  onClose: () => void;
};

function PhotoGallery({ images, initialIndex, title, onClose }: PhotoGalleryProps) {
  const [idx, setIdx] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const total = images.length;

  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black" data-pl-no-page-swipe>
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-14">
        <button
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-md transition active:bg-white/[0.16]"
          aria-label="Close gallery"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-white/60">
          {idx + 1} / {total}
        </span>
        <div className="w-10" aria-hidden />
      </div>

      {/* Main image + swipe/tap zones */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) > 40) (dx > 0 ? prev : next)();
        }}
      >
        <img
          src={images[idx]}
          alt={`${title} — photo ${idx + 1}`}
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition active:bg-black/60"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition active:bg-black/60"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="shrink-0 overflow-x-auto pb-8 pt-3" data-pl-horizontal-scroll>
          <div className="flex gap-2 px-4" style={{ width: "max-content" }}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-[52px] w-[72px] shrink-0 overflow-hidden rounded-xl border transition-all ${
                  i === idx
                    ? "border-[#d6b06a] shadow-[0_0_0_2px_rgba(214,176,106,0.28)]"
                    : "border-white/15 opacity-55 hover:opacity-80"
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Full-screen video player ─────────────────────────────────────────────────

type VideoPlayerProps = {
  videoUrl: string;
  onClose: () => void;
};

function VideoPlayer({ videoUrl, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onTimeUpdate = () => {
      if (vid.duration && isFinite(vid.duration)) {
        setProgress(vid.currentTime / vid.duration);
        setDuration(vid.duration);
      }
    };
    const onLoadedMetadata = () => {
      if (vid.duration && isFinite(vid.duration)) setDuration(vid.duration);
    };

    vid.addEventListener("timeupdate", onTimeUpdate);
    vid.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      vid.removeEventListener("timeupdate", onTimeUpdate);
      vid.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const next = !muted;
    vid.muted = next;
    setMuted(next);
  };

  const seconds = duration > 0 ? Math.round(duration) : 15;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black" data-pl-no-page-swipe>
      {/* Top controls */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pb-3 pt-14">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition active:bg-white/[0.16]"
        >
          <X className="h-4 w-4" />
          Close video
        </button>
        <button
          onClick={toggleMute}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-md transition active:bg-white/[0.16]"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted={muted}
        playsInline
        className="max-h-full max-w-full"
        onEnded={onClose}
      />

      {/* Progress bar + label */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-10">
        <div className="h-[3px] overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-[#d6b06a]"
            style={{ width: `${progress * 100}%`, transition: "width 0.25s linear" }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-xs font-medium text-white/45">{seconds}s property tour</span>
          <span className="text-xs font-medium text-white/45">
            {Math.floor(progress * seconds)}s / {seconds}s
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Contact mini sheet ───────────────────────────────────────────────────────

type ContactSheetProps = {
  rental: Rental;
  lightMode: boolean;
  onClose: () => void;
};

function ContactSheet({ rental, lightMode, onClose }: ContactSheetProps) {
  const bg = lightMode
    ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,247,243,0.99))] border-black/[0.08]"
    : "bg-[linear-gradient(180deg,rgba(10,16,28,0.98),rgba(6,12,22,0.99))] border-white/[0.10]";
  const titleColor = lightMode ? "text-black/90" : "text-white";
  const subColor = lightMode ? "text-black/55" : "text-white/50";
  const divider = lightMode ? "bg-black/[0.06]" : "bg-white/[0.07]";
  const rowBg = lightMode
    ? "border-black/[0.08] bg-black/[0.03] active:bg-black/[0.06]"
    : "border-white/[0.09] bg-white/[0.04] active:bg-white/[0.08]";
  const iconBg = lightMode ? "bg-black/[0.06]" : "bg-white/[0.07]";
  const iconColor = lightMode ? "text-black/55" : "text-white/55";

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col justify-end"
      style={{ background: lightMode ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.62)" }}
      onClick={onClose}
    >
      <div
        className={`relative rounded-t-[28px] border-l border-r border-t px-5 pb-10 pt-5 backdrop-blur-[20px] ${bg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-current opacity-15" />

        <p className={`mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] ${subColor}`}>
          Contact Penn Liberty
        </p>
        <h3 className={`mt-1 text-base font-semibold leading-snug ${titleColor}`}>
          {rental.title}
        </h3>

        <div className={`my-4 h-px ${divider}`} />

        {/* Call */}
        <a
          href={`tel:${PENN_PHONE_TEL}`}
          className="flex w-full items-center gap-3.5 rounded-[18px] border border-[#d6b06a]/30 bg-[#d6b06a]/10 px-4 py-3.5 transition active:bg-[#d6b06a]/20"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d6b06a]/20">
            <Phone className="h-4 w-4 text-[#d6b06a]" />
          </span>
          <div>
            <div className={`text-sm font-semibold ${titleColor}`}>Call Penn Liberty</div>
            <div className="text-xs text-[#d6b06a]">{PENN_PHONE}</div>
          </div>
        </a>

        {/* Email */}
        <a
          href={inquiryMailto(rental)}
          className={`mt-3 flex w-full items-center gap-3.5 rounded-[18px] border px-4 py-3.5 transition ${rowBg}`}
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <Mail className={`h-4 w-4 ${iconColor}`} />
          </span>
          <div>
            <div className={`text-sm font-semibold ${titleColor}`}>Email about this rental</div>
            <div className={`text-xs ${subColor}`}>Opens a prefilled inquiry</div>
          </div>
        </a>

        {/* Cancel */}
        <button
          onClick={onClose}
          className={`mt-4 w-full rounded-full py-3.5 text-sm font-medium ${
            lightMode ? "bg-black/[0.06] text-black/70" : "bg-white/[0.06] text-white/60"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main RentalDetailSheet ───────────────────────────────────────────────────

type RentalDetailSheetProps = {
  rental: Rental;
  lightMode: boolean;
  mutedText: string;
  /** Called when user taps "Apply Now" — parent handles opening application modal */
  onApply: (rental: Rental) => void;
  onClose: () => void;
};

export function RentalDetailSheet({
  rental,
  lightMode,
  mutedText,
  onApply,
  onClose,
}: RentalDetailSheetProps) {
  const images = rental.gallery && rental.gallery.length > 0 ? rental.gallery : [rental.image];
  const total = images.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const heroTouchStartX = useRef<number | null>(null);

  const prevPhoto = useCallback(() => setCurrentIdx((i) => (i - 1 + total) % total), [total]);
  const nextPhoto = useCallback(() => setCurrentIdx((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showGallery && !showVideo && !showContact) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, showGallery, showVideo, showContact]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Card theme tokens
  const cardBg = lightMode
    ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(250,247,243,0.99))] border-black/[0.12]"
    : "bg-[linear-gradient(180deg,rgba(8,14,26,0.97),rgba(5,10,20,0.99))] border-white/[0.09]";
  const titleColor = lightMode ? "text-black/92" : "text-white";
  const pillBg = lightMode
    ? "border-black/[0.09] bg-black/[0.04] text-black/68"
    : "border-white/[0.10] bg-white/[0.05] text-white/68";
  const dividerColor = lightMode ? "bg-black/[0.06]" : "bg-white/[0.07]";
  const ctaBg = lightMode
    ? "bg-gradient-to-t from-white via-white/95 to-transparent"
    : "bg-gradient-to-t from-[#05101e]/[0.98] via-[#05101e]/90 to-transparent";
  const outlineBtn = lightMode
    ? "border-black/14 bg-white/90 text-black/85"
    : "border-white/[0.12] bg-white/[0.04] text-white/85";
  // Primary browse action — solid neutral fill, the stronger of the two media buttons
  const photosBtn = lightMode
    ? "border-black/[0.12] bg-white/92 text-black/85"
    : "border-white/[0.14] bg-white/[0.10] text-white";
  // Secondary/optional — quiet outline; gold lives only in the play icon
  const videoBtn = lightMode
    ? "border-black/[0.10] bg-transparent text-black/65"
    : "border-white/[0.12] bg-transparent text-white/72";
  // Neutral status pill — calm dot instead of a full gold fill
  const statusPill = lightMode
    ? "border-black/[0.09] bg-black/[0.04] text-black/70"
    : "border-white/[0.10] bg-white/[0.05] text-white/72";
  const highlightCard = lightMode
    ? "border-black/[0.07] bg-black/[0.025] text-black/72"
    : "border-white/[0.08] bg-white/[0.035] text-white/65";

  return (
    <>
      {showGallery && (
        <PhotoGallery
          images={images}
          initialIndex={currentIdx}
          title={rental.title}
          onClose={() => setShowGallery(false)}
        />
      )}
      {showVideo && rental.videoUrl && (
        <VideoPlayer videoUrl={rental.videoUrl} onClose={() => setShowVideo(false)} />
      )}
      {showContact && (
        <ContactSheet rental={rental} lightMode={lightMode} onClose={() => setShowContact(false)} />
      )}

      {/* Root — data-pl-no-page-swipe prevents App.tsx global swipe handler from firing */}
      <div className="fixed inset-0 z-50" data-pl-no-page-swipe>

        {/* ── Hero image ── */}
        <div
          className="absolute inset-x-0 top-0 select-none bg-[#0a121c]"
          style={{ height: "44%" }}
          onTouchStart={(e) => { heroTouchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (heroTouchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - heroTouchStartX.current;
            heroTouchStartX.current = null;
            if (total > 1 && Math.abs(dx) > 44) (dx > 0 ? prevPhoto : nextPhoto)();
          }}
        >
          <img
            src={images[currentIdx]}
            alt={rental.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
          {/* Subtle vignette — keeps the photo clean while making controls legible */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" />

          {/* Close — above photo tap zones so it does not trigger next/prev */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-4 top-14 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/22 bg-black/42 text-white backdrop-blur-md transition active:bg-black/65"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          {total > 1 && (
            <div className="absolute bottom-5 left-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
              {currentIdx + 1} / {total}
            </div>
          )}

          {/* Invisible left / right tap zones — start below header so close stays clickable */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute bottom-0 left-0 top-16 z-[1] w-1/3"
                aria-label="Previous photo"
              />
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute bottom-0 right-0 top-16 z-[1] w-1/3"
                aria-label="Next photo"
              />
            </>
          )}
        </div>

        {/* ── Content card ── */}
        <div
          className="absolute inset-x-0 bottom-0 flex min-h-0 flex-col"
          style={{ top: "calc(44% - 12px)" }}
        >
          <div
            className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-t-[28px] border-l border-r border-t backdrop-blur-[20px] ${cardBg}`}
          >

            {/* Drag handle */}
            <div className="flex shrink-0 justify-center pt-3">
              <div className={`h-1 w-10 rounded-full ${lightMode ? "bg-black/15" : "bg-white/15"}`} />
            </div>

            {/* Fixed header */}
            <div className="shrink-0 px-6 pt-4">
              <div className="text-[2rem] font-semibold leading-none tabular-nums tracking-tight text-[#d6b06a]">
                {rental.price}
              </div>
              <h2 className={`mt-2.5 text-[1.1rem] font-semibold leading-snug tracking-tight ${titleColor}`}>
                {rental.title}
              </h2>
              {rental.address && (
                <p className={`mt-1.5 text-sm leading-relaxed ${mutedText}`}>{rental.address}</p>
              )}

              {/* Spec pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                {rental.beds != null && rental.baths != null && (
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${pillBg}`}>
                    {rental.beds} Bed · {rental.baths} Bath
                  </span>
                )}
                <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${pillBg}`}>
                  {rental.area}
                </span>
                {rental.status && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${statusPill}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d6b06a]" aria-hidden />
                    {rental.status}
                  </span>
                )}
                {rental.dateAvailable && (
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${pillBg}`}>
                    Available {rental.dateAvailable}
                  </span>
                )}
              </div>

              {/* Key features — surfaced above the fold so the best details aren't buried */}
              {!!rental.highlights?.length && (
                <p className={`mt-3.5 text-[0.8rem] leading-relaxed ${mutedText}`}>
                  {rental.highlights.slice(0, 3).map((h, i) => (
                    <span key={h}>
                      {i > 0 && <span className="px-1.5 opacity-40" aria-hidden>·</span>}
                      {h}
                    </span>
                  ))}
                </p>
              )}

              {/* Media buttons — Photos is the primary browse action; video is optional */}
              <div className="mt-5 flex gap-2.5">
                <button
                  onClick={() => setShowGallery(true)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full border py-3.5 text-[14px] font-semibold transition active:opacity-75 ${photosBtn}`}
                >
                  <Images className="h-4 w-4" />
                  {rental.videoUrl ? `${total} Photos` : `View All ${total} Photos`}
                </button>
                {rental.videoUrl && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full border py-3.5 text-[14px] font-semibold transition active:opacity-75 ${videoBtn}`}
                  >
                    <Play className="h-3.5 w-3.5 fill-[#d6b06a] text-[#d6b06a]" />
                    15s Tour
                  </button>
                )}
              </div>

              <div className={`mt-5 h-px ${dividerColor}`} />
            </div>

            {/* Scrollable details — min-h-0 required for flex overflow on iOS */}
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-32 pt-5"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {rental.description && (
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${mutedText} opacity-55`}>
                    About this rental
                  </p>
                  <p className={`mt-2.5 text-[0.95rem] leading-[1.7] ${mutedText}`}>
                    {rental.description}
                  </p>
                </div>
              )}

              {/* Remaining features beyond the 3 surfaced above the fold */}
              {(rental.highlights?.length ?? 0) > 3 && (
                <div className="mt-7">
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${mutedText} opacity-55`}>
                    More features
                  </p>
                  <div className="mt-3 space-y-2.5">
                    {rental.highlights!.slice(3).map((h) => (
                      <div key={h} className={`rounded-[16px] border px-4 py-3.5 text-sm leading-snug ${highlightCard}`}>
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(rental.securityDeposit || rental.applicationFee) && (
                <div className="mt-7">
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${mutedText} opacity-55`}>
                    Fees
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {rental.securityDeposit && (
                      <div className={`rounded-[14px] border px-4 py-3 text-sm ${highlightCard}`}>
                        <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${mutedText} opacity-50`}>Security Deposit</span>
                        <span className="mt-1 block font-medium">{rental.securityDeposit}</span>
                      </div>
                    )}
                    {rental.applicationFee && (
                      <div className={`rounded-[14px] border px-4 py-3 text-sm ${highlightCard}`}>
                        <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${mutedText} opacity-50`}>Application Fee</span>
                        <span className="mt-1 block font-medium">{rental.applicationFee}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CTA gradient fade */}
            <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-[120px] ${ctaBg}`} />

            {/* Sticky bottom CTA */}
            <div className="absolute inset-x-0 bottom-0 shrink-0 px-6 pb-8 pt-3">
              <div className="flex gap-3">
                <button
                  onClick={() => onApply(rental)}
                  className="flex-1 rounded-full bg-[#d6b06a] py-4 text-[15px] font-semibold text-[#08111f] shadow-[0_12px_28px_rgba(214,176,106,0.28)] transition active:brightness-95"
                >
                  Apply Now
                </button>
                <button
                  onClick={() => setShowContact(true)}
                  className={`flex-1 rounded-full border py-4 text-[15px] font-semibold transition active:opacity-70 ${outlineBtn}`}
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
