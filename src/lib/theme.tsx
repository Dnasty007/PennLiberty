import type { ReactNode } from "react";
import { Cloud, CloudRain, CloudSnow, Moon, Sun } from "lucide-react";
import type { SaleListing } from "@/lib/data";

export type DisplayMode = "auto" | "light" | "dark";
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
  backgroundImage: string;
  overlayClass: string;
  ambience: "none" | "rain" | "snow";
  label: string;
  icon: ReactNode;
};

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
      backgroundImage:
        "url('https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?auto=format&fit=crop&w=3200&q=100')",
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,243,0.60),rgba(245,243,238,0.50))]",
      ambience: "none",
      label: "Sunny Philly",
      icon: <Sun className="h-4 w-4" />,
    },
    "cloudy-day": {
      lightMode: true,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=3200&q=100')",
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(247,244,238,0.64),rgba(244,241,236,0.56))]",
      ambience: "none",
      label: "Cloudy Philly",
      icon: <Cloud className="h-4 w-4" />,
    },
    "rain-day": {
      lightMode: true,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=3200&q=100')",
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(246,243,238,0.42),rgba(236,239,243,0.34))]",
      ambience: "rain",
      label: "Rain in Philly",
      icon: <CloudRain className="h-4 w-4" />,
    },
    "snow-day": {
      lightMode: true,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=3200&q=100')",
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(248,247,244,0.48),rgba(239,241,244,0.40))]",
      ambience: "snow",
      label: "Snow in Philly",
      icon: <CloudSnow className="h-4 w-4" />,
    },
    "clear-night": {
      lightMode: false,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=3200&q=100')",
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(4,9,17,0.50),rgba(3,8,15,0.70))]",
      ambience: "none",
      label: "Philly at Night",
      icon: <Moon className="h-4 w-4" />,
    },
    "cloudy-night": {
      lightMode: false,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=3200&q=100')",
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,18,0.52),rgba(4,8,15,0.72))]",
      ambience: "none",
      label: "Cloudy Night",
      icon: <Cloud className="h-4 w-4" />,
    },
    "rain-night": {
      lightMode: false,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=3200&q=100')",
      overlayClass:
        "absolute inset-0 bg-[linear-gradient(180deg,rgba(5,9,16,0.54),rgba(4,8,14,0.74))]",
      ambience: "rain",
      label: "Rainy Night",
      icon: <CloudRain className="h-4 w-4" />,
    },
    "snow-night": {
      lightMode: false,
      backgroundImage:
        "url('https://images.unsplash.com/photo-1511131341194-24e2eeeebb09?auto=format&fit=crop&w=3200&q=100')",
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
