import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  Cloud,
  CloudRain,
  CloudSnow,
  Home,
  Mail,
  Menu,
  Moon,
  Phone,
  Sun,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialRentals = [
  {
    id: 1,
    title: "Northeast Philly Rowhome",
    price: "$1,850/mo",
    meta: "3 Beds • 1 Bath",
    area: "Philadelphia, PA",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Bensalem Duplex Unit",
    price: "$1,650/mo",
    meta: "2 Beds • 1 Bath",
    area: "Bensalem, PA",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    title: "Modern Rental Near Center City",
    price: "$2,250/mo",
    meta: "2 Beds • 2 Baths",
    area: "Philadelphia, PA",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

const initialSaleListings = [
  {
    id: 1,
    title: "Philadelphia Triplex",
    propertyType: "Multi-Family",
    units: 3,
    price: "$425,000",
    address: "1704 W Diamond St, Philadelphia, PA 19121",
    beds: 0,
    baths: 0,
    sqft: 1760,
    top: "34%",
    left: "58%",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    gallery: [],
  },
  {
    id: 2,
    title: "Bensalem Detached Home",
    price: "$425,000",
    address: "732 Farley Rd, Bensalem, PA",
    beds: 3,
    baths: 2,
    sqft: 1315,
    top: "26%",
    left: "73%",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    title: "Northeast Philly Brick Home",
    price: "$359,900",
    address: "Castor Ave, Philadelphia, PA",
    beds: 3,
    baths: 2,
    sqft: 1480,
    top: "22%",
    left: "52%",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    title: "Old City Condo",
    price: "$315,000",
    address: "2nd St, Philadelphia, PA",
    beds: 2,
    baths: 2,
    sqft: 1090,
    top: "41%",
    left: "48%",
    image:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

const platforms = [
  "Apartments.com",
  "Apartment List",
  "Rent.com",
  "Zillow Group",
  "Zumper",
  "Dwellsy",
  "Rental Beast",
  "Bright MLS",
] as const;

const team = [
  {
    name: "Broker / Founder",
    role: "Sales Leadership",
    bio: "Experienced sales leadership focused on trust, deal execution, and client relationships across Philadelphia and surrounding markets.",
  },
  {
    name: "Ramon Caceres",
    role: "Rentals & Growth",
    bio: "Focused on rental growth, property management systems, marketing, and building the future-facing Penn Liberty experience.",
  },
  {
    name: "Penn Liberty Agents",
    role: "Sales, Rentals, Leasing",
    bio: "A growing team supporting buyers, sellers, landlords, tenants, and property owners with responsive local service.",
  },
] as const;

const navItems = [
  { label: "Home", key: "home" },
  { label: "Rentals", key: "rentals" },
  { label: "Property Management", key: "property-management" },
  { label: "Listings", key: "listings" },
  { label: "Team", key: "team" },
  { label: "Contact", key: "contact" },
] as const;

type PageKey = (typeof navItems)[number]["key"];
type DisplayMode = "auto" | "light" | "dark";
type WeatherTheme =
  | "clear-day"
  | "cloudy-day"
  | "rain-day"
  | "snow-day"
  | "clear-night"
  | "cloudy-night"
  | "rain-night"
  | "snow-night";

type Rental = (typeof initialRentals)[number];
type SaleListing = (typeof initialSaleListings)[number];

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  lightMode?: boolean;
};

type WeatherState = {
  code: number;
  temperature: number | null;
  loading: boolean;
  error: boolean;
};

type ThemeMeta = {
  lightMode: boolean;
  backgroundImage: string;
  overlayClass: string;
  ambience: "none" | "rain" | "snow";
  label: string;
  icon: React.ReactNode;
};

const PHILLY_COORDS = {
  latitude: 39.9526,
  longitude: -75.1652,
};

function GlassCard({ children, className = "", lightMode = false }: GlassCardProps) {
  const baseClasses = lightMode
    ? "border-black/10 bg-white/28 backdrop-blur-[16px]"
    : "border-white/15 bg-white/[0.008] backdrop-blur-[22px] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.05)_35%,rgba(255,255,255,0.008)_70%)] before:opacity-65 after:absolute after:inset-px after:rounded-[calc(theme(borderRadius.3xl)-1px)] after:border after:border-white/6 after:opacity-55";

  return (
    <div className={`relative overflow-hidden rounded-[30px] border ${baseClasses} ${className}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function getThemeFromWeather(code: number, isDay: boolean): WeatherTheme {
  const suffix = isDay ? "day" : "night";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return `snow-${suffix}` as WeatherTheme;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return `rain-${suffix}` as WeatherTheme;
  }
  if ([1, 2, 3, 45, 48].includes(code)) return `cloudy-${suffix}` as WeatherTheme;
  return `clear-${suffix}` as WeatherTheme;
}

function themeMeta(theme: WeatherTheme): ThemeMeta {
  const map: Record<WeatherTheme, ThemeMeta> = {
    "clear-day": {
      lightMode: true,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?auto=format&fit=crop&w=2600&q=100')",
      overlayClass: "absolute inset-0 bg-white/40",
      ambience: "none",
      label: "Sunny Philly",
      icon: <Sun className="h-4 w-4" />,
    },
    "cloudy-day": {
      lightMode: true,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2600&q=100')",
      overlayClass: "absolute inset-0 bg-white/50",
      ambience: "none",
      label: "Cloudy Philly",
      icon: <Cloud className="h-4 w-4" />,
    },
    "rain-day": {
      lightMode: true,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=2600&q=100')",
      overlayClass: "absolute inset-0 bg-white/30",
      ambience: "rain",
      label: "Rain in Philly",
      icon: <CloudRain className="h-4 w-4" />,
    },
    "snow-day": {
      lightMode: true,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=2600&q=100')",
      overlayClass: "absolute inset-0 bg-white/35",
      ambience: "snow",
      label: "Snow in Philly",
      icon: <CloudSnow className="h-4 w-4" />,
    },
    "clear-night": {
      lightMode: false,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=2600&q=100')",
      overlayClass: "absolute inset-0 bg-black/50",
      ambience: "none",
      label: "Philly at Night",
      icon: <Moon className="h-4 w-4" />,
    },
    "cloudy-night": {
      lightMode: false,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=2600&q=100')",
      overlayClass: "absolute inset-0 bg-black/55",
      ambience: "none",
      label: "Cloudy Night",
      icon: <Cloud className="h-4 w-4" />,
    },
    "rain-night": {
      lightMode: false,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2600&q=100')",
      overlayClass: "absolute inset-0 bg-black/55",
      ambience: "rain",
      label: "Rainy Night",
      icon: <CloudRain className="h-4 w-4" />,
    },
    "snow-night": {
      lightMode: false,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1511131341194-24e2eeeebb09?auto=format&fit=crop&w=2600&q=100')",
      overlayClass: "absolute inset-0 bg-black/50",
      ambience: "snow",
      label: "Snowy Night",
      icon: <CloudSnow className="h-4 w-4" />,
    },
  };
  return map[theme];
}

function AmbienceLayer({ type }: { type: "none" | "rain" | "snow" }) {
  if (type === "none") return null;

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

function DisplayModeControl({
  mode,
  onChange,
  lightMode,
}: {
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
  lightMode: boolean;
}) {
  const wrapper = lightMode ? "border-black/12 bg-white/45" : "border-white/18 bg-white/[0.025]";
  const active = lightMode ? "bg-black/5 text-black" : "bg-white/14 text-white";
  const idle = lightMode ? "text-black/65 hover:text-black" : "text-white/75 hover:text-white";

  return (
    <div className={`hidden items-center gap-1 rounded-full border px-1 py-1 lg:flex ${wrapper}`}>
      {([
        { key: "light", label: "Light" },
        { key: "dark", label: "Dark" },
      ] as const).map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`rounded-full px-3 py-1.5 text-xs transition ${mode === item.key ? active : idle}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function listingSummary(listing: SaleListing) {
  return "units" in listing && listing.units
    ? `${listing.units} Units • ${listing.sqft.toLocaleString()} sqft`
    : `${listing.beds} Beds • ${listing.baths} Baths • ${listing.sqft.toLocaleString()} sqft`;
}

export default function PennLibertyModernSiteStarter() {
  const [rentals, setRentals] = useState<Rental[]>([...initialRentals]);
  const [saleListings, setSaleListings] = useState<SaleListing[]>([...initialSaleListings]);
  const [newListing, setNewListing] = useState({ title: "", price: "", address: "" });
  const [newRental, setNewRental] = useState({ title: "", price: "", meta: "" });
  const [displayMode, setDisplayMode] = useState<DisplayMode>("auto");
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
  const [phillyMinutes, setPhillyMinutes] = useState(12 * 60);
  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${PHILLY_COORDS.latitude}&longitude=${PHILLY_COORDS.longitude}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit&timezone=America/New_York`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather request failed");
        const data = await response.json();
        const current = data?.current;
        if (!current || !isMounted) return;

        setWeather({
          code: Number(current.weather_code ?? 0),
          temperature:
            typeof current.temperature_2m === "number" ? current.temperature_2m : null,
          loading: false,
          error: false,
        });
      } catch {
        if (!isMounted) return;
        setWeather((prev) => ({ ...prev, loading: false, error: true }));
      }
    }

    function syncPhillyClock() {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).formatToParts(new Date());

      const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "12");
      const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
      setPhillyMinutes(hour * 60 + minute);
    }

    loadWeather();
    syncPhillyClock();
    const weatherInterval = window.setInterval(loadWeather, 15 * 60 * 1000);
    const clockInterval = window.setInterval(syncPhillyClock, 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(weatherInterval);
      window.clearInterval(clockInterval);
    };
  }, []);

  const isDefaultDaytime = phillyMinutes >= 6 * 60 && phillyMinutes < 17 * 60 + 30;
  const autoTheme = getThemeFromWeather(weather.code, isDefaultDaytime);
  const manualTheme: WeatherTheme = displayMode === "light" ? "clear-day" : "clear-night";
  const activeTheme = displayMode === "auto" ? autoTheme : manualTheme;
  const theme = themeMeta(activeTheme);
  const lightMode = theme.lightMode;

  const selectedListing =
    saleListings.find((listing) => listing.id === selectedListingId) ?? saleListings[0];

  const filteredListings = saleListings.filter((listing) => {
    const q = listingSearch.trim().toLowerCase();
    if (!q) return true;
    return [listing.title, listing.address, listing.price].join(" ").toLowerCase().includes(q);
  });

  const goToPage = (page: PageKey) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  const addListing = () => {
    if (!newListing.title || !newListing.price || !newListing.address) return;
    const newItem: SaleListing = {
      id: Date.now(),
      title: newListing.title,
      price: newListing.price,
      address: newListing.address,
      beds: 3,
      baths: 2,
      sqft: 1500,
      top: "30%",
      left: "60%",
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    };
    setSaleListings((prev) => [...prev, newItem]);
    setSelectedListingId(newItem.id);
    setNewListing({ title: "", price: "", address: "" });
  };

  const addRental = () => {
    if (!newRental.title || !newRental.price || !newRental.meta) return;
    const newItem: Rental = {
      id: Date.now(),
      title: newRental.title,
      price: newRental.price,
      meta: newRental.meta,
      area: "Philadelphia, PA",
      image:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    };
    setRentals((prev) => [...prev, newItem]);
    setNewRental({ title: "", price: "", meta: "" });
  };

  const rootClasses = lightMode
    ? "min-h-screen bg-[#f5f3ee] text-black transition-colors duration-500"
    : "min-h-screen bg-[#06101d] text-white transition-colors duration-500";

  const mutedText = lightMode ? "text-black/65" : "text-white/60";
  const subtleText = lightMode ? "text-black/50" : "text-white/45";
  const pillClasses = lightMode
    ? "rounded-full bg-black/8 px-4 py-2 text-sm"
    : "rounded-full bg-black/5 px-4 py-2 text-sm";
  const navIdleClasses = lightMode
    ? "text-black/70 hover:bg-black/8 hover:text-black"
    : "text-white/80 hover:bg-white/[0.025] hover:text-white";
  const navActiveClasses = lightMode ? "bg-black/5 text-black" : "bg-white/14 text-white";
  const mobileBorder = lightMode ? "border-black/10" : "border-white/10";
  const mobileActiveClasses = lightMode ? "bg-black/8 text-black" : "bg-white/12 text-white";
  const mobileIdleClasses = lightMode
    ? "text-black/70 hover:bg-black/8 hover:text-black"
    : "text-white/80 hover:bg-white/[0.025] hover:text-white";
  const outlineButtonClasses = lightMode
    ? "rounded-full border-black/20 bg-white/30 px-6 py-6 text-base text-black hover:bg-white/50"
    : "rounded-full border-white/20 bg-white/[0.01] px-6 py-6 text-base text-white hover:bg-white/[0.025]";
  const menuButtonClasses = lightMode
    ? "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/15 bg-white/40 lg:hidden"
    : "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.025] lg:hidden";
  const footerClasses = lightMode
    ? "border-t border-black/10 px-4 py-8 text-black/55 md:px-8"
    : "border-t border-white/10 px-4 py-8 text-white/55 md:px-8";
  const mobileModeButton = lightMode
    ? "rounded-full px-3 py-1 text-xs bg-black/5 text-black"
    : "rounded-full px-3 py-1 text-xs bg-white/[0.025] text-white";
  const inputClasses = lightMode
    ? "border-black/15 bg-white/70"
    : "border-white/10 bg-white/[0.04] text-white placeholder:text-white/40";

  return (
    <div className={rootClasses}>
      <div className="relative min-h-screen overflow-hidden">
        <div className={`${theme.overlayClass} absolute inset-0 transition-all duration-700`} />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70 transition-all duration-700"
          style={{ backgroundImage: theme.backgroundImage }}
        />
        <AmbienceLayer type={theme.ambience} />

        <header className="relative z-20 px-4 pt-6 md:px-8 md:pt-8">
          <GlassCard
            lightMode={lightMode}
            className="mx-auto max-w-[1200px] px-6 py-3 md:px-8 backdrop-blur-[30px]"
          >
            <div className="flex items-center justify-between gap-4">
              <button onClick={() => goToPage("home")} className="flex items-center gap-3 text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d6b06a] text-[#08111f] shadow-lg shadow-[#d6b06a]/25">
                  <span className="text-xl font-bold">PL</span>
                </div>
                <div>
                  <div className="text-lg font-semibold tracking-wide">PENN LIBERTY</div>
                  <div className={`text-xs uppercase tracking-[0.22em] ${subtleText}`}>
                    Real Estate & Property Management
                  </div>
                </div>
              </button>

              <nav className="hidden items-center gap-2 lg:flex">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => goToPage(item.key)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      activePage === item.key ? navActiveClasses : navIdleClasses
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">
                <DisplayModeControl
                  mode={displayMode}
                  onChange={setDisplayMode}
                  lightMode={lightMode}
                />
              </div>

              <button
                onClick={() => setMobileOpen((value) => !value)}
                className={menuButtonClasses}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {mobileOpen && (
              <div className={`mt-4 space-y-2 border-t pt-4 lg:hidden ${mobileBorder}`}>
                <div className="flex items-center justify-between gap-2 pb-2">
                  <span className={`text-xs uppercase tracking-[0.2em] ${subtleText}`}>Display</span>
                  <div className="flex items-center gap-1">
                    {(["light", "dark"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setDisplayMode(mode)}
                        className={`${mobileModeButton} ${displayMode === mode ? "ring-1 ring-[#d6b06a]/70" : ""}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className={`mb-2 flex items-center gap-2 rounded-2xl px-3 py-2 ${
                    lightMode ? "bg-black/6" : "bg-white/6"
                  }`}
                >
                  {theme.icon}
                  <span className="text-sm">
                    {weather.temperature !== null ? `${Math.round(weather.temperature)}°` : "--°"} Philadelphia
                  </span>
                </div>
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => goToPage(item.key)}
                    className={`block w-full rounded-2xl px-3 py-2 text-left text-sm ${
                      activePage === item.key ? mobileActiveClasses : mobileIdleClasses
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </header>

        <main className="relative z-10 px-4 pb-16 pt-8 md:px-8 md:pb-20 md:pt-10">
          <div className="mx-auto max-w-7xl space-y-8">
            {activePage === "home" && (
              <>
                <section className="grid items-center gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:pt-6">
                  <div className="max-w-3xl">
                    <div
                      className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-xl ${
                        lightMode
                          ? "border-black/10 bg-white/45 text-black/75"
                          : "border-white/15 bg-white/[0.012] text-white/80"
                      }`}
                    >
                      {theme.icon}
                      <span>
                        {theme.label}
                        {weather.temperature !== null ? ` · ${Math.round(weather.temperature)}°` : ""}
                      </span>
                    </div>

                    <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl xl:text-[6rem]">
                      Real Estate.
                      <br />
                      Rentals.
                      <br />
                      Management.
                    </h1>

                    <p className={`mt-6 max-w-2xl text-lg md:text-[1.7rem] md:leading-snug ${mutedText}`}>
                      Built in Philadelphia. Powered by real experience. Designed for the future of rentals, sales, and property management.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Button
                        className="rounded-full bg-[#d6b06a] px-8 py-7 text-lg text-[#08111f] hover:bg-[#e4be78]"
                        onClick={() => goToPage("rentals")}
                      >
                        Find a Rental
                      </Button>
                      <Button
                        variant="outline"
                        className={outlineButtonClasses}
                        onClick={() => goToPage("property-management")}
                      >
                        List Your Property
                      </Button>
                    </div>
                  </div>

                  <GlassCard
                    lightMode={lightMode}
                    className="w-full max-w-[760px] p-8 lg:justify-self-end lg:min-h-[340px] !bg-white/[0.006] !backdrop-blur-[14px] before:!opacity-40 after:!opacity-35"
                  >
                    <div className="space-y-6">
                      <div className={`text-[1.05rem] ${mutedText}`}>Philadelphia Portfolio</div>
                      <div className="text-4xl font-semibold md:text-6xl">100+ Units</div>
                      <div className={`text-lg ${mutedText}`}>Managed across Philly & surrounding areas</div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <GlassCard
                          lightMode={lightMode}
                          className={`p-5 !rounded-[22px] ${
                            lightMode
                              ? "bg-white/20"
                              : "!bg-white/[0.004] !backdrop-blur-[10px] before:!opacity-25 after:!opacity-20"
                          }`}
                        >
                          <div className="text-3xl font-semibold">98%</div>
                          <div className={`mt-1 ${mutedText}`}>Occupancy</div>
                        </GlassCard>
                        <GlassCard
                          lightMode={lightMode}
                          className={`p-5 !rounded-[22px] ${
                            lightMode
                              ? "bg-white/20"
                              : "!bg-white/[0.004] !backdrop-blur-[10px] before:!opacity-25 after:!opacity-20"
                          }`}
                        >
                          <div className="text-3xl font-semibold">8+</div>
                          <div className={`mt-1 ${mutedText}`}>Platforms</div>
                        </GlassCard>
                      </div>
                    </div>
                  </GlassCard>
                </section>

                <GlassCard
                  lightMode={lightMode}
                  className="p-7 md:p-8 !bg-white/[0.006] !backdrop-blur-[16px] before:!opacity-45 after:!opacity-35"
                >
                  <div className="grid gap-6 md:grid-cols-[0.9fr_2.1fr] md:items-center">
                    <div className="pr-2">
                      <h2 className="text-2xl font-semibold md:text-[2rem]">Your Property. Everywhere.</h2>
                      <p className={`mt-3 text-base md:text-lg ${mutedText}`}>
                        We distribute listings across all major platforms for maximum exposure.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {platforms.map((platform) => (
                        <div
                          key={platform}
                          className={`${pillClasses} flex min-h-[56px] items-center justify-center text-center text-sm md:text-base`}
                        >
                          {platform}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                <section className="grid gap-6 md:grid-cols-3">
                  {[
                    {
                      title: "Find a Rental",
                      desc: "Browse listings and apply with ease",
                      page: "rentals" as PageKey,
                      icon: Home,
                    },
                    {
                      title: "Property Management",
                      desc: "Full-service management for owners",
                      page: "property-management" as PageKey,
                      icon: Building2,
                    },
                    {
                      title: "Buy & Sell",
                      desc: "Work with experienced agents",
                      page: "listings" as PageKey,
                      icon: Briefcase,
                    },
                  ].map((service) => (
                    <GlassCard lightMode={lightMode} key={service.title} className="p-6">
                      <service.icon className="mb-4 h-6 w-6 text-[#d6b06a]" />
                      <h3 className="text-xl font-semibold">{service.title}</h3>
                      <p className={`mt-2 ${mutedText}`}>{service.desc}</p>
                      <button
                        onClick={() => goToPage(service.page)}
                        className="mt-4 text-sm text-[#d6b06a]"
                      >
                        Explore →
                      </button>
                    </GlassCard>
                  ))}
                </section>

                <GlassCard lightMode={lightMode} className="p-6 md:p-10">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <div className={`text-sm uppercase tracking-[0.2em] ${subtleText}`}>About Us</div>
                      <h2 className="mt-2 text-3xl font-semibold">Penn Liberty Real Estate</h2>
                      <p className={`mt-4 leading-relaxed ${mutedText}`}>
                        Penn Liberty Real Estate was founded in 2009 by a father and son, two local market experts with experience across all areas of the real estate industry. The company has grown steadily despite market fluctuations, providing knowledgeable representation across Philadelphia and surrounding counties.
                      </p>
                      <p className={`mt-4 leading-relaxed ${mutedText}`}>
                        Whether you are buying, selling, or investing, our team is positioned to guide you with real experience and local insight.
                      </p>
                      <div className="mt-6 font-medium text-[#d6b06a]">
                        Over 25+ years of real estate experience delivering results in both sales and property management.
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {["2009 Founded", "100+ Units Managed", "8+ Listing Platforms", "25+ Years Experience"].map((value) => (
                        <div
                          key={value}
                          className={
                            lightMode
                              ? "rounded-2xl border border-black/10 bg-black/5 p-4"
                              : "rounded-2xl border border-white/10 bg-black/5 p-4"
                          }
                        >
                          {value}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </>
            )}

            {activePage === "rentals" && (
              <section className="space-y-6">
                <GlassCard lightMode={lightMode} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Input
                      placeholder="Title"
                      value={newRental.title}
                      onChange={(e) => setNewRental({ ...newRental, title: e.target.value })}
                      className={inputClasses}
                    />
                    <Input
                      placeholder="Price"
                      value={newRental.price}
                      onChange={(e) => setNewRental({ ...newRental, price: e.target.value })}
                      className={inputClasses}
                    />
                    <Input
                      placeholder="Meta"
                      value={newRental.meta}
                      onChange={(e) => setNewRental({ ...newRental, meta: e.target.value })}
                      className={inputClasses}
                    />
                    <Button onClick={addRental}>+ Add Rental</Button>
                  </div>
                </GlassCard>

                <div>
                  <h2 className="mb-2 text-3xl font-semibold">Available Rentals</h2>
                  <p className={mutedText}>Only currently available rentals are shown here.</p>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                  <GlassCard lightMode={lightMode} className="p-4 md:p-5">
                    <div className="relative min-h-[580px] overflow-hidden rounded-[28px] border border-white/10 bg-[#111a27]">
                      <img
                        src="https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=1800&q=80"
                        alt="Philadelphia rental map"
                        className="h-full w-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,10,18,0.15),rgba(6,10,18,0.45))]" />
                      {rentals.map((rental, index) => {
                        const positions = [
                          { top: "34%", left: "58%" },
                          { top: "24%", left: "72%" },
                          { top: "18%", left: "51%" },
                        ];
                        const position = positions[index] ?? positions[0];
                        return (
                          <div
                            key={rental.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={{ top: position.top, left: position.left }}
                          >
                            <div className="rounded-full border border-white/20 bg-black/50 px-3 py-2 text-sm text-white backdrop-blur-md">
                              {rental.price}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>

                  <div className="grid gap-4">
                    {rentals.map((rental) => (
                      <Card
                        key={rental.id}
                        className={
                          lightMode
                            ? "overflow-hidden border-black/10 bg-white/60 text-black"
                            : "overflow-hidden border-white/10 bg-white/[0.01] text-white"
                        }
                      >
                        <img src={rental.image} alt={rental.title} className="h-48 w-full object-cover" />
                        <CardContent className="p-4">
                          <h3 className="text-xl font-semibold">{rental.title}</h3>
                          <p className={mutedText}>{rental.meta}</p>
                          <p className="mt-2 font-medium">{rental.price}</p>
                          <p className={`mt-1 text-sm ${subtleText}`}>{rental.area}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activePage === "property-management" && (
              <section>
                <h2 className="text-3xl font-semibold">Property Management</h2>
                <p className={`mt-4 max-w-2xl ${mutedText}`}>
                  We manage 100+ units across Philadelphia with a hands-on, full-service approach for owners and investors.
                </p>
              </section>
            )}

            {activePage === "listings" && (
              <section className="space-y-6">
                <GlassCard lightMode={lightMode} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Input
                      placeholder="Title"
                      value={newListing.title}
                      onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                      className={inputClasses}
                    />
                    <Input
                      placeholder="Price"
                      value={newListing.price}
                      onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                      className={inputClasses}
                    />
                    <Input
                      placeholder="Address"
                      value={newListing.address}
                      onChange={(e) => setNewListing({ ...newListing, address: e.target.value })}
                      className={inputClasses}
                    />
                    <Button onClick={addListing}>+ Add Listing</Button>
                  </div>
                </GlassCard>

                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className={`text-sm uppercase tracking-[0.2em] ${subtleText}`}>Listings Map</div>
                    <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Explore active listings visually</h2>
                    <p className={`mt-3 max-w-2xl ${mutedText}`}>
                      Pins are loaded on the map by default so buyers can browse visually first, then search by address if they want.
                    </p>
                  </div>
                  <div className="w-full md:w-[340px]">
                    <Input
                      value={listingSearch}
                      onChange={(event) => setListingSearch(event.target.value)}
                      placeholder="Search address, area, or price"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
                  <GlassCard lightMode={lightMode} className="max-h-[760px] overflow-hidden p-4 md:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-xl font-semibold">Active Listings</div>
                        <div className={`${mutedText} text-sm`}>{filteredListings.length} showing on map</div>
                      </div>
                    </div>

                    <div className="max-h-[660px] space-y-4 overflow-y-auto pr-1">
                      {filteredListings.map((listing) => {
                        const isSelected = selectedListing.id === listing.id;
                        return (
                          <button
                            key={listing.id}
                            onClick={() => setSelectedListingId(listing.id)}
                            className={`w-full overflow-hidden rounded-[24px] border text-left transition ${
                              lightMode
                                ? isSelected
                                  ? "border-black/25 bg-black/5"
                                  : "border-black/10 bg-white/45 hover:bg-white/65"
                                : isSelected
                                  ? "border-white/25 bg-white/[0.07]"
                                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                            }`}
                          >
                            <div className="grid grid-cols-[110px_1fr] gap-0">
                              <img
                                src={listing.image}
                                alt={listing.title}
                                className="h-full min-h-[118px] w-full object-cover"
                              />
                              <div className="p-4">
                                <div className="text-lg font-semibold">{listing.price}</div>
                                <div className="mt-1 font-medium">{listing.title}</div>
                                <div className={`mt-1 text-sm ${mutedText}`}>{listing.address}</div>
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

                        <div className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1.5 text-sm text-white backdrop-blur-md">
                          Philadelphia & surrounding areas
                        </div>

                        {filteredListings.map((listing) => {
                          const isSelected = selectedListing.id === listing.id;
                          return (
                            <button
                              key={listing.id}
                              onClick={() => setSelectedListingId(listing.id)}
                              className="absolute -translate-x-1/2 -translate-y-1/2"
                              style={{ top: listing.top, left: listing.left }}
                            >
                              <div
                                className={`flex h-11 min-w-[52px] items-center justify-center rounded-full border px-3 text-sm font-semibold shadow-lg backdrop-blur-md transition ${
                                  isSelected
                                    ? "border-[#d6b06a] bg-[#d6b06a] text-[#08111f]"
                                    : "border-white/20 bg-black/45 text-white"
                                }`}
                              >
                                {listing.price.replace(",000", "k")}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <GlassCard lightMode={lightMode} className="p-4 md:p-5">
                        <div className="overflow-hidden rounded-[24px]">
                          <img
                            src={selectedListing.image}
                            alt={selectedListing.title}
                            className="h-[180px] w-full object-cover"
                          />
                        </div>
                        <div className="mt-4 text-2xl font-semibold">{selectedListing.price}</div>
                        <div className="mt-1 text-lg font-medium">{selectedListing.title}</div>
                        <div className={`mt-2 text-sm ${mutedText}`}>{selectedListing.address}</div>
                        <div className={`mt-4 text-sm ${mutedText}`}>{listingSummary(selectedListing)}</div>
                        <div className="mt-5 flex flex-col gap-3">
                          <Button className="rounded-full bg-[#d6b06a] text-[#08111f] hover:bg-[#e4be78]">
                            View Listing
                          </Button>
                          <Button variant="outline" className={outlineButtonClasses}>
                            Schedule Tour
                          </Button>
                        </div>
                      </GlassCard>
                    </div>
                  </GlassCard>
                </div>
              </section>
            )}

            {activePage === "team" && (
              <section>
                <h2 className="mb-6 text-3xl font-semibold">Our Team</h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {team.map((person) => (
                    <GlassCard lightMode={lightMode} key={person.name} className="p-6">
                      <h3 className="text-xl font-semibold">{person.name}</h3>
                      <p className="text-[#d6b06a]">{person.role}</p>
                      <p className={`mt-2 ${mutedText}`}>{person.bio}</p>
                    </GlassCard>
                  ))}
                </div>
              </section>
            )}

            {activePage === "contact" && (
              <section>
                <h2 className="text-3xl font-semibold">Contact</h2>
                <div className={`mt-4 space-y-3 ${mutedText}`}>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> 215-987-4444
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> info@pennlibertyre.com
                  </div>
                </div>
              </section>
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
