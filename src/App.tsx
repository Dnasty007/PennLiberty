import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { ArrowUp } from "lucide-react";
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
  initialSaleListings,
  navItems,
  resolveRentalApplicationUrl,
  type PageKey,
  type Rental,
  type SaleListing,
} from "@/lib/data";
import { fetchRentalsCatalog } from "@/lib/rentalsCatalog";
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
import {
  readBrowserRoute,
  syncBrowserUrl,
  type AppRoute,
} from "@/lib/routing";
import {
  PENN_BROKERAGE_LICENSE,
  PENN_CITY,
  PENN_COPYRIGHT_YEAR,
  PENN_EMAIL,
  PENN_FOUNDED_YEAR,
  PENN_PHONE_DISPLAY,
  PENN_PHONE_TEL,
} from "@/lib/brand";

const EMAILJS_SERVICE_ID = "Owner_Email_Website";
const EMAILJS_TEMPLATE_ID = "template_mol56qf";
const EMAILJS_PUBLIC_KEY = "ykKMeoPCgTNLT5di1";

const PAGE_DOCUMENT_TITLES: Record<PageKey, string> = {
  home: "Penn Liberty | Philadelphia Property Management & Rentals",
  "property-management": "For Owners | Penn Liberty Property Management",
  rentals: "Philadelphia Rentals | Penn Liberty",
  listings: "Investment Listings | Penn Liberty Real Estate",
  team: "About the Team | Penn Liberty Real Estate",
  contact: "Contact | Penn Liberty Real Estate",
};

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

/**
 * Desktop-only top rail:
 * 1) Scroll progress fill (grows as you read)
 * 2) Living gold sweep — continuous shimmer in ALL modes (neutral / light / dark)
 */
function DesktopScrollProgress({ lightMode }: { lightMode: boolean }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] hidden h-[3px] overflow-hidden lg:block"
      aria-hidden
    >
      {/* Base track — always visible in every mode */}
      <div
        className={`absolute inset-0 ${
          lightMode
            ? "bg-gradient-to-r from-[#d6b06a]/20 via-[#d6b06a]/35 to-[#d6b06a]/20"
            : "bg-gradient-to-r from-[#d6b06a]/15 via-[#d6b06a]/28 to-[#d6b06a]/15"
        }`}
      />
      {/* Scroll progress fill */}
      <div
        ref={barRef}
        className={`absolute inset-y-0 left-0 w-full origin-left ${
          lightMode
            ? "bg-gradient-to-r from-[#a67c32] via-[#d6b06a] to-[#e4be78] shadow-[0_0_12px_rgba(214,176,106,0.65)]"
            : "bg-gradient-to-r from-[#d6b06a]/90 via-[#e4be78] to-[#f4dfb4] shadow-[0_0_12px_rgba(214,176,106,0.6)]"
        }`}
        style={{ transform: "scaleX(0)" }}
      />
      {/* Continuous gold sweep — same “living bar” energy in light + dark */}
      <div
        className={`pl-gold-seam-sweep absolute inset-y-0 w-1/3 ${
          lightMode
            ? "bg-gradient-to-r from-transparent via-[#fff6e0] to-transparent opacity-90"
            : "bg-gradient-to-r from-transparent via-[#fff6e0] to-transparent opacity-80"
        }`}
      />
    </div>
  );
}

