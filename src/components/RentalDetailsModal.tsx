import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, CalendarCheck, ClipboardList } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import type { Rental } from "@/lib/data";

type RentalDetailsModalProps = {
  rental: Rental;
  lightMode: boolean;
  onClose: () => void;
  onApply: () => void;
  onScheduleShowing: () => void;
};

export function RentalDetailsModal({
  rental,
  lightMode,
  onClose,
  onApply,
  onScheduleShowing,
}: RentalDetailsModalProps) {
  const images = rental.gallery?.length ? rental.gallery : [rental.image];
  const [currentIdx, setCurrentIdx] = useState(0);

  const activeImage = images[currentIdx] ?? images[0];
  const total = images.length;

  const prevImage = () => setCurrentIdx((i) => (i - 1 + total) % total);
  const nextImage = () => setCurrentIdx((i) => (i + 1) % total);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const shellText = lightMode ? "text-black" : "text-white";
  const shellBorder = lightMode ? "border-black/10" : "border-white/10";
  const closeButton = lightMode
    ? "border-black/10 bg-white/40 text-black"
    : "border-white/10 bg-white/[0.05] text-white";
  const quietPill = lightMode
    ? "border-black/10 bg-white/40 text-black/62"
    : "border-white/10 bg-white/[0.05] text-white/72";
  const detailMutedText = lightMode ? "text-black/62" : "text-white/68";
  const imageControlClasses = lightMode
    ? "border-white/35 bg-white/30 text-white backdrop-blur-md hover:bg-white/42"
    : "border-white/15 bg-black/30 text-white backdrop-blur-md hover:bg-black/45";
  const counterClasses = lightMode
    ? "border-white/35 bg-white/28 text-white backdrop-blur-md"
    : "border-white/15 bg-black/35 text-white backdrop-blur-md";
  const secondaryButton = lightMode
    ? "rounded-full border-black/12 bg-white/40 px-6 py-6 text-black hover:bg-white/60"
    : "rounded-full border-white/15 bg-white/[0.04] px-6 py-6 text-white hover:bg-white/[0.08]";
  const lightShellClasses =
    "border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.46))] shadow-[0_28px_90px_rgba(12,18,28,0.14)] backdrop-blur-[20px]";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl md:p-8 ${
        lightMode ? "bg-[rgba(9,16,26,0.18)]" : "bg-[rgba(4,10,16,0.72)]"
      }`}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`relative z-10 max-h-[92vh] w-full max-w-[1180px] overflow-hidden ${shellText} ${
          lightMode ? lightShellClasses : ""
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 md:px-7 ${shellBorder}`}>
          <div className="flex flex-wrap items-center gap-2">
            {rental.mlsNumber && (
              <div className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${quietPill}`}>
                MLS# {rental.mlsNumber}
              </div>
            )}
            <div className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${quietPill}`}>
              For Rent
            </div>
          </div>
          <button
            onClick={onClose}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${closeButton}`}
            aria-label="Close rental details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid max-h-[calc(92vh-73px)] overflow-y-auto xl:grid-cols-[1.2fr_0.8fr]">
          {/* Image panel */}
          <div className={`border-b xl:border-b-0 xl:border-r ${shellBorder}`}>
            <div className="relative h-[340px] md:h-[480px] xl:h-[680px]">
              <img src={activeImage} alt={rental.title} className="h-full w-full object-cover" />
              <div
                className={`pointer-events-none absolute inset-0 ${
                  lightMode
                    ? "bg-[linear-gradient(to_top,rgba(12,18,28,0.18),transparent_38%)]"
                    : "bg-[linear-gradient(to_top,rgba(4,10,16,0.58),transparent_38%)]"
                }`}
              />

              {total > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className={`absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border transition ${imageControlClasses}`}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className={`absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border transition ${imageControlClasses}`}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className={`absolute bottom-4 left-4 rounded-full border px-3 py-1.5 text-sm ${counterClasses}`}>
                {currentIdx + 1} / {total}
              </div>
            </div>

            {/* Thumbnail strip */}
            {total > 1 && (
              <div className="grid grid-cols-4 gap-3 p-4 md:grid-cols-5 md:p-5">
                {images.map((img, index) => {
                  const isActive = index === currentIdx;
                  return (
                    <button
                      key={`thumb-${rental.id}-${index}`}
                      onClick={() => setCurrentIdx(index)}
                      className={`overflow-hidden rounded-[14px] border transition ${
                        isActive
                          ? "border-[#d6b06a] shadow-[0_8px_20px_rgba(214,176,106,0.22)]"
                          : lightMode
                            ? "border-black/10 bg-white/42"
                            : "border-white/10 bg-white/[0.04]"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${rental.title} photo ${index + 1}`}
                        className="h-16 w-full object-cover md:h-20"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details panel */}
          <div className="p-5 md:p-7">
            <div className="space-y-5">
              {/* Price + title + address */}
              <div>
                <div className={`text-4xl font-semibold tracking-tight md:text-5xl ${lightMode ? "text-black" : "text-white"}`}>
                  {rental.price}
                </div>
                <h2 className={`mt-2 text-2xl font-semibold md:text-3xl ${lightMode ? "text-black" : "text-white"}`}>
                  {rental.title}
                </h2>
                {rental.address && (
                  <div className={`mt-2 text-base leading-relaxed ${detailMutedText}`}>
                    {rental.address}
                  </div>
                )}
                <div className={`mt-3 text-[0.9375rem] leading-relaxed ${detailMutedText}`}>
                  {rental.meta}
                </div>
              </div>

              {/* Area badge */}
              <div className={`inline-flex items-center rounded-full border px-4 py-2 text-sm ${quietPill}`}>
                {rental.area}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  className="rounded-full bg-[#d6b06a] px-6 py-6 text-[#08111f] hover:bg-[#e4be78]"
                  onClick={onScheduleShowing}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden />
                    Schedule a Showing
                  </span>
                </Button>
                <Button variant="outline" className={secondaryButton} onClick={onApply}>
                  <span className="inline-flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
                    Submit Application
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
