import { ChevronRight, MapPin, Play } from "lucide-react";
import { CardImageCycler } from "@/components/CardImageCycler";
import type { Rental } from "@/lib/data";

/** Mobile-native rental card (<md). Tokens aligned with RentalDetailSheet so
 *  browse → detail feels like one product. Tap opens the detail sheet — there is
 *  no inline "apply" here; the sheet's sticky CTA owns that. */
type RentalListingCardMobileProps = {
  rental: Rental;
  lightMode: boolean;
  mutedText: string;
  onOpen: () => void;
};

export function RentalListingCardMobile({
  rental,
  lightMode,
  mutedText,
  onOpen,
}: RentalListingCardMobileProps) {
  return (
    <article
      className={`flex cursor-pointer flex-col overflow-hidden rounded-[26px] border transition-transform active:scale-[0.99] ${
        lightMode
          ? "border-black/[0.08] bg-gradient-to-br from-white/90 to-white/50 shadow-[0_16px_44px_rgba(12,18,28,0.09)]"
          : "border-white/[0.09] bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_18px_50px_rgba(0,0,0,0.32)]"
      }`}
      onClick={onOpen}
    >
      <div className="relative isolate aspect-[4/3] w-full shrink-0 overflow-hidden bg-[#0f1824]">
        <CardImageCycler
          images={rental.gallery?.length ? rental.gallery : [rental.image]}
          alt={rental.title}
          interval={4000}
          lightMode={lightMode}
        />
        {/* Soft top + bottom vignette only — keeps the photo clean */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a11]/55 via-transparent to-[#050a11]/30" />

        {/* Neighborhood — top-left */}
        <div className="absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full border border-white/18 bg-black/45 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
          <MapPin className="h-3 w-3 shrink-0 text-[#d6b06a]" aria-hidden />
          <span className="truncate">{rental.area}</span>
        </div>

        {/* Video tour indicator — bottom-left, matches the detail sheet's play affordance */}
        {rental.videoUrl && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-[#d6b06a]/45 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-[#f4dfb4] backdrop-blur-md">
            <Play className="h-3 w-3 shrink-0 fill-[#d6b06a] text-[#d6b06a]" aria-hidden />
            15s tour
          </div>
        )}
      </div>

      <div className="flex flex-col px-5 pb-5 pt-4">
        {/* Price — prominent gold, same hue as the detail sheet */}
        <div className="text-[1.6rem] font-semibold leading-none tabular-nums tracking-tight text-[#d6b06a]">
          {rental.price}
        </div>
        <h3 className={`mt-2.5 text-[1.05rem] font-semibold leading-snug tracking-tight ${lightMode ? "text-black/92" : "text-white"}`}>
          {rental.title}
        </h3>

        {/* Calm spec pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            lightMode
              ? "border-black/[0.09] bg-black/[0.04] text-black/68"
              : "border-white/[0.10] bg-white/[0.05] text-white/68"
          }`}>
            {rental.beds} Bed · {rental.baths} Bath
          </span>
          {rental.status && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
              lightMode
                ? "border-black/[0.09] bg-black/[0.04] text-black/70"
                : "border-white/[0.10] bg-white/[0.05] text-white/72"
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#d6b06a]" aria-hidden />
              {rental.status}
            </span>
          )}
        </div>

        {/* Tap affordance */}
        <div className={`mt-4 flex items-center justify-between border-t pt-3.5 ${lightMode ? "border-black/[0.07]" : "border-white/[0.07]"}`}>
          <span className={`text-sm font-medium ${mutedText}`}>View details</span>
          <ChevronRight className="h-4 w-4 text-[#d6b06a]" aria-hidden />
        </div>
      </div>
    </article>
  );
}
