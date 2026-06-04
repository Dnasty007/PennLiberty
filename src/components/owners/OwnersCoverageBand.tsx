import { useEffect, useRef, useState } from "react";
import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { ownersCoveragePinOffsets, ownersPinOffsetsBySrc, ownersNeighborhoods } from "@/lib/owners";
import { ownersCoverageFramingBySrc } from "@/lib/siteImagery";

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
  const [pinMode, setPinMode] = useState(false);
  const basePins = (ownersPinOffsetsBySrc[editorialHeroSrc] ?? ownersCoveragePinOffsets).map(
    (p) => ({ top: p.top, left: p.left }),
  );
  const [pinPositions, setPinPositions] = useState(basePins);

  /* reset pin positions when the image changes */
  const prevSrcRef = useRef(editorialHeroSrc);
  useEffect(() => {
    if (prevSrcRef.current === editorialHeroSrc) return;
    prevSrcRef.current = editorialHeroSrc;
    const next = (ownersPinOffsetsBySrc[editorialHeroSrc] ?? ownersCoveragePinOffsets).map(
      (p) => ({ top: p.top, left: p.left }),
    );
    setPinPositions(next);
  }, [editorialHeroSrc]);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{
    idx: number; startX: number; startY: number; startLeft: number; startTop: number;
  } | null>(null);

  /* listen for pin-mode toggle from DevImageEditor */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onToggle = (e: Event) => setPinMode((e as CustomEvent<boolean>).detail);
    window.addEventListener("pl-pin-mode", onToggle);
    return () => window.removeEventListener("pl-pin-mode", onToggle);
  }, []);

  /* broadcast positions + current src back to DevImageEditor whenever they change */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // broadcast immediately when pin mode turns on, and on every position/image change
    window.dispatchEvent(new CustomEvent("pl-pin-positions", { detail: { positions: pinPositions, src: editorialHeroSrc } }));
  }, [pinPositions, editorialHeroSrc]);

  /* also broadcast on pin mode toggle so the panel updates right away */
  useEffect(() => {
    if (!import.meta.env.DEV || !pinMode) return;
    window.dispatchEvent(new CustomEvent("pl-pin-positions", { detail: { positions: pinPositions, src: editorialHeroSrc } }));
  }, [pinMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChipMouseDown = (idx: number, e: React.MouseEvent) => {
    if (!pinMode) return;
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cur = pinPositions[idx] ?? { top: "50%", left: "50%" };
    draggingRef.current = {
      idx,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: parseFloat(cur.left),
      startTop: parseFloat(cur.top),
    };
    const onMove = (me: MouseEvent) => {
      const d = draggingRef.current;
      if (!d) return;
      const nl = Math.max(0, Math.min(100, d.startLeft + ((me.clientX - d.startX) / rect.width) * 100));
      const nt = Math.max(0, Math.min(100, d.startTop + ((me.clientY - d.startY) / rect.height) * 100));
      setPinPositions((prev) => prev.map((p, i) => i === d.idx ? { top: `${nt.toFixed(1)}%`, left: `${nl.toFixed(1)}%` } : p));
    };
    const onUp = () => { draggingRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
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
    ? "border-[#d6b06a]/40 bg-white/[0.82] text-black shadow-[0_4px_18px_rgba(0,0,0,0.18),0_0_0_1px_rgba(214,176,106,0.25)]"
    : "border-[#d6b06a]/30 bg-black/[0.62] text-white shadow-[0_4px_22px_rgba(0,0,0,0.5),0_0_0_1px_rgba(214,176,106,0.18)] backdrop-blur-md";

  const glassExtras = `${lightMode ? "ring-1 ring-black/[0.04]" : `${listingsRailChromeClass} ring-1 ring-white/[0.06]`}`;

  const framing =
    editorialHeroSrc in ownersCoverageFramingBySrc
      ? ownersCoverageFramingBySrc[editorialHeroSrc as keyof typeof ownersCoverageFramingBySrc]
      : { objectPosition: "center 42%" as const };

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
            <div
              ref={containerRef}
              className={`relative isolate min-h-[min(420px,55vh)] overflow-hidden rounded-[22px] border md:rounded-[24px] xl:min-h-[min(544px,calc(85vh))] ${imageWell}`}
            >
              <span className="sr-only">Philadelphia neighborhoods we actively manage alongside owners.</span>
              <img
                src={editorialHeroSrc}
                alt=""
                loading="lazy"
                decoding="async"
                role="presentation"
                className="pointer-events-none absolute inset-0 z-0 size-full transform object-cover"
                style={{
                  objectPosition: framing.objectPosition,
                  transform: framing.scale ? `scale(${framing.scale})` : undefined,
                }}
              />
              <div className={`pointer-events-none absolute inset-0 z-[1] ${imageScrim}`} />
              {ownersNeighborhoods.map((tile, index) => {
                const offset = pinPositions[index] ??
                  ownersCoveragePinOffsets[index % ownersCoveragePinOffsets.length] ??
                  ownersCoveragePinOffsets[0];
                return (
                  <div
                    key={`cov-${tile.key}`}
                    className={`coverage-chip absolute z-[2] -translate-x-1/2 -translate-y-1/2 ${pinMode ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
                    style={{ top: offset.top, left: offset.left }}
                    onMouseDown={pinMode ? (e) => onChipMouseDown(index, e) : undefined}
                  >
                    <div className={`max-w-[10rem] rounded-2xl border px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide backdrop-blur-md ${chipOuter} ${pinMode ? "ring-2 ring-[#d6b06a]/60 select-none" : ""}`}>
                      {tile.name}
                    </div>
                  </div>
                );
              })}
              {pinMode && (
                <div className="pointer-events-none absolute bottom-2 left-1/2 z-[3] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[9px] font-bold text-[#d6b06a] backdrop-blur-sm">
                  PIN MODE — drag chips to reposition
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
