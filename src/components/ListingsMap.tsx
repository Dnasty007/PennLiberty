import { Suspense, lazy, useEffect, useState } from "react";
import { MapPin, MapPinned, Search } from "lucide-react";
import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { ListingDetailsOverlay } from "@/components/ListingDetailsOverlay";
import { ScheduleTourModal } from "@/components/ScheduleTourModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SaleListing } from "@/lib/data";
import { listingSummary } from "@/lib/theme";

const ListingExplorerLeaflet = lazy(() => import("@/components/ListingExplorerLeaflet"));

/** Copy displayed on the city teaser before the Leaflet layer loads. */
function listingTeaserBlurb(listing: SaleListing): string {
  const d = listing.description?.trim();
  if (d) return d;
  if (listing.highlights?.length) {
    return listing.highlights.slice(0, 5).join(" · ");
  }
  return listingSummary(listing);
}

type ListingsMapProps = {
  filteredListings: SaleListing[];
  lightMode: boolean;
  /** Rotating wide city shot — map teaser backdrop only */
  listingsMapTeaserSrc: string;
  listingSearch: string;
  mutedText: string;
  onCloseListingDetails: () => void;
  onCloseScheduleTour: () => void;
  onImageChange: (index: number) => void;
  onNextImage: () => void;
  onOpenListingDetails: () => void;
  onOpenScheduleTour: () => void;
  onPrevImage: () => void;
  onSearchChange: (value: string) => void;
  onSelectListing: (id: number) => void;
  outlineButtonClasses: string;
  selectedGalleryImageIndex: number;
  selectedListing: SaleListing;
  showListingDetails: boolean;
  showScheduleTour: boolean;
  subtleText: string;
  tourForm: {
    name: string;
    email: string;
    phone: string;
  };
  onTourFormChange: (value: { name: string; email: string; phone: string }) => void;
  onTourSubmit: () => void;
};

