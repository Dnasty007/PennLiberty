import { ChevronRight, MapPin } from "lucide-react";
import { rentalsHeroBlankBaseSrc, rentalsHeroFramingBySrc } from "@/lib/siteImagery";

/** Compact branded hero for the mobile Rentals page (<md). No pins / physics /
 *  Invaders — just a short photo band with the unit count and a jump-to-list CTA. */
type RentalsHeroStripMobileProps = {
  rentalsHeroSrc: string;
  count: number;
};

export function RentalsHeroStripMobile({ rentalsHeroSrc, count }: RentalsHeroStripMobileProps) {
  const hasBg = !rentalsHeroBlankBaseSrc.has(rentalsHeroSrc);
  const framing = rentalsHeroFramingBySrc[rentalsHeroSrc];

  const scrollToList = () => {
    document.getElementById("rentals-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative isolate flex min-h-[208px] flex-col justify-end overflow-hidden rounded-[26px] border border-[#d6b06a]/18 bg-[#0f1824] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      {hasBg && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `url("${rentalsHeroSrc}")`,
            backgroundSize: framing?.backgroundSize ?? "cover",
            backgroundPosition: framing?.backgroundPosition ?? "50% 80%",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,rgba(6,10,18,0.22),rgba(5,10,18,0.74))]" />

      <div className="relative z-[2] flex flex-col gap-3 p-5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/16 bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#d6b06a]" aria-hidden />
          Philadelphia metro
        </span>

        <div>
          <p className="text-[1.6rem] font-semibold leading-none tracking-tight text-white">
            {count} available now
          </p>
          <p className="mt-1.5 text-sm text-white/72">Tap a unit for photos, tour &amp; apply.</p>
        </div>

        <button
          type="button"
          onClick={scrollToList}
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#d6b06a] px-5 py-2.5 text-sm font-semibold text-[#08111f] shadow-[0_12px_28px_rgba(214,176,106,0.28)] transition active:brightness-95"
        >
          Browse listings
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
