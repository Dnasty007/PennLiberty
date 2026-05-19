import { Menu, X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { manageBuildingResidentLoginUrl, navItems, type PageKey } from "@/lib/data";
import type { DisplayMode, ThemeMeta, WeatherState } from "@/lib/theme";

type HeaderProps = {
  activePage: PageKey;
  displayMode: DisplayMode;
  goToPage: (page: PageKey) => void;
  lightMode: boolean;
  mobileOpen: boolean;
  setDisplayMode: (mode: DisplayMode) => void;
  setMobileOpen: (value: boolean | ((value: boolean) => boolean)) => void;
  subtleText: string;
  theme: ThemeMeta;
  weather: WeatherState;
};

const visibleDisplayModes = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
] as const;

/** Clicking the active mode again returns to neutral (default). */
function pickDisplayMode(current: DisplayMode, next: "light" | "dark"): DisplayMode {
  return current === next ? "neutral" : next;
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
  const wrapper = lightMode ? "border-black/12 bg-white/50" : "border-white/16 bg-white/[0.045]";
  const active = lightMode ? "bg-black/6 text-black shadow-sm" : "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
  const idle = lightMode ? "text-black/65 hover:bg-black/5 hover:text-black" : "text-white/72 hover:bg-white/[0.06] hover:text-white";

  return (
    <div className={`hidden items-center gap-1 rounded-full border px-1 py-1 lg:flex ${wrapper}`}>
      {visibleDisplayModes.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(pickDisplayMode(mode, item.key))}
          className={`rounded-full px-3 py-1.5 text-xs transition ${
            mode === item.key
              ? `${active} ring-1 ring-[#d6b06a]/55`
              : idle
          }`}
          aria-pressed={mode === item.key}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Header({
  activePage,
  displayMode,
  goToPage,
  lightMode,
  mobileOpen,
  setDisplayMode,
  setMobileOpen,
  subtleText,
  theme,
  weather,
}: HeaderProps) {
  const navIdleClasses = lightMode
    ? "text-black/72 hover:bg-black/7 hover:text-black"
    : "text-white/78 hover:bg-white/[0.055] hover:text-white";
  const navActiveClasses = lightMode
    ? "bg-black/7 text-black shadow-sm"
    : "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
  const mobileBorder = lightMode ? "border-black/10" : "border-white/10";
  const mobileActiveClasses = lightMode
    ? "bg-black/8 text-black"
    : "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
  const mobileIdleClasses = lightMode
    ? "text-black/70 hover:bg-black/8 hover:text-black"
    : "text-white/80 hover:bg-white/[0.045] hover:text-white";
  const menuButtonClasses = lightMode
    ? "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/15 bg-white/45 shadow-sm lg:hidden"
    : "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.18)] lg:hidden";
  const mobileModeButton = lightMode
    ? "rounded-full bg-black/5 px-3 py-1 text-xs text-black"
    : "rounded-full bg-white/[0.05] px-3 py-1 text-xs text-white";

  return (
    <header className="relative z-20 px-4 pt-6 md:px-8 md:pt-8">
      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className="mx-auto max-w-[1200px] overflow-visible px-5 py-3 md:px-7"
      >
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => goToPage("home")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <img
                src="/branding/liberty-head.png"
                alt="Penn Liberty Liberty-head mark"
                className="h-14 w-14 origin-right scale-[1.38] transform object-contain will-change-transform"
              />
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
                className={`rounded-full px-4 py-2 text-sm transition-colors duration-200 ${
                  activePage === item.key ? navActiveClasses : navIdleClasses
                }`}
              >
                {item.label}
              </button>
            ))}
            <a
              href={manageBuildingResidentLoginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full px-4 py-2 text-sm transition-colors duration-200 ${navIdleClasses}`}
              aria-label="Resident login — opens Buildium Resident portal in a new tab"
            >
              Resident Log in
            </a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <DisplayModeControl mode={displayMode} onChange={setDisplayMode} lightMode={lightMode} />
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
          <div className={`mt-4 space-y-3 border-t pt-4 lg:hidden ${mobileBorder}`}>
            <div className="flex items-center justify-between gap-2 pb-1">
              <span className={`text-xs uppercase tracking-[0.2em] ${subtleText}`}>Display</span>
              <div className="flex items-center gap-1">
                {visibleDisplayModes.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setDisplayMode(pickDisplayMode(displayMode, item.key))}
                    className={`${mobileModeButton} ${displayMode === item.key ? "ring-1 ring-[#d6b06a]/70" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={`mb-1 flex items-center gap-2 rounded-2xl px-3 py-2.5 ${
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
                className={`block w-full rounded-2xl px-3 py-2.5 text-left text-sm ${
                  activePage === item.key ? mobileActiveClasses : mobileIdleClasses
                }`}
              >
                {item.label}
              </button>
            ))}
            <a
              href={manageBuildingResidentLoginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full rounded-2xl px-3 py-2.5 text-left text-sm ${mobileIdleClasses}`}
              aria-label="Resident login — opens Buildium Resident portal in a new tab"
              onClick={() => setMobileOpen(false)}
            >
              Resident Log in
            </a>
          </div>
        )}
      </GlassCard>
    </header>
  );
}
