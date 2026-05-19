import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import type { SaleListing } from "@/lib/data";
import { listingSummary } from "@/lib/theme";

type ListingDetailsOverlayProps = {
  currentImageIndex: number;
  lightMode: boolean;
  listing: SaleListing | null;
  mutedText: string;
  onClose: () => void;
  onImageChange: (index: number) => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onScheduleTour: () => void;
};

export function ListingDetailsOverlay({
  currentImageIndex,
  lightMode,
  listing,
  mutedText: _mutedText,
  onClose,
  onImageChange,
  onNextImage,
  onPrevImage,
  onScheduleTour,
}: ListingDetailsOverlayProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") onNextImage();
      if (e.key === "ArrowLeft") onPrevImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, onNextImage, onPrevImage]);

  if (!listing) {
    return null;
  }

  const images = listing.gallery.length ? listing.gallery : [listing.image];
  const activeImage = images[currentImageIndex] ?? images[0];
  const shellText = lightMode ? "text-black" : "text-white";
  const shellBorder = lightMode ? "border-black/10" : "border-white/10";
  const quietPill = lightMode
    ? "border-black/10 bg-white/40 text-black/62"
    : "border-white/10 bg-white/[0.05] text-white/72";
  const closeButton = lightMode
    ? "border-black/10 bg-white/40 text-black"
    : "border-white/10 bg-white/[0.05] text-white";
  const secondaryButton = lightMode
    ? "rounded-full border-black/12 bg-white/40 px-6 py-6 text-black hover:bg-white/60"
    : "rounded-full border-white/15 bg-white/[0.04] px-6 py-6 text-white hover:bg-white/[0.08]";
  const detailMutedText = lightMode ? "text-black/62" : "text-white/68";
  const highlightCardClasses = lightMode
    ? "border-black/10 bg-white/34 text-black"
    : "border-white/10 bg-white/[0.05] text-white";
  const imageOverlay = lightMode
    ? "absolute inset-0 bg-[linear-gradient(to_top,rgba(12,18,28,0.18),rgba(12,18,28,0.04)_38%,rgba(12,18,28,0.01))]"
    : "absolute inset-0 bg-[linear-gradient(to_top,rgba(4,10,16,0.58),rgba(4,10,16,0.1)_38%,rgba(4,10,16,0.04))]";
  const imageControlClasses = lightMode
    ? "border-white/35 bg-white/30 text-white backdrop-blur-md hover:bg-white/42"
    : "border-white/15 bg-black/30 text-white backdrop-blur-md hover:bg-black/45";
  const counterClasses = lightMode
    ? "border-white/35 bg-white/28 text-white backdrop-blur-md"
    : "border-white/15 bg-black/35 text-white backdrop-blur-md";
  const lightShellClasses =
    "border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.46))] shadow-[0_28px_90px_rgba(12,18,28,0.14)] backdrop-blur-[20px]";

  return (
    <>
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl md:p-8 ${
        lightMode ? "bg-[rgba(9,16,26,0.18)]" : "bg-[rgba(4,10,16,0.72)]"
      }`}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`relative z-10 max-h-[92vh] w-full max-w-[1320px] overflow-hidden ${shellText} ${
          lightMode ? lightShellClasses : ""
        }`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 md:px-7 ${shellBorder}`}>
          <div className="flex flex-wrap items-center gap-2">
            {listing.mlsNumber && (
              <div className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${quietPill}`}>
                MLS# {listing.mlsNumber}
              </div>
            )}
            {listing.status && (
              <div className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${quietPill}`}>
                {listing.status}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${closeButton}`}
            aria-label="Close listing details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-73px)] overflow-y-auto xl:grid-cols-[1.15fr_0.85fr]">
          <div className={`border-b xl:border-b-0 xl:border-r ${shellBorder}`}>
            <div className="relative h-[420px] md:h-[520px] xl:h-[760px]">
              <button
                type="button"
                className="group absolute inset-0 w-full cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
                aria-label="View full screen"
              >
                <img src={activeImage} alt={listing.title} className="h-full w-full object-cover" />
                <div className={imageOverlay} />
                <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                  <Expand className="h-4 w-4" />
                </div>
              </button>

              {images.length > 1 && (
                <>
                  <button
                    onClick={onPrevImage}
                    className={`absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border transition ${imageControlClasses}`}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={onNextImage}
                    className={`absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border transition ${imageControlClasses}`}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className={`absolute bottom-5 left-5 rounded-full border px-3 py-1.5 text-sm ${counterClasses}`}>
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3 p-4 md:grid-cols-5 md:p-5">
                {images.map((image, index) => {
                  const isActive = index === currentImageIndex;
                  return (
                    <button
                      key={`${listing.id}-thumb-${index}`}
                      onClick={() => onImageChange(index)}
                      className={`overflow-hidden rounded-[18px] border transition ${
                        isActive
                          ? "border-[#d6b06a] shadow-[0_10px_24px_rgba(214,176,106,0.22)]"
                          : lightMode
                            ? "border-black/10 bg-white/42"
                            : "border-white/10 bg-white/[0.04]"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} image ${index + 1}`}
                        className="h-20 w-full object-cover md:h-24"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-5 md:p-7">
            <div className="space-y-6">
              <div>
                <div className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  {listing.price}
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{listing.title}</h2>
                <div className={`mt-3 text-base leading-relaxed ${detailMutedText}`}>{listing.address}</div>
                {listing.brokerage && (
                  <div className="mt-3 text-sm uppercase tracking-[0.18em] text-[#d6b06a]">
                    {listing.brokerage}
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <GlassCard variant={lightMode ? "frost" : "soft"} lightMode={lightMode} className={`p-4 ${shellText}`}>
                  <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Property Type</div>
                  <div className="mt-2 text-lg font-medium">{listing.propertyType ?? "Residential"}</div>
                </GlassCard>
                <GlassCard variant={lightMode ? "frost" : "soft"} lightMode={lightMode} className={`p-4 ${shellText}`}>
                  <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Overview</div>
                  <div className="mt-2 text-lg font-medium">{listingSummary(listing)}</div>
                </GlassCard>
              </div>

              {listing.description && (
                <div>
                  <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Property Description</div>
                  <p className={`mt-3 text-[1.02rem] leading-8 ${detailMutedText}`}>{listing.description}</p>
                </div>
              )}

              {!!listing.highlights?.length && (
                <div>
                  <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Highlights</div>
                  <div className="mt-3 grid gap-3">
                    {listing.highlights.map((highlight) => (
                      <div key={highlight} className={`rounded-[20px] border px-4 py-3 ${highlightCardClasses}`}>
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  className="rounded-full bg-[#d6b06a] px-6 py-6 text-[#08111f] hover:bg-[#e4be78]"
                  onClick={onScheduleTour}
                >
                  Schedule Tour
                </Button>
                <Button variant="outline" className={secondaryButton} onClick={onClose}>
                  Back to Listings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>

    {lightboxOpen && (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/94 backdrop-blur-sm"
        onClick={() => setLightboxOpen(false)}
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-md transition hover:bg-white/[0.15]"
          onClick={() => setLightboxOpen(false)}
          aria-label="Close fullscreen"
        >
          <X className="h-5 w-5" />
        </button>

        <img
          src={activeImage}
          alt={listing.title}
          className="max-h-screen max-w-full object-contain px-14 py-14"
          onClick={(e) => e.stopPropagation()}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-md transition hover:bg-white/[0.15]"
              onClick={(e) => { e.stopPropagation(); onPrevImage(); }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-md transition hover:bg-white/[0.15]"
              onClick={(e) => { e.stopPropagation(); onNextImage(); }}
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/50 px-4 py-1.5 text-sm text-white backdrop-blur-md">
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    )}
  </>
  );
}
