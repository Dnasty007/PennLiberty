import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Header } from "@/components/Header";
import { DevImageEditor } from "@/components/DevImageEditor";
import { Hero } from "@/components/Hero";
import { ListingDetailsOverlay } from "@/components/ListingDetailsOverlay";
import { RentalDetailSheet } from "@/components/RentalDetailSheet";
import { ListingsMap } from "@/components/ListingsMap";
import { OwnersSection } from "@/components/owners/OwnersSection";
import { ContactSection } from "@/components/ContactSection";
import { RentalApplicationModal } from "@/components/RentalApplicationModal";
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
  ownersPageBackdropPool,
  ownersPageBackdropDarkPool,
  rentalsHeroPool,
  rentalsHeroDarkPool,
  siteBackdropImageClass,
  usePoolIndexCycler,
} from "@/lib/siteImagery";

const EMAILJS_SERVICE_ID = "Owner_Email_Website";
const EMAILJS_TEMPLATE_ID = "template_mol56qf";
const EMAILJS_PUBLIC_KEY = "ykKMeoPCgTNLT5di1";

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
  const [showRentalDetails, setShowRentalDetails] = useState(false);
  const [selectedRentalId, setSelectedRentalId] = useState<number | null>(null);
  const [showRentalApplication, setShowRentalApplication] = useState(false);
  const [rentalApplicationId, setRentalApplicationId] = useState<number | null>(null);
  const [rentalApplicationStatus, setRentalApplicationStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [rentalApplicationOpenedExternal, setRentalApplicationOpenedExternal] = useState(false);
  const [rentalGalleryImageIndex, setRentalGalleryImageIndex] = useState(0);
  const [tourForm, setTourForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

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

  const dayPool = usePoolIndexCycler(dayBackdropPool.length);
  const nightPool = usePoolIndexCycler(nightBackdropPool.length);
  const ownersPool = usePoolIndexCycler(ownersPageBackdropPool.length);
  const rentalsPool = usePoolIndexCycler(rentalsHeroPool.length);
  const listingsPool = usePoolIndexCycler(listingsMapTeaserPool.length);
  const dayBackdropPick = pickFromPool(dayBackdropPool, dayPool.idx);
  const nightBackdropPick = pickFromPool(nightBackdropPool, nightPool.idx);

  // Light vs Dark mode image picks
  const ownersCurrentPool = displayMode === "dark" ? ownersPageBackdropDarkPool : ownersPageBackdropPool;
  const rentalsCurrentPool = displayMode === "dark" ? rentalsHeroDarkPool : rentalsHeroPool;

  const ownersSectionBackdrop = pickFromPool(ownersCurrentPool, ownersPool.idx);
  const ownersEditorialHeroPick = pickFromPool(ownersCurrentPool, ownersPool.idx);
  const rentalsHeroPick = pickFromPool(rentalsCurrentPool, rentalsPool.idx);
  const listingsMapTeaserPick = pickFromPool(listingsMapTeaserPool, listingsPool.idx);

  const cyclePageHero = useCallback(() => {
    switch (activePage) {
      case "rentals":
        rentalsPool.cycle();
        break;
      case "listings":
        listingsPool.cycle();
        break;
      case "property-management":
        ownersPool.cycle();
        break;
      default:
        break;
    }
  }, [activePage, listingsPool, ownersPool, rentalsPool]);

  const canCyclePageHero =
    (activePage === "rentals" && rentalsPool.canCycle) ||
    (activePage === "listings" && listingsPool.canCycle) ||
    (activePage === "property-management" && ownersPool.canCycle);

  const pageHeroPreview =
    activePage === "rentals"
      ? rentalsHeroPick
      : activePage === "listings"
        ? listingsMapTeaserPick
        : activePage === "property-management"
          ? ownersEditorialHeroPick
          : "";

  // Pass the current display mode to child sections so they know which configs to use
  const isDarkMode = displayMode === "dark";

  const cycleSiteBackdrop = useCallback(() => {
    if (displayMode === "light") dayPool.cycle();
    else if (displayMode === "dark") nightPool.cycle();
  }, [displayMode, dayPool.cycle, nightPool.cycle]);

  const canCycleSiteBackdrop =
    (displayMode === "light" && dayPool.canCycle) ||
    (displayMode === "dark" && nightPool.canCycle);
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
  const siteBackdropSrc =
    displayMode === "light"
      ? dayBackdropPick
      : displayMode === "dark"
        ? nightBackdropPick
        : undefined;
  /* Scroll-reveal disabled — background stays fixed. */

  const selectedListing =
    saleListings.find((listing) => listing.id === selectedListingId) ?? saleListings[0];

  const filteredListings = saleListings.filter((listing) => {
    const q = listingSearch.trim().toLowerCase();

    if (!q) {
      return true;
    }

    return [listing.title, listing.address, listing.price].join(" ").toLowerCase().includes(q);
  });

  const selectedRental = rentals.find((r) => r.id === selectedRentalId) ?? null;
  const rentalApplicationTarget =
    rentals.find((r) => r.id === rentalApplicationId) ?? null;
  const selectedRentalImages = selectedRental
    ? selectedRental.gallery.length ? selectedRental.gallery : [selectedRental.image]
    : [];

  const openRentalDetails = (id: number) => {
    setSelectedRentalId(id);
    setRentalGalleryImageIndex(0);
    setShowRentalDetails(true);
  };

  const closeRentalDetails = () => setShowRentalDetails(false);

  const nextRentalImage = () =>
    setRentalGalleryImageIndex((prev) => (prev + 1) % selectedRentalImages.length);

  const prevRentalImage = () =>
    setRentalGalleryImageIndex(
      (prev) => (prev - 1 + selectedRentalImages.length) % selectedRentalImages.length,
    );

  const openRentalApplication = (id: number) => {
    setRentalApplicationId(id);
    setRentalApplicationStatus("idle");
    setRentalApplicationOpenedExternal(false);
    setShowRentalApplication(true);
  };

  const closeRentalApplication = () => {
    setShowRentalApplication(false);
    setRentalApplicationStatus("idle");
    setRentalApplicationOpenedExternal(false);
  };

  const submitRentalApplication = async (contact: {
    name: string;
    email: string;
    phone: string;
  }) => {
    const rental = rentals.find((r) => r.id === rentalApplicationId);
    if (!rental) return;

    setRentalApplicationStatus("sending");

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          title: "Rental Application Request",
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          address: rental.address,
          message: [
            rental.title,
            rental.price,
            rental.meta,
            rental.area,
          ].join(" · "),
          time: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
        },
        EMAILJS_PUBLIC_KEY,
      );

      const listingUrl = rental.applicationUrl?.trim();
      const globalUrl = import.meta.env.VITE_BUILDIUM_RENTAL_APPLICATION_URL?.trim() || undefined;
      const url = listingUrl || globalUrl;

      const hasBuildiumUrl = Boolean(url && /^https?:\/\//i.test(url));

      if (hasBuildiumUrl) {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      setRentalApplicationOpenedExternal(hasBuildiumUrl);
      setRentalApplicationStatus("success");
      closeRentalDetails();
    } catch {
      setRentalApplicationStatus("error");
    }
  };

  const goToPage = (page: PageKey) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  const pageOrder = useMemo(() => navItems.map((item) => item.key), []);
  const currentPageIndex = pageOrder.indexOf(activePage);
  const swipeTouchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeBlockedRef = useRef(false);
  const currentPageIndexRef = useRef(currentPageIndex);
  const goToPageRef = useRef(goToPage);

  currentPageIndexRef.current = currentPageIndex;
  goToPageRef.current = goToPage;

  useEffect(() => {
    swipeBlockedRef.current = Boolean(
      showListingDetails ||
        showScheduleTour ||
        showRentalDetails ||
        showRentalApplication ||
        mobileOpen,
    );
  }, [showListingDetails, showScheduleTour, showRentalDetails, showRentalApplication, mobileOpen]);

  // ⚠️ LOAD-BEARING — DO NOT "SIMPLIFY" THIS INTO CSS. ⚠️
  // Non-passive touchmove + preventDefault on horizontal drags stops iOS sideways pan
  // without breaking vertical scroll or touchend page-swipe (see comment on index.css).
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let directionLocked: "horizontal" | "vertical" | null = null;

    const isIgnoredTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return Boolean(
        el?.closest(
          ".leaflet-container, [data-pl-horizontal-scroll], [data-pl-no-page-swipe]",
        ),
      );
    };

    const onStart = (e: TouchEvent) => {
      if (isIgnoredTarget(e.target)) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      directionLocked = null;
    };

    const onMove = (e: TouchEvent) => {
      if (isIgnoredTarget(e.target)) return;

      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);

      if (!directionLocked && (dx > 4 || dy > 4)) {
        directionLocked = dx > dy ? "horizontal" : "vertical";
      }

      if (directionLocked === "horizontal") {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (swipeBlockedRef.current) {
      swipeTouchStart.current = null;
      return;
    }

    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        ".leaflet-container, [data-pl-horizontal-scroll], [data-pl-no-page-swipe]",
      )
    ) {
      swipeTouchStart.current = null;
      return;
    }

    swipeTouchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeTouchStart.current || swipeBlockedRef.current) return;

    const dx = e.changedTouches[0].clientX - swipeTouchStart.current.x;
    const dy = e.changedTouches[0].clientY - swipeTouchStart.current.y;
    swipeTouchStart.current = null;

    if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.5) return;

    const idx = currentPageIndexRef.current;
    if (dx < 0 && idx < pageOrder.length - 1) {
      goToPage(pageOrder[idx + 1] as PageKey);
    } else if (dx > 0 && idx > 0) {
      goToPage(pageOrder[idx - 1] as PageKey);
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
      ? "min-h-dvh overflow-x-hidden bg-[#06101d] text-white transition-colors duration-500"
      : "min-h-dvh overflow-x-hidden bg-[#f5f3ee] text-black transition-colors duration-500";

  const mutedText = lightMode ? "text-black/80" : "text-white/60";
  const subtleText = lightMode ? "text-black/62" : "text-white/45";
  const pillClasses = lightMode
    ? "rounded-full bg-black/8 px-4 py-2 text-sm"
    : "rounded-full bg-black/5 px-4 py-2 text-sm";
  const outlineButtonClasses = lightMode
    ? "rounded-full border-black/20 bg-white/52 px-6 py-6 text-base text-black shadow-[0_16px_40px_rgba(12,18,28,0.08)] hover:bg-white/72"
    : "rounded-full border-white/20 bg-white/[0.05] px-6 py-6 text-base text-white shadow-[0_16px_40px_rgba(0,0,0,0.24)] hover:bg-white/[0.08]";
  const footerClasses = lightMode
    ? "px-4 py-8 text-black/70 md:px-8"
    : "px-4 py-8 text-white/55 md:px-8";
  const inputClasses = lightMode
    ? "border-black/15 bg-white/70"
    : "border-white/10 bg-white/[0.04] text-white placeholder:text-white/40";

  return (
    <div
      className={rootClasses}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {theme.showBackdrop && siteBackdropSrc ? (
        <div className={siteBackdropImageClass} role="presentation" aria-hidden>
          <img
            src={siteBackdropSrc}
            alt=""
            className="site-backdrop__img"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      ) : null}
      <div className={`pointer-events-none ${theme.overlayClass} transition-all duration-700`} />
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
        className={`relative z-10 min-w-0 w-full px-4 pb-8 md:px-8 md:pb-12 ${
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
            className={`mx-auto min-w-0 max-w-7xl ${
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
                onOpenRentalApplication={openRentalApplication}
                onOpenRentalDetails={openRentalDetails}
                outlineButtonClasses={outlineButtonClasses}
                rentals={rentals}
                rentalsHeroSrc={rentalsHeroPick}
                subtleText={subtleText}
              />
            )}

            {activePage === "property-management" && (
              <OwnersSection
                backdropSrc={ownersSectionBackdrop}
                editorialHeroSrc={ownersEditorialHeroPick}
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

      <DevImageEditor
        imagery={{
          onNextBackdrop: cycleSiteBackdrop,
          onNextPageHero: cyclePageHero,
          canCycleBackdrop: canCycleSiteBackdrop,
          canCyclePageHero,
          backdropPreview:
            displayMode === "light"
              ? dayBackdropPick
              : displayMode === "dark"
                ? nightBackdropPick
                : "",
          pageHeroPreview,
        }}
      />

      <RentalApplicationModal
        key={rentalApplicationTarget?.id ?? "closed"}
        lightMode={lightMode}
        rental={showRentalApplication ? rentalApplicationTarget : null}
        status={rentalApplicationStatus}
        openedExternalApplication={rentalApplicationOpenedExternal}
        onClose={closeRentalApplication}
        onSubmit={submitRentalApplication}
      />

      {showRentalDetails && selectedRental && (
        <RentalDetailSheet
          rental={selectedRental}
          lightMode={lightMode}
          mutedText={mutedText}
          onApply={(rental) => openRentalApplication(rental.id)}
          onClose={closeRentalDetails}
        />
      )}

      <footer
        className={`relative z-10 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] ${footerClasses}`}
      >
        <div className="mx-auto max-w-7xl py-2">
          <span className="text-sm">&copy;2008 Penn Liberty</span>
        </div>
      </footer>
    </div>
  );
}