function useReducedMotionPreferred() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setReduced(mq.matches);
    }

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function ListingsMap({
  filteredListings,
  lightMode,
  listingsMapTeaserSrc,
  listingSearch,
  mutedText,
  onCloseListingDetails,
  onCloseScheduleTour,
  onImageChange,
  onNextImage,
  onOpenListingDetails,
  onOpenScheduleTour,
  onPrevImage,
  onSearchChange,
  onSelectListing,
  outlineButtonClasses,
  selectedGalleryImageIndex,
  selectedListing,
  showListingDetails,
  showScheduleTour,
  subtleText,
  tourForm,
  onTourFormChange,
  onTourSubmit,
}: ListingsMapProps) {
  const selectedPreviewImage = selectedListing.gallery[0] || selectedListing.image;

  const reduceMotion = useReducedMotionPreferred();
  const fadeMs = reduceMotion ? 120 : 750;

  const [leafletMounted, setLeafletMounted] = useState(false);
  const [teaserFade, setTeaserFade] = useState(false);
  const [teaserGone, setTeaserGone] = useState(false);
  const [teaserDescExpanded, setTeaserDescExpanded] = useState(false);

  const activateMap = () => {
    if (leafletMounted) return;
    setLeafletMounted(true);

    queueMicrotask(() => {
      setTeaserFade(true);
      window.setTimeout(() => setTeaserGone(true), fadeMs);
    });
  };

  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    selectedListing.address,
  )}`;

  const teaserParagraph = listingTeaserBlurb(selectedListing);
  const showTeaserStory = !leafletMounted;

  return (
    <section className="space-y-4 md:space-y-5">
      {/* Editorial band — typography on global ambience (matches Home headline column). */}
      <div className="max-w-4xl">
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
            lightMode
              ? "border-black/10 bg-white/45 text-black/78 backdrop-blur-xl"
              : "border-white/15 bg-white/[0.012] text-white/82 backdrop-blur-xl"
          }`}
        >
          <MapPinned className="h-4 w-4 text-[#d6b06a]" aria-hidden />
          <span>Philadelphia metro</span>
        </div>

        <div className={`text-xs font-semibold uppercase tracking-[0.22em] ${subtleText}`}>Listings</div>

        <h1
          className={`mt-3 max-w-4xl font-semibold leading-[0.92] tracking-[-1.5px] text-[2.85rem] sm:text-[3.35rem] md:text-[4.05rem] lg:text-[4.85rem] ${
            lightMode ? "text-black" : "text-white"
          }`}
        >
          Explore Philadelphia listings.
        </h1>

        <p className={`mt-5 max-w-2xl text-[1.05rem] leading-snug md:text-[1.28rem] ${mutedText}`}>
          Browse active MLS highlights, filter with search, then open the live map when you want
          geographic context. Full photos and tour requests stay one click away.
        </p>

        <div className="mt-8 w-full max-w-xl">
          <label className={`sr-only ${lightMode ? "text-black" : "text-white"}`}>Search listings</label>
          <div className="relative">
            <Search
              className={`pointer-events-none absolute left-4 top-1/2 z-[1] h-[18px] w-[18px] -translate-y-1/2 md:left-4 ${
                lightMode ? "text-black/58" : "text-white/45"
              }`}
              aria-hidden
            />
            <Input
              value={listingSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Street, ZIP, MLS, price…"
              className={
                lightMode
                  ? "h-[50px] rounded-full border border-black/12 bg-white/60 py-5 pl-11 pr-4 text-[15px] text-black shadow-sm transition placeholder:text-black/40 focus-visible:border-[#d6b06a]/55 focus-visible:ring-[#d6b06a]/25 md:pl-12"
                  : "h-[50px] rounded-full border border-white/18 bg-white/[0.07] py-5 pl-11 pr-4 text-[15px] text-white transition placeholder:text-white/45 focus-visible:border-[#d6b06a]/45 focus-visible:ring-[#d6b06a]/25 md:pl-12"
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:gap-6">
        <GlassCard
          variant={lightMode ? "frost" : "chrome"}
          lightMode={lightMode}
          className={`overflow-visible px-5 py-6 md:px-7 md:py-8 ${lightMode ? "ring-1 ring-black/[0.04]" : "ring-1 ring-white/[0.06]"} ${lightMode ? "" : listingsRailChromeClass}`}
        >
          <div className="mb-6 md:mb-8">
            <div
              className={`h-px w-12 rounded-full md:w-14 ${lightMode ? "bg-[#d6b06a]/55" : "bg-[#d6b06a]/65"}`}
              aria-hidden
            />
            <p className={`mt-4 text-[10px] font-bold uppercase tracking-[0.28em] ${subtleText}`}>Live inventory</p>
            <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <h2 className={`text-xl font-semibold tracking-tight md:text-[1.35rem] ${lightMode ? "text-black" : "text-white"}`}>
                Active listings
              </h2>
              <p className={`text-sm ${mutedText}`}>
                <span className="font-semibold tabular-nums text-[#d6b06a]">{filteredListings.length}</span>
                {" · "}Map updates below
              </p>
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <p className={`py-10 text-center text-sm ${mutedText}`}>Nothing matches your search — try adjusting filters.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {filteredListings.map((listing) => {
                const isSelected = selectedListing.id === listing.id;

                return (
                  <li key={listing.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectListing(listing.id);
                        setTeaserDescExpanded(false);
                      }}
                      className={`group relative flex min-h-[200px] w-full flex-col overflow-hidden rounded-[20px] text-left outline-none ring-offset-4 transition-[box-shadow,border-color,transform] duration-300 md:min-h-0 md:rounded-[23px] ${
                        lightMode
                          ? isSelected
                            ? "border border-[#d6b06a]/55 bg-white/70 shadow-[0_26px_64px_rgba(214,176,106,0.16)] ring-2 ring-[#d6b06a]/40 ring-offset-transparent"
                            : "border border-black/[0.07] bg-white/45 shadow-[0_14px_40px_rgba(12,18,28,0.06)] hover:border-[#d6b06a]/35 hover:bg-white/[0.88] hover:shadow-[0_22px_56px_rgba(12,18,28,0.11)] focus-visible:border-[#d6b06a]/50 focus-visible:ring-2 focus-visible:ring-[#d6b06a]/35"
                          : isSelected
                            ? "border border-[#d6b06a]/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02))] shadow-[0_28px_80px_rgba(0,0,0,0.55)] ring-2 ring-[#d6b06a]/40 ring-offset-transparent"
                            : "border border-white/[0.09] bg-white/[0.025] shadow-[0_14px_48px_rgba(0,0,0,0.28)] hover:border-[#d6b06a]/22 hover:bg-white/[0.055] hover:shadow-[0_22px_60px_rgba(0,0,0,0.38)] focus-visible:border-[#d6b06a]/40 focus-visible:ring-2 focus-visible:ring-[#d6b06a]/30"
                      } ring-offset-transparent ${reduceMotion ? "" : "motion-safe:hover:-translate-y-[2px]"}`}
                    >
                      <div className="relative isolate aspect-[4/3] shrink-0 overflow-hidden bg-[#0a121c]">
                        <img
                          src={listing.image}
                          alt={listing.title}
                          loading="lazy"
                          className={`h-full w-full object-cover transition-[transform] duration-500 ease-out will-change-transform ${reduceMotion ? "" : "motion-safe:group-hover:scale-[1.045]"} ${isSelected ? "brightness-[1.04] saturate-[1.05]" : "saturate-[0.94] motion-safe:group-hover:saturate-100"}`}
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-t-[inherit] ring-1 ring-inset ring-white/10" aria-hidden />

                        {/* Photo read: price + tonal wash */}
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a11]/92 via-[#050a11]/35 to-transparent"
                          aria-hidden
                        />
                        {isSelected ? (
                          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center rounded-full bg-black/52 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#f4dfb4] ring-1 ring-[#d6b06a]/40 backdrop-blur-md">
                            Selected
                          </span>
                        ) : listing.status ? (
                          <span
                            className={`pointer-events-none absolute left-3 top-3 inline-flex max-w-[calc(100%-1rem)] truncate rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] ring-1 backdrop-blur-md sm:top-3.5 ${
                              lightMode
                                ? "bg-white/82 text-black/60 ring-black/12"
                                : "bg-black/48 text-[#efd9a9]/98 ring-white/14"
                            }`}
                          >
                            {listing.status}
                          </span>
                        ) : null}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end px-3 pb-3 pt-14 md:px-3.5 md:pb-3.5">
                          <p
                            className={`drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] text-[clamp(1.06rem,3.8vw,1.28rem)] font-semibold tabular-nums tracking-[-0.02em] ${
                              isSelected ? "text-[#f8e9c8]" : "text-white"
                            }`}
                          >
                            {listing.price}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-2 px-3.5 pb-3.5 pt-3 md:gap-2.5 md:px-4 md:pb-4 md:pt-3.5">
                        {listing.status && isSelected ? (
                          <div className="line-clamp-2 text-[9px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-[#d6b06a]/80">
                            {listing.status}
                          </div>
                        ) : null}

                        <div className="min-h-[2.5rem] md:min-h-[2.75rem]">
                          <span
                            className={`block line-clamp-2 font-semibold leading-snug tracking-[-0.015em] ${
                              lightMode ? "text-[15px] text-black/92 md:text-base" : "text-[15px] text-white/[0.95] md:text-base"
                            }`}
                          >
                            {listing.title}
                          </span>
                        </div>
                        <div className={`mt-auto flex items-start gap-1.5 pt-0.5 text-[11px] leading-snug md:text-xs ${mutedText}`}>
                          <MapPin className="mt-[2px] h-3.5 w-3.5 shrink-0 opacity-55" aria-hidden />
                          <span className="line-clamp-2">{listing.address}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <GlassCard
          variant={lightMode ? "frost" : "chrome"}
          lightMode={lightMode}
          className={`h-fit overflow-visible border-[#d6b06a]/15 p-4 shadow-[0_32px_90px_rgba(0,0,0,0.14)] md:p-6 xl:sticky xl:top-[max(calc(env(safe-area-inset-top)+5.75rem),5.75rem)] xl:z-[1] xl:self-start ${lightMode ? "" : listingsRailChromeClass}`}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="relative min-h-[400px] overflow-hidden rounded-[28px] border border-[#d6b06a]/20 bg-[#0f1824] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] md:min-h-[560px]">
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto absolute right-6 top-2.5 z-[3] inline-flex shrink-0 items-center rounded-full border border-white/18 bg-black/54 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-white/32 hover:bg-black/62 sm:right-7 sm:top-3"
              >
                Open selection in Maps
              </a>

              <div
                className={`absolute inset-0 z-[1] bg-[#0a121c] transition-opacity duration-750 ${leafletMounted ? "opacity-100" : "opacity-0"}`}
              >
                <Suspense
                  fallback={
                    <div className="flex h-full min-h-[400px] w-full animate-pulse items-center justify-center text-sm text-white/45 md:min-h-[560px]">
                      Loading interactive map…
                    </div>
                  }
                >
                  {leafletMounted && (
                    <ListingExplorerLeaflet
                      filteredListings={filteredListings}
                      selectedListingId={selectedListing.id}
                      lightMode={lightMode}
                      onSelectListing={onSelectListing}
                    />
                  )}
                </Suspense>
              </div>

              {!teaserGone && (
                <div
                  className={`pointer-events-none absolute inset-0 z-[2] transition-opacity print:hidden ${
                    teaserFade ? "opacity-0" : "opacity-100"
                  }`}
                  style={{ transitionDuration: `${fadeMs}ms` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,10,18,0.05),rgba(4,12,22,0.5))]" />
                  <div className="absolute inset-0">
                    <img
                      src={listingsMapTeaserSrc}
                      alt="Philadelphia skyline — map preview"
                      className="h-full w-full scale-[1.03] object-cover object-[center_35%]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,12,26,0.72)_0%,rgba(10,18,26,0.22)_42%,transparent_78%)]" />
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 48px), repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 48px)",
                    }}
                  />

                  {showTeaserStory ? (
                    <>
                      <div
                        className="pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(ellipse_92%_75%_at_50%_44%,rgba(2,10,22,0.78)_0%,rgba(10,18,26,0.22)_56%,transparent_74%)]"
                        aria-hidden
                      />
                      <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-6 pb-[5.75rem] pt-[4.75rem] sm:px-8 md:pb-24 md:pt-28">
                        <div className="pointer-events-auto w-full max-w-lg rounded-[22px] border border-white/18 bg-black/62 px-5 py-4 shadow-[0_24px_56px_rgba(0,0,0,0.5)] backdrop-blur-xl md:max-h-[min(48vh,340px)] md:max-w-xl md:overflow-y-auto">
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e8cc8b]">
                          Selected listing
                        </div>
                        <div className="mt-2 text-base font-semibold leading-snug text-white">
                          {selectedListing.title}
                        </div>
                        <div className={`mt-1 text-xs leading-relaxed text-white/62`}>{selectedListing.address}</div>
                        <p
                          className={`mt-3 text-sm leading-relaxed text-white/82 ${
                            teaserDescExpanded ? "max-h-[min(220px,32vh)] overflow-y-auto pr-1" : "line-clamp-5"
                          }`}
                        >
                          {teaserParagraph}
                        </p>
                        {(teaserParagraph.length > 180 || teaserDescExpanded) && (
                          <button
                            type="button"
                            onClick={() => setTeaserDescExpanded((e) => !e)}
                            className={`mt-2 text-xs font-semibold transition ${
                              reduceMotion ? "" : "duration-150"
                            } text-[#d6b06a] hover:text-[#e4cd98]`}
                          >
                            {teaserDescExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                        </div>
                      </div>
                    </>
                  ) : null}

                  <div className="pointer-events-auto absolute inset-x-0 bottom-6 z-[6] flex justify-center px-4">
                    {!leafletMounted ? (
                      <button
                        type="button"
                        onClick={activateMap}
                        aria-label="Explore the metro map — loads interactive Philadelphia map"
                        className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-[#d6b06a]/35 bg-black/62 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-150 hover:border-[#d6b06a]/55 hover:bg-black/74 hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:px-6 md:py-3.5"
                      >
                        <span className="relative flex h-2 w-2 shrink-0">
                          {!reduceMotion && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d6b06a]/40 opacity-75" />
                          )}
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d6b06a]" />
                        </span>
                        Explore the metro map
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <GlassCard
              variant={lightMode ? "frost" : "soft"}
              lightMode={lightMode}
              className={`p-5 ring-2 ring-[#d6b06a]/20 md:p-6 ${
                lightMode ? "shadow-[0_26px_60px_rgba(12,18,28,0.1)]" : "shadow-[0_28px_70px_rgba(0,0,0,0.32)]"
              }`}
            >
              <div className="overflow-hidden rounded-[26px] border border-[#d6b06a]/20 shadow-[0_22px_50px_rgba(0,0,0,0.18)]">
                <img
                  src={selectedPreviewImage}
                  alt={selectedListing.title}
                  className="aspect-[16/11] max-h-[240px] w-full object-cover sm:max-h-none"
                />
              </div>
              <div className="relative mt-5">
                <div className="absolute -left-1 top-2 hidden h-[calc(100%-0.5rem)] w-1 rounded-full bg-[#d6b06a]/80 sm:block" />
                <span
                  className={`text-[11px] font-bold uppercase tracking-[0.26em] ${
                    lightMode ? "text-[#99773d]" : "text-[#e8cc8b]"
                  }`}
                >
                  Selected
                </span>
              </div>
              <div className="mt-1 text-[2rem] font-semibold tracking-tighter text-[#d6b06a] md:text-[2.15rem]">
                {selectedListing.price}
              </div>
              <div className="mt-1.5 text-lg font-semibold leading-snug">{selectedListing.title}</div>
              <div className={`mt-2 text-sm leading-relaxed ${mutedText}`}>{selectedListing.address}</div>
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                  lightMode ? "border-black/8 bg-black/[0.03]" : "border-white/[0.08] bg-white/[0.035]"
                } ${mutedText}`}
              >
                {listingSummary(selectedListing)}
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <Button
                  className="rounded-full bg-[#d6b06a] py-6 text-[15px] font-semibold text-[#08111f] shadow-[0_14px_32px_rgba(214,176,106,0.35)] hover:bg-[#e4be78]"
                  onClick={onOpenListingDetails}
                >
                  View full listing
                </Button>
                <Button variant="outline" className={outlineButtonClasses} onClick={onOpenScheduleTour}>
                  Schedule a tour
                </Button>
              </div>
            </GlassCard>
          </div>
        </GlassCard>
      </div>

      <ListingDetailsOverlay
        currentImageIndex={selectedGalleryImageIndex}
        lightMode={lightMode}
        listing={showListingDetails ? selectedListing : null}
        mutedText={mutedText}
        onClose={onCloseListingDetails}
        onImageChange={onImageChange}
        onNextImage={onNextImage}
        onPrevImage={onPrevImage}
        onScheduleTour={onOpenScheduleTour}
      />

      <ScheduleTourModal
        form={tourForm}
        lightMode={lightMode}
        listing={showScheduleTour ? selectedListing : null}
        mutedText={mutedText}
        onChange={onTourFormChange}
        onClose={onCloseScheduleTour}
        onSubmit={onTourSubmit}
      />
    </section>
  );
}
