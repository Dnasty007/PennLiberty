import { GlassCard } from "@/components/GlassCard";
import { ListingDetailsOverlay } from "@/components/ListingDetailsOverlay";
import { ScheduleTourModal } from "@/components/ScheduleTourModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SaleListing } from "@/lib/data";
import { listingSummary } from "@/lib/theme";

type ListingsMapProps = {
  filteredListings: SaleListing[];
  lightMode: boolean;
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

export function ListingsMap({
  filteredListings,
  lightMode,
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
  // Real property photos can live in /public/listings/<slug>/ and use gallery[0] as the hero image.
  const selectedPreviewImage = selectedListing.gallery[0] || selectedListing.image;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={`text-sm uppercase tracking-[0.2em] ${subtleText}`}>Listings Map</div>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Explore active listings visually</h2>
          <p className={`mt-3 max-w-2xl ${mutedText}`}>
            Pins are loaded on the map by default so buyers can browse visually first, then search
            by address if they want.
          </p>
        </div>
        <div className="w-full md:w-[340px]">
          <Input
            value={listingSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search address, area, or price"
            className={
              lightMode
                ? "border-black/15 bg-white/70"
                : "border-white/10 bg-white/[0.04] text-white placeholder:text-white/40"
            }
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <GlassCard lightMode={lightMode} className="max-h-[760px] overflow-hidden p-4 md:p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">Active Listings</div>
              <div className={`mt-1 text-sm ${mutedText}`}>{filteredListings.length} showing on map</div>
            </div>
          </div>

          <div className="max-h-[660px] space-y-4 overflow-y-auto pr-1">
            {filteredListings.map((listing) => {
              const isSelected = selectedListing.id === listing.id;

              return (
                <button
                  key={listing.id}
                  onClick={() => onSelectListing(listing.id)}
                  className={`group w-full overflow-hidden rounded-[24px] border text-left transition-all duration-200 ${
                    lightMode
                      ? isSelected
                        ? "border-black/25 bg-black/6 shadow-[0_18px_40px_rgba(10,18,28,0.10)]"
                        : "border-black/10 bg-white/45 hover:border-black/18 hover:bg-white/68 hover:shadow-[0_16px_34px_rgba(10,18,28,0.08)]"
                      : isSelected
                        ? "border-[#d6b06a]/55 bg-white/[0.08] shadow-[0_20px_44px_rgba(0,0,0,0.28)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.05] hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)]"
                  }`}
                >
                  <div className="grid grid-cols-[110px_1fr] gap-0">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="h-full min-h-[118px] w-full object-cover"
                    />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className={`text-xl font-semibold tracking-tight ${
                              isSelected ? "text-[#d6b06a]" : ""
                            }`}
                          >
                            {listing.price}
                          </div>
                          <div className="mt-1 font-medium leading-snug">{listing.title}</div>
                        </div>
                        <div
                          className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full transition ${
                            isSelected
                              ? "bg-[#d6b06a] shadow-[0_0_0_6px_rgba(214,176,106,0.12)]"
                              : lightMode
                                ? "bg-black/12 group-hover:bg-black/24"
                                : "bg-white/18 group-hover:bg-white/30"
                          }`}
                        />
                      </div>
                      <div className={`mt-2 text-sm leading-relaxed ${mutedText}`}>{listing.address}</div>
                      <div className={`mt-3 text-sm ${mutedText}`}>{listingSummary(listing)}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard lightMode={lightMode} className="p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="relative min-h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1824]">
              <div className="absolute inset-0 opacity-95">
                <img
                  src="https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=1800&q=80"
                  alt="Philadelphia map background"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,10,18,0.22),rgba(6,10,18,0.48))]" />
              </div>

              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur-md">
                Philadelphia & surrounding areas
              </div>

              {filteredListings.map((listing) => {
                const isSelected = selectedListing.id === listing.id;

                return (
                  <button
                    key={listing.id}
                    onClick={() => onSelectListing(listing.id)}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ top: listing.top, left: listing.left }}
                  >
                    <div className="relative">
                      {isSelected && (
                        <div className="absolute inset-0 scale-[1.5] rounded-full bg-[#d6b06a]/20 blur-md" />
                      )}
                      <div
                        className={`relative flex h-11 min-w-[58px] items-center justify-center rounded-full border px-3 text-sm font-semibold shadow-lg backdrop-blur-md transition-all duration-200 group-hover:-translate-y-0.5 group-hover:scale-[1.03] ${
                          isSelected
                            ? "border-[#f0cf95] bg-[#d6b06a] text-[#08111f] shadow-[0_12px_30px_rgba(214,176,106,0.38)]"
                            : "border-white/24 bg-black/50 text-white shadow-[0_12px_24px_rgba(0,0,0,0.25)] group-hover:border-white/40 group-hover:bg-black/62"
                        }`}
                      >
                        {listing.price.replace(",000", "k")}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <GlassCard lightMode={lightMode} className="p-4 md:p-5">
              <div className="overflow-hidden rounded-[24px]">
                <img
                  src={selectedPreviewImage}
                  alt={selectedListing.title}
                  className="h-[180px] w-full object-cover"
                />
              </div>
              <div className="mt-5 text-3xl font-semibold tracking-tight">{selectedListing.price}</div>
              <div className="mt-1 text-lg font-medium leading-snug">{selectedListing.title}</div>
              <div className={`mt-2 text-sm leading-relaxed ${mutedText}`}>{selectedListing.address}</div>
              <div className={`mt-4 text-sm ${mutedText}`}>{listingSummary(selectedListing)}</div>
              <div className="mt-5 flex flex-col gap-3">
                <Button
                  className="rounded-full bg-[#d6b06a] text-[#08111f] hover:bg-[#e4be78]"
                  onClick={onOpenListingDetails}
                >
                  View Listing
                </Button>
                <Button variant="outline" className={outlineButtonClasses} onClick={onOpenScheduleTour}>
                  Schedule Tour
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
