import type { ReactNode } from "react";
import { Cloud, CloudRain, CloudSnow, Moon, Sun } from "lucide-react";
import type { SaleListing } from "@/lib/data";

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
  overlayClass: "absolute inset-0 bg-[#f5f3ee]",
  ambience: "none",
  label: "Philadelphia",
  icon: <Sun className="h-4 w-4 opacity-70" />,
};

export function themeForDisplayMode(mode: DisplayMode): ThemeMeta {
  if (mode === "neutral") {
    return neutralThemeMeta;
  }

  return themeMeta(mode === "light" ? "clear-day" : "clear-night");
}

export const PHILLY_COORDS = {
  latitude: 39.9526,
  longitude: -75.1652,
};

/** Philadelphia backdrops — Unsplash (follow Unsplash License for attribution).

 * - Center City skyline sunset: matches Owners page vibe.
 * - Wide skyline (historic + high-rises): unmistakable Philly.
 * - Rowhomes / street-level: neighborhoods & weather moods.
 */

function unsplashBackdrop(photoId: string) {
  return `url('https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=3200&q=85')`;
}

const phillyBackdrop = {
  centerCitySunset: unsplashBackdrop("photo-1559406041-c7d2bbf2fd1c"),
  skylineHistoricModern: unsplashBackdrop("photo-1761609468138-18e19f3b1f6e"),
  residentialRowhomes: unsplashBackdrop("photo-1545158539-1709fed7e2bf"),
  centerStreet: unsplashBackdrop("photo-1496564203457-11bb12075d90"),
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
      backgroundImage: phillyBackdrop.skylineHistoricModern,
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,243,0.60),rgba(245,243,238,0.50))]",
      ambience: "none",
      label: "Sunny Philly",
      icon: <Sun className="h-4 w-4" />,
    },
    "cloudy-day": {
      lightMode: true,
      showBackdrop: true,
      backgroundImage: phillyBackdrop.centerCitySunset,
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(247,244,238,0.64),rgba(244,241,236,0.56))]",
      ambience: "none",
      label: "Cloudy Philly",
      icon: <Cloud className="h-4 w-4" />,
    },
    "rain-day": {
      lightMode: true,
      showBackdrop: true,
      backgroundImage: phillyBackdrop.residentialRowhomes,
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(246,243,238,0.42),rgba(236,239,243,0.34))]",
      ambience: "rain",
      label: "Rain in Philly",
      icon: <CloudRain className="h-4 w-4" />,
    },
    "snow-day": {
      lightMode: true,
      showBackdrop: true,
      backgroundImage: phillyBackdrop.centerStreet,
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(248,247,244,0.48),rgba(239,241,244,0.40))]",
      ambience: "snow",
      label: "Snow in Philly",
      icon: <CloudSnow className="h-4 w-4" />,
    },
    "clear-night": {
      lightMode: false,
      showBackdrop: true,
      backgroundImage: phillyBackdrop.skylineHistoricModern,
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.78),rgba(0,0,0,0.88) 50%,rgba(0,0,0,0.95))]",
      ambience: "none",
      label: "Philly at Night",
      icon: <Moon className="h-4 w-4" />,
    },
    "cloudy-night": {
      lightMode: false,
      showBackdrop: true,
      backgroundImage: phillyBackdrop.centerCitySunset,
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.72),rgba(0,0,0,0.82) 55%,rgba(0,0,0,0.92))]",
      ambience: "none",
      label: "Cloudy Night",
      icon: <Cloud className="h-4 w-4" />,
    },
    "rain-night": {
      lightMode: false,
      showBackdrop: true,
      backgroundImage: phillyBackdrop.residentialRowhomes,
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,9,16,0.54),rgba(4,8,14,0.74))]",
      ambience: "rain",
      label: "Rainy Night",
      icon: <CloudRain className="h-4 w-4" />,
    },
    "snow-night": {
      lightMode: false,
      showBackdrop: true,
      backgroundImage: phillyBackdrop.centerStreet,
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,18,0.48),rgba(5,9,16,0.68))]",
      ambience: "snow",
      label: "Snowy Night",
      icon: <CloudSnow className="h-4 w-4" />,
    },
  };

  return map[theme];
}

export function listingSummary(listing: SaleListing) {
  if (listing.propertyType === "Land") {
    const lotSize = listing.lotSqft ?? listing.sqft;
    return `${lotSize.toLocaleString()} sqft lot`;
  }

  return "units" in listing && listing.units
    ? `${listing.units} Units • ${listing.sqft.toLocaleString()} sqft`
    : `${listing.beds} Beds • ${listing.baths} Baths • ${listing.sqft.toLocaleString()} sqft`;
}