/** Desktop-only: quiet glass back-to-top button, fades in after ~1 screen. */
function BackToTopButton({ lightMode }: { lightMode: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setVisible(window.scrollY > 700);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 hidden h-11 w-11 items-center justify-center rounded-full border shadow-[0_14px_38px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 lg:flex ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      } ${
        lightMode
          ? "border-black/10 bg-white/70 text-black/70 hover:bg-white/90 hover:text-black"
          : "border-white/15 bg-black/45 text-white/80 hover:border-[#d6b06a]/45 hover:bg-black/65 hover:text-white"
      }`}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}

export default function App() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [rentalsReady, setRentalsReady] = useState(false);
  const [saleListings, setSaleListings] = useState<SaleListing[]>([...initialSaleListings]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("neutral");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>(() => readBrowserRoute().page);
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
  const [isDesktopRentalView, setIsDesktopRentalView] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  const [tourForm, setTourForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktopRentalView(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchRentalsCatalog()
      .then((list) => {
        if (!cancelled) {
          setRentals(list);
          setRentalsReady(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load rentals.json:", err);
        if (!cancelled) setRentalsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    document.documentElement.dataset.mode = displayMode;
  }, [displayMode]);

  useEffect(() => {
    document.title = PAGE_DOCUMENT_TITLES[activePage] ?? PAGE_DOCUMENT_TITLES.home;
  }, [activePage]);

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

    return [
      listing.title,
      listing.address,
      listing.price,
      listing.mlsNumber,
      listing.status,
      listing.propertyType,
      listing.description,
      ...(listing.highlights ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const selectedRental = rentals.find((r) => r.id === selectedRentalId) ?? null;
  const rentalApplicationTarget =
    rentals.find((r) => r.id === rentalApplicationId) ?? null;
  const selectedRentalImages = selectedRental
    ? selectedRental.gallery.length ? selectedRental.gallery : [selectedRental.image]
    : [];

  const applyRoute = useCallback(
    (
      route: AppRoute,
      options: { replace?: boolean; syncHistory?: boolean } = {},
    ) => {
      const { replace = false, syncHistory = true } = options;

      setActivePage(route.page);
      setMobileOpen(false);

      if (route.rentalSlug) {
        const rental = rentals.find((r) => r.slug === route.rentalSlug);
        if (rental) {
          setSelectedRentalId(rental.id);
          setRentalGalleryImageIndex(0);
          setShowRentalDetails(true);
        } else {
          setSelectedRentalId(null);
          setShowRentalDetails(false);
        }
        setShowListingDetails(false);
      } else if (route.listingSlug) {
        const listing = saleListings.find((l) => l.slug === route.listingSlug);
        if (listing) {
          setSelectedListingId(listing.id);
          setSelectedGalleryImageIndex(0);
          setShowListingDetails(true);
        } else {
          setShowListingDetails(false);
        }
        setShowRentalDetails(false);
        setSelectedRentalId(null);
      } else {
        setShowRentalDetails(false);
        setShowListingDetails(false);
      }

      if (syncHistory) {
        syncBrowserUrl(route, replace);
      }
    },
    [rentals, saleListings],
  );

  const openRentalDetails = (id: number) => {
    const rental = rentals.find((r) => r.id === id);
    if (!rental) return;
    applyRoute({ page: "rentals", rentalSlug: rental.slug });
  };

  const closeRentalDetails = () => {
    applyRoute({ page: "rentals" }, { replace: true });
  };

  const nextRentalImage = () =>
    setRentalGalleryImageIndex((prev) => (prev + 1) % selectedRentalImages.length);

  const prevRentalImage = () =>
    setRentalGalleryImageIndex(
      (prev) => (prev - 1 + selectedRentalImages.length) % selectedRentalImages.length,
    );

  const openRentalApplication = (id: number) => {
    const rental = rentals.find((r) => r.id === id);
    if (!rental) return;

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
    applyRoute({ page });
  };

  useEffect(() => {
    if (!rentalsReady) return;
    applyRoute(readBrowserRoute(), { replace: true, syncHistory: false });
  }, [rentalsReady, applyRoute]);

  useEffect(() => {
    const onPopState = () => {
      applyRoute(readBrowserRoute(), { syncHistory: false });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyRoute]);

  /* Start each page at the top — skip first mount so reload keeps browser scroll
     restoration. Detail-sheet open/close never changes activePage, so listing
     scroll position is preserved (mobile roadmap decision 8). */
  const firstPageRenderRef = useRef(true);
  useEffect(() => {
    if (firstPageRenderRef.current) {
      firstPageRenderRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activePage]);

  const pageOrder = useMemo(() => navItems.map((item) => item.key), []);
  const currentPageIndex = pageOrder.indexOf(activePage);
  const swipeTouchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeBlockedRef = useRef(false);
  const currentPageIndexRef = useRef(currentPageIndex);
  const goToPageRef = useRef(goToPage);

  currentPageIndexRef.current = currentPageIndex;
  goToPageRef.current = goToPage;

  /* Desktop: ← / → arrows page through the site (keyboard mirror of the mobile
     swipe). Skips typing contexts, modifier combos, and any open overlay/game —
     all of those mount [data-pl-no-page-swipe] while active. */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }
      if (document.querySelector("[data-pl-no-page-swipe]")) return;

      const idx = currentPageIndexRef.current;
      if (e.key === "ArrowRight" && idx < pageOrder.length - 1) {
        e.preventDefault();
        goToPageRef.current(pageOrder[idx + 1] as PageKey);
      } else if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        goToPageRef.current(pageOrder[idx - 1] as PageKey);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pageOrder]);

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
    const listing = saleListings.find((l) => l.id === selectedListingId);
    if (listing?.slug) {
      applyRoute({ page: "listings", listingSlug: listing.slug });
      return;
    }

    setSelectedGalleryImageIndex(0);
    setShowListingDetails(true);
    syncBrowserUrl({ page: "listings" });
  };

  const closeListingDetails = () => {
    applyRoute({ page: "listings" }, { replace: true });
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

    window.location.href = `mailto:${PENN_EMAIL}?subject=${subject}&body=${body}`;
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
    ? "rounded-full border-black/18 bg-white/88 px-6 py-6 text-base text-black shadow-[0_16px_40px_rgba(12,18,28,0.08)] hover:bg-white"
    : "rounded-full border-white/20 bg-white/[0.05] px-6 py-6 text-base text-white shadow-[0_16px_40px_rgba(0,0,0,0.24)] hover:bg-white/[0.08]";
  const footerClasses = lightMode
    ? "border-t border-black/12 bg-[#ebe8e1]/80 px-4 py-10 text-[#1a2230] md:px-8"
    : "border-t border-white/10 px-4 py-10 text-white/80 md:px-8";
  const footerMuted = lightMode ? "text-black/72" : "text-white/60";
  const footerLink = lightMode
    ? "font-semibold text-[#0c1220] hover:text-[#1746b8]"
    : "font-medium text-white/85 hover:text-pl-gold";
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

      <DesktopScrollProgress lightMode={lightMode} />
      <BackToTopButton lightMode={lightMode} />

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
            key={activePage}
            className={`pl-page-enter mx-auto min-w-0 max-w-7xl ${
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
                rentalsLoading={!rentalsReady}
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
        isDesktopRentalView ? (
          <ListingDetailsOverlay
            currentImageIndex={rentalGalleryImageIndex}
            lightMode={lightMode}
            listing={selectedRental}
            mutedText={mutedText}
            onClose={closeRentalDetails}
            onImageChange={setRentalGalleryImageIndex}
            onNextImage={nextRentalImage}
            onPrevImage={prevRentalImage}
            onScheduleTour={() => openRentalApplication(selectedRental.id)}
            primaryActionLabel="Apply Now"
            backLabel="Back to Rentals"
          />
        ) : (
          <RentalDetailSheet
            rental={selectedRental}
            lightMode={lightMode}
            mutedText={mutedText}
            onApply={(rental) => openRentalApplication(rental.id)}
            onClose={closeRentalDetails}
          />
        )
      )}

      <footer
        className={`relative z-10 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] ${footerClasses}`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold tracking-wide">
              <span className={lightMode ? "text-[#3d4654]" : "text-[#cdd5e1]"}>PEN</span>
              <span
                className={`bg-gradient-to-r bg-clip-text text-transparent ${
                  lightMode ? "from-[#3d4654] to-[#1746b8]" : "from-[#cdd5e1] to-[#3f86f7]"
                }`}
              >
                N
              </span>
              <span className={lightMode ? "text-[#1746b8]" : "text-[#3f86f7]"}> LIBERTY</span>
            </div>
            <p className={`mt-1.5 text-[13px] font-medium leading-snug ${footerMuted}`}>
              Philadelphia property management · rentals · multi-family sales
            </p>
            <p className={`mt-2 text-[12px] font-medium ${footerMuted}`}>
              PA Brokerage License {PENN_BROKERAGE_LICENSE} · Est. {PENN_FOUNDED_YEAR}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1">
            <a href={`tel:${PENN_PHONE_TEL}`} className={footerLink}>
              {PENN_PHONE_DISPLAY}
            </a>
            <a href={`mailto:${PENN_EMAIL}`} className={footerLink}>
              {PENN_EMAIL}
            </a>
            <span className={`font-medium ${footerMuted}`}>{PENN_CITY}</span>
          </div>
          <div className={`text-[12px] font-medium ${footerMuted}`}>
            &copy;{PENN_COPYRIGHT_YEAR} Penn Liberty Real Estate
          </div>
        </div>
      </footer>
    </div>
  );
}
