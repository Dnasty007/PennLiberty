import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ListingsMap } from "@/components/ListingsMap";
import { OwnersSection } from "@/components/owners/OwnersSection";
import { AIAssistant } from "@/components/AIAssistant";
import { ContactSection } from "@/components/ContactSection";
import { RentalsSection } from "@/components/RentalsSection";
import { TeamSection } from "@/components/TeamSection";
import {
  initialRentals,
  initialSaleListings,
  navItems,
  type PageKey,
  type Rental,
  type SaleListing,
} from "@/lib/data";
import {
  backdropCssUrl,
  DisplayMode,
  PHILLY_COORDS,
  themeForDisplayMode,
  type WeatherState,
} from "@/lib/theme";
import {
  dayBackdropPool,
  nightBackdropPool,
  pickFromPool,
  listingsMapTeaserPool,
  ownersBackdropPool,
  rentalsHeroPool,
  siteBackdropImageClass,
  useStablePoolIndex,
} from "@/lib/siteImagery";

function AmbienceLayer({ type }: { type: "none" | "rain" | "snow" }) {
  if (type === "none") {
    return null;
  }

  if (type === "rain") {
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(105deg, rgba(255,255,255,0.45) 0px, rgba(255,255,255,0.45) 1px, transparent 2px, transparent 14px)",
          backgroundSize: "240px 240px",
        }}
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.18]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.9) 0.8px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    />
  );
}

