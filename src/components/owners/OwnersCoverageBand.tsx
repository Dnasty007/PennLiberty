import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { ownersCoveragePinOffsets, ownersNeighborhoods } from "@/lib/owners";

type OwnersCoverageBandProps = {
  editorialHeroSrc: string;
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
};

export function OwnersCoverageBand({
  editorialHeroSrc,
  lightMode,
  mutedText,
  subtleText,
}: OwnersCoverageBandProps) {
  const eyebrow = lightMode ? "text-[#926d28]" : "text-[#ceb47d]/95";
  const heading = lightMode ? "text-black" : "text-white";
  const insetBox = lightMode
    ? "border-black/[0.08] bg-white/[0.42]"
    : "border-white/[0.08] bg-[rgba(255,255,255,0.027)]";
  const insetLabel = lightMode ? "text-[#926d28]" : "text-[#dcb672]/92";
  const insetBody = mutedText;
  const footerRule = lightMode ? "border-black/[0.08]" : "border-white/[0.07]";
  const footerInk = subtleText;

  const frameOuter = lightMode
    ? "border-black/[0.10] bg-white/[0.28] shadow-[inset_0_0_0_1px_rgba(214,176,106,0.1)]"
    : "border-white/[0.12] bg-[rgba(13,23,39,0.55)] shadow-[inset_0_0_0_1px_rgba(214,176,106,0.08)]";

  const imageWell = lightMode
    ? "border-black/[0.12] bg-[#e8e4dc]"
    : "border-white/14 bg-[#111a27]";
  const imageScrim = lightMode
    ? "bg-[linear-gradient(to_bottom,rgba(255,253,247,0.08),rgba(40,44,52,0.18))]"
    : "bg-[linear-gradient(to_bottom,rgba(6,16,29,0.12),rgba(6,16,29,0.48))]";

  const chipOuter = lightMode
    ? "border-black/[0.18] bg-white/[0.72] text-black shadow-md"
    : "border-white/[0.2] bg-black/[0.55] text-white shadow-lg backdrop-blur-md";

  const glassExtras = `${lightMode ? "ring-1 ring-black/[0.04]" : `${listingsRailChromeClass} ring-1 ring-white/[0.06]`}`;

  return (
    <section aria-labelledby="owners-coverage-heading">
      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`p-6 md:p-7 ${glassExtras}`}
      >
        <div className="relative z-10 grid gap-10 xl:grid-cols-[minmax(252px,300px)_minmax(0,1fr)] xl:gap-11 xl:items-stretch">
          <div className="order-2 flex flex-col justify-center xl:order-1">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>Metro coverage</p>
            <h2
              id="owners-coverage-heading"
              className={`mt-3 text-[1.875rem] font-semibold tracking-tight md:text-[2rem] xl:text-[2.125rem] ${heading}`}
            >
              Philadelphia blocks, not flyover markets.
            </h2>
            <p className={`mt-4 text-[0.9675rem] leading-relaxed md:text-[1rem] md:leading-[1.6] ${mutedText}`}>
              We operate where rowhomes meet investors and reliable tenants stick. Pins are illustrative;
              neighborhoods are familiar ground, from Northern Liberties to South Philly corridors, owners get the
              same playbook.
            </p>
            <div className={`mt-7 rounded-2xl border px-5 py-4 ${insetBox}`}>
              <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${insetLabel}`}>Corridor snapshot</div>
              <p className={`mt-4 text-[13px] leading-relaxed ${insetBody}`}>
                Disciplined marketing, lawful screening, clear reporting, and local vendors who pick up when something
                breaks. All documented in-platform so expectations stay lined up with reality.
              </p>
              <p className={`mt-5 border-t pt-4 text-[12px] leading-relaxed ${footerRule} ${footerInk}`}>
                Chips on the image are illustrative, not GIS pins. Will upgrade cleanly when live map data is ready.
              </p>
            </div>
          </div>

          <div className={`order-1 overflow-hidden rounded-[26px] border p-4 md:p-5 xl:order-2 ${frameOuter}`}>
            <div className={`relative isolate min-h-[min(420px,55vh)] overflow-hidden rounded-[22px] border md:rounded-[24px] xl:min-h-[min(544px,calc(85vh))] ${imageWell}`}>
              <span className="sr-only">Philadelphia neighborhoods we actively manage alongside owners.</span>
              <img
                src={editorialHeroSrc}
                alt=""
                loading="lazy"
                decoding="async"
                role="presentation"
                className="pointer-events-none absolute inset-0 z-0 size-full object-cover object-[center_42%]"
              />
              <div className={`pointer-events-none absolute inset-0 z-[1] ${imageScrim}`} />
              {ownersNeighborhoods.map((tile, index) => {
                const offset =
                  ownersCoveragePinOffsets[index % ownersCoveragePinOffsets.length] ??
                  ownersCoveragePinOffsets[0];
                return (
                  <div
                    key={`cov-${tile.key}`}
                    className="pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-1/2"
                    style={{ top: offset.top, left: offset.left }}
                  >
                    <div className={`max-w-[10rem] rounded-2xl px-2.5 py-1.5 text-center text-xs font-semibold backdrop-blur-md ${chipOuter}`}>
                      {tile.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
