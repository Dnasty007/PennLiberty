import type { ReactNode } from "react";
import { Cloud, CloudRain, CloudSnow, Moon, Sun } from "lucide-react";
import type { SaleListing } from "@/lib/data";
import { dayBackdropPool, nightBackdropPool } from "@/lib/siteImagery";

export type DisplayMode = "neutral" | "light" | "dark";
export type WeatherTheme =
  | "clear-day"
  | "cloudy-day"
  | "rain-day"
  | "snow-day"
  | "clear-night"
  | "cloudy-night"
  | "rain-night"
  | "snow-night";

export type WeatherState = {
  code: number;
  temperature: number | null;
  loading: boolean;
  error: boolean;
};

export type ThemeMeta = {
  lightMode: boolean;
  /** When false, no Philadelphia photo layer is shown (neutral default). */
  showBackdrop: boolean;
  backgroundImage: string;
  overlayClass: string;
  ambience: "none" | "rain" | "snow";
  label: string;
  icon: ReactNode;
};

/** Warm cream shell — default site look, no skyline photos. */
export const neutralThemeMeta: ThemeMeta = {
  lightMode: true,
  showBackdrop: false,
  backgroundImage: "none",
  overlayClass: "fixed inset-0 z-[1] pointer-events-none bg-[#f5f3ee]",
  ambience: "none",
  label: "Philadelphia",
  icon: <Sun className="h-4 w-4 opacity-70" />,
};

export function backdropCssUrl(path: string): string {
  return `url('${path}')`;
}

/**
 * Backdrop photo CSS: `index.css` (`.site-backdrop`) + `siteBackdropImageClass` in App.tsx.
 * `clear-day` / `clear-night` set overlay gradients below; image URL comes from `backdropPath`.
 */
export function themeForDisplayMode(mode: DisplayMode, backdropPath?: string): ThemeMeta {
  if (mode === "neutral") {
    return neutralThemeMeta;
  }

  const base = themeMeta(mode === "light" ? "clear-day" : "clear-night");
  if (!backdropPath) {
    return base;
  }

  return { ...base, backgroundImage: backdropCssUrl(backdropPath) };
}

export const PHILLY_COORDS = {
  latitude: 39.9526,
  longitude: -75.1652,
};

export function getThemeFromWeather(code: number, isDay: boolean): WeatherTheme {
  const suffix = isDay ? "day" : "night";

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return `snow-${suffix}` as WeatherTheme;
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return `rain-${suffix}` as WeatherTheme;
  }

  if ([1, 2, 3, 45, 48].includes(code)) {
    return `cloudy-${suffix}` as WeatherTheme;
  }

  return `clear-${suffix}` as WeatherTheme;
}

export function themeMeta(theme: WeatherTheme): ThemeMeta {
  const map: Record<WeatherTheme, ThemeMeta> = {
    "clear-day": {
      lightMode: true,
      showBackdrop: true,
      backgroundImage: backdropCssUrl(dayBackdropPool[0]),
      /* overlay on top of .site-backdrop: cover, center, fixed (see index.css) */
      overlayClass:
        "fixed inset-0 z-[1] pointer-events-none bg-[linear-gradient(180deg,rgba(255,250,243,0.14),rgba(245,243,238,0.06))]",
      ambience: "none",
      label: "Sunny Philly",
      icon: <Sun className="h-4 w-4" />,
    },
    "cloudy-day": {
      lightMode: true,
      showBackdrop: true,
      backgroundImage: backdropCssUrl(dayBackdropPool[1]),
      overlayClass:
        "fixed inset-0 bg-[linear-gradient(180deg,rgba(247,244,238,0.64),rgba(244,241,236,0.56))]",
      ambience: "none",
      label: "Cloudy Philly",
      icon: <Cloud className="h-4 w-4" />,
    },
    "rain-day": {
      lightMode: true,
      showBackdrop: true,
      backgroundImage: backdropCssUrl(dayBackdropPool[2]),
      overlayClass:
        "fixed inset-0 bg-[linear-gradient(180deg,rgba(246,243,238,0.42),rgba(236,239,243,0.34))]",
      ambience: "rain",
      label: "Rain in Philly",
      icon: <CloudRain className="h-4 w-4" />,
    },
    "snow-day": {
      lightMode: true,
      showBackdrop: true,
      backgroundImage: backdropCssUrl(dayBackdropPool[0]),
      overlayClass:
        "fixed inset-0 bg-[linear-gradient(180deg,rgba(248,247,244,0.48),rgba(239,241,244,0.40))]",
      ambience: "snow",
      label: "Snow in Philly",
      icon: <CloudSnow className="h-4 w-4" />,
    },
    "clear-night": {
      lightMode: false,
      showBackdrop: true,
      backgroundImage: backdropCssUrl(nightBackdropPool[0]),
      /* overlay on top of .site-backdrop: cover, center, fixed (see index.css) */
      overlayClass:
        "fixed inset-0 z-[1] pointer-events-none bg-[linear-gradient(180deg,rgba(0,0,0,0.55),rgba(0,0,0,0.72)_50%,rgba(0,0,0,0.82))]",
      ambience: "none",
      label: "Philly at Night",
      icon: <Moon className="h-4 w-4" />,
    },
    "cloudy-night": {
      lightMode: false,
      showBackdrop: true,
      backgroundImage: backdropCssUrl(nightBackdropPool[1]),
      overlayClass:
        "fixed inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.72),rgba(0,0,0,0.82) 55%,rgba(0,0,0,0.92))]",
      ambience: "none",
      label: "Cloudy Night",
      icon: <Cloud className="h-4 w-4" />,
    },
    "rain-night": {
      lightMode: false,
      showBackdrop: true,
      backgroundImage: backdropCssUrl(nightBackdropPool[2]),
      overlayClass:
        "fixed inset-0 bg-[linear-gradient(180deg,rgba(5,9,16,0.54),rgba(4,8,14,0.74))]",
      ambience: "rain",
      label: "Rainy Night",
      icon: <CloudRain className="h-4 w-4" />,
    },
    "snow-night": {
      lightMode: false,
      showBackdrop: true,
      backgroundImage: backdropCssUrl(nightBackdropPool[0]),
      overlayClass:
        "fixed inset-0 bg-[linear-gradient(180deg,rgba(6,10,18,0.48),rgba(5,9,16,0.68))]",
      ambience: "snow",
      label: "Snowy Night",
      icon: <CloudSnow className="h-4 w-4" />,
    },
  };

  return map[theme];
}

export function propertyOverview(listing: {
  beds: number;
  baths: number;
  sqft?: number;
  propertyType?: string;
  units?: number;
  lotSqft?: number;
}) {
  if (listing.propertyType === "Land") {
    const lotSize = listing.lotSqft ?? listing.sqft;
    if (lotSize) return `${lotSize.toLocaleString()} sqft lot`;
  }

  if (listing.units && listing.sqft) {
    return `${listing.units} Units • ${listing.sqft.toLocaleString()} sqft`;
  }

  if (listing.beds === 0 && listing.baths === 0) {
    const sqftPart = listing.sqft ? ` • ${listing.sqft.toLocaleString()} sqft` : "";
    return `Contact for unit details${sqftPart}`;
  }

  const sqftPart = listing.sqft ? ` • ${listing.sqft.toLocaleString()} sqft` : "";
  return `${listing.beds} Beds • ${listing.baths} Baths${sqftPart}`;
}

export function listingSummary(listing: SaleListing) {
  return propertyOverview(listing);
}