export default function App() {
  const [rentals, setRentals] = useState<Rental[]>([...initialRentals]);
  const [saleListings, setSaleListings] = useState<SaleListing[]>([...initialSaleListings]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("neutral");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [selectedListingId, setSelectedListingId] = useState<number>(initialSaleListings[0].id);
  const [listingSearch, setListingSearch] = useState("");
  const [weather, setWeather] = useState<WeatherState>({
    code: 0,
    temperature: null,
    loading: true,
    error: false,
  });
  const [showListingDetails, setShowListingDetails] = useState(false);
  const [showScheduleTour, setShowScheduleTour] = useState(false);
  const [selectedGalleryImageIndex, setSelectedGalleryImageIndex] = useState(0);
  const [tourForm, setTourForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${PHILLY_COORDS.latitude}&longitude=${PHILLY_COORDS.longitude}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit&timezone=America/New_York`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Weather request failed");
        }

        const data = await response.json();
        const current = data?.current;

        if (!current || !isMounted) {
          return;
        }

        setWeather({
          code: Number(current.weather_code ?? 0),
          temperature: typeof current.temperature_2m === "number" ? current.temperature_2m : null,
          loading: false,
          error: false,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setWeather((prev) => ({ ...prev, loading: false, error: true }));
      }
    }

    loadWeather();

    const weatherInterval = window.setInterval(loadWeather, 15 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(weatherInterval);
    };
  }, []);

  const dayIdx = useStablePoolIndex(dayBackdropPool.length);
  const nightIdx = useStablePoolIndex(nightBackdropPool.length);
  const ownersIdx = useStablePoolIndex(ownersBackdropPool.length);
  const rentalsIdx = useStablePoolIndex(rentalsHeroPool.length);
  const listingsMapTeaserIdx = useStablePoolIndex(listingsMapTeaserPool.length);
  const dayBackdropPick = pickFromPool(dayBackdropPool, dayIdx);
  const nightBackdropPick = pickFromPool(nightBackdropPool, nightIdx);
  const ownersBackdropPick = pickFromPool(ownersBackdropPool, ownersIdx);
  const ownersSectionBackdrop =
    displayMode === "dark"
      ? nightBackdropPick
      : displayMode === "light"
        ? dayBackdropPick
        : ownersBackdropPick;
  const ownersEditorialHeroPick =
    displayMode === "dark"
      ? pickFromPool(nightBackdropPool, (nightIdx + 1) % nightBackdropPool.length)
      : pickFromPool(ownersBackdropPool, (ownersIdx + 1) % ownersBackdropPool.length);
  const rentalsHeroPick = pickFromPool(rentalsHeroPool, rentalsIdx);
  const listingsMapTeaserPick = pickFromPool(listingsMapTeaserPool, listingsMapTeaserIdx);
  const theme = themeForDisplayMode(
    displayMode,
    displayMode === "light"
      ? dayBackdropPick
      : displayMode === "dark"
        ? nightBackdropPick
        : undefined,
  );
  const lightMode = theme.lightMode;

  /** Same day/night pick on every page (Home used a separate path before — broke Light on sub-pages). */
  const siteBackdropImage =
    displayMode === "light"
      ? backdropCssUrl(dayBackdropPick)
      : displayMode === "dark"
        ? backdropCssUrl(nightBackdropPick)
        : undefined;

  const selectedListing =
    saleListings.find((listing) => listing.id === selectedListingId) ?? saleListings[0];

  const filteredListings = saleListings.filter((listing) => {
    const q = listingSearch.trim().toLowerCase();

    if (!q) {
      return true;
    }

    return [listing.title, listing.address, listing.price].join(" ").toLowerCase().includes(q);
  });

  const goToPage = (page: PageKey) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  const swipeTouchStart = useRef<{ x: number; y: number } | null>(null);
  const pageOrder = navItems.map((item) => item.key);
  const currentPageIndex = pageOrder.indexOf(activePage);

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeTouchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeTouchStart.current) return;
    if (showListingDetails || showScheduleTour || mobileOpen) return;

    const dx = e.changedTouches[0].clientX - swipeTouchStart.current.x;
    const dy = e.changedTouches[0].clientY - swipeTouchStart.current.y;
    swipeTouchStart.current = null;

    // Require at least 60px horizontal, and more horizontal than vertical
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.75) return;

    if (dx < 0 && currentPageIndex < pageOrder.length - 1) {
      goToPage(pageOrder[currentPageIndex + 1] as PageKey);
    } else if (dx > 0 && currentPageIndex > 0) {
      goToPage(pageOrder[currentPageIndex - 1] as PageKey);
    }
  };

  const selectedListingImages = selectedListing.gallery.length
    ? selectedListing.gallery
    : [selectedListing.image];

  const openListingDetails = () => {
    setSelectedGalleryImageIndex(0);
    setShowListingDetails(true);
  };

  const closeListingDetails = () => {
    setShowListingDetails(false);
  };

  const openScheduleTour = () => {
    setShowScheduleTour(true);
  };

  const closeScheduleTour = () => {
    setShowScheduleTour(false);
  };

  const nextListingImage = () => {
    setSelectedGalleryImageIndex((prev) => (prev + 1) % selectedListingImages.length);
  };

  const prevListingImage = () => {
    setSelectedGalleryImageIndex(
      (prev) => (prev - 1 + selectedListingImages.length) % selectedListingImages.length,
    );
  };

  const submitTourRequest = () => {
    const subject = encodeURIComponent(`Tour Request - ${selectedListing.title}`);
    const body = encodeURIComponent(
      [
        `Listing: ${selectedListing.title}`,
        `Address: ${selectedListing.address}`,
        "",
        `Name: ${tourForm.name}`,
        `Email: ${tourForm.email}`,
        `Phone Number: ${tourForm.phone}`,
      ].join("\n"),
    );

    window.location.href = `mailto:info@pennlibertyre.com?subject=${subject}&body=${body}`;
    setShowScheduleTour(false);
  };

  const rootClasses =
    displayMode === "dark"
      ? "min-h-screen bg-[#06101d] text-white transition-colors duration-500"
      : "min-h-screen bg-[#f5f3ee] text-black transition-colors duration-500";

  const mutedText = lightMode ? "text-black/80" : "text-white/60";
  const subtleText = lightMode ? "text-black/62" : "text-white/45";
  const pillClasses = lightMode
    ? "rounded-full bg-black/8 px-4 py-2 text-sm"
    : "rounded-full bg-black/5 px-4 py-2 text-sm";
  const outlineButtonClasses = lightMode
    ? "rounded-full border-black/20 bg-white/52 px-6 py-6 text-base text-black shadow-[0_16px_40px_rgba(12,18,28,0.08)] hover:bg-white/72"
    : "rounded-full border-white/20 bg-white/[0.05] px-6 py-6 text-base text-white shadow-[0_16px_40px_rgba(0,0,0,0.24)] hover:bg-white/[0.08]";
  const footerClasses = lightMode
    ? "border-t border-black/10 px-4 py-8 text-black/70 md:px-8"
    : "border-t border-white/10 px-4 py-8 text-white/55 md:px-8";
  const inputClasses = lightMode
    ? "border-black/15 bg-white/70"
    : "border-white/10 bg-white/[0.04] text-white placeholder:text-white/40";

  return (
    <div className={rootClasses} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="relative min-h-screen overflow-x-hidden">
        {theme.showBackdrop && siteBackdropImage ? (
          <div
            className={siteBackdropImageClass}
            style={{ backgroundImage: siteBackdropImage }}
            role="presentation"
            aria-hidden
          />
        ) : null}
        <div className={`${theme.overlayClass} transition-all duration-700`} />
        <AmbienceLayer type={theme.ambience} />

        <Header
          activePage={activePage}
          displayMode={displayMode}
          goToPage={goToPage}
          lightMode={lightMode}
          mobileOpen={mobileOpen}
          setDisplayMode={setDisplayMode}
          setMobileOpen={setMobileOpen}
          subtleText={subtleText}
          theme={theme}
          weather={weather}
        />

        <main
          className={`relative z-10 px-4 pb-16 md:px-8 md:pb-20 ${
            activePage === "listings" ||
              activePage === "team" ||
              activePage === "contact" ||
              activePage === "rentals" ||
              activePage === "property-management"
              ? "pt-6 md:pt-8"
              : "pt-8 md:pt-10"
          }`}
        >
          <div
            className={`mx-auto max-w-7xl ${
              activePage === "listings" ||
              activePage === "team" ||
              activePage === "contact" ||
              activePage === "rentals" ||
              activePage === "property-management"
                ? "space-y-5 md:space-y-6"
                : "space-y-8"
            }`}
          >
            {activePage === "home" && (
              <Hero
                goToPage={goToPage}
                lightMode={lightMode}
                mutedText={mutedText}
                outlineButtonClasses={outlineButtonClasses}
                pillClasses={pillClasses}
                subtleText={subtleText}
                theme={theme}
                weather={weather}
              />
            )}

            {activePage === "rentals" && (
              <RentalsSection
                goToPage={goToPage}
                lightMode={lightMode}
                mutedText={mutedText}
                outlineButtonClasses={outlineButtonClasses}
                rentals={rentals}
                rentalsHeroSrc={rentalsHeroPick}
                subtleText={subtleText}
              />
            )}

            {activePage === "property-management" && (
              <OwnersSection
                assistantTrigger={<AIAssistant lightMode={lightMode} />}
                backdropSrc={displayMode === "neutral" ? undefined : ownersSectionBackdrop}
                editorialHeroSrc={ownersEditorialHeroPick}
                goToPage={goToPage}
                lightMode={lightMode}
                mutedText={mutedText}
                subtleText={subtleText}
              />
            )}

            {activePage === "listings" && (
              <ListingsMap
                filteredListings={filteredListings}
                lightMode={lightMode}
                listingSearch={listingSearch}
                listingsMapTeaserSrc={listingsMapTeaserPick}
                mutedText={mutedText}
                onCloseListingDetails={closeListingDetails}
                onCloseScheduleTour={closeScheduleTour}
                onImageChange={setSelectedGalleryImageIndex}
                onNextImage={nextListingImage}
                onOpenListingDetails={openListingDetails}
                onOpenScheduleTour={openScheduleTour}
                onPrevImage={prevListingImage}
                onSearchChange={setListingSearch}
                onSelectListing={setSelectedListingId}
                outlineButtonClasses={outlineButtonClasses}
                selectedGalleryImageIndex={selectedGalleryImageIndex}
                selectedListing={selectedListing}
                showListingDetails={showListingDetails}
                showScheduleTour={showScheduleTour}
                subtleText={subtleText}
                tourForm={tourForm}
                onTourFormChange={setTourForm}
                onTourSubmit={submitTourRequest}
              />
            )}

            {activePage === "team" && (
              <TeamSection
                goToPage={goToPage}
                lightMode={lightMode}
                mutedText={mutedText}
                outlineButtonClasses={outlineButtonClasses}
                subtleText={subtleText}
              />
            )}

            {activePage === "contact" && (
              <ContactSection
                goToPage={goToPage}
                lightMode={lightMode}
                mutedText={mutedText}
                outlineButtonClasses={outlineButtonClasses}
                subtleText={subtleText}
              />
            )}
          </div>
        </main>
      </div>

      <footer className={footerClasses}>
        <div className="mx-auto max-w-7xl">© {year} Penn Liberty</div>
      </footer>
    </div>
  );
}
