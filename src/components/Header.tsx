import type { MouseEvent } from "react";
import { Menu, Phone, X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { manageBuildingResidentLoginUrl, navItems, type PageKey } from "@/lib/data";
import { buildAppPath } from "@/lib/routing";
import { PENN_PHONE_DISPLAY, PENN_PHONE_TEL, PENN_TAGLINE } from "@/lib/brand";
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
  const wrapper = lightMode ? "border-black/14 bg-white/80" : "border-white/16 bg-white/[0.045]";
  const active = lightMode
    ? "bg-black/8 text-black shadow-sm"
    : "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
  const idle = lightMode
    ? "text-black/78 hover:bg-black/6 hover:text-black"
    : "text-white/72 hover:bg-white/[0.06] hover:text-white";

  return (
    <div className={`hidden items-center gap-1 rounded-full border px-1 py-1 lg:flex ${wrapper}`}>
      {visibleDisplayModes.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(pickDisplayMode(mode, item.key))}
          className={`rounded-full px-3 py-1.5 text-xs transition ${
            mode === item.key ? `${active} ring-1 ring-pl-gold/55` : idle
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
    ? "text-black/75 hover:bg-black/8 hover:text-black"
    : "text-white/78 hover:bg-white/[0.055] hover:text-white";
  const navActiveClasses = lightMode
    ? "bg-black/8 text-black shadow-sm ring-1 ring-pl-gold/45"
    : "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-pl-gold/40";
  const mobileBorder = lightMode ? "border-black/12" : "border-white/10";
  const mobileActiveClasses = lightMode
    ? "bg-black/9 text-black"
    : "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
  const mobileIdleClasses = lightMode
    ? "text-black/72 hover:bg-black/8 hover:text-black"
    : "text-white/80 hover:bg-white/[0.045] hover:text-white";
  const menuButtonClasses = lightMode
    ? "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/15 bg-white/80 shadow-sm lg:hidden"
    : "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.18)] lg:hidden";
  const mobileModeButton = lightMode
    ? "min-h-11 rounded-full bg-black/6 px-4 py-2.5 text-sm text-black"
    : "min-h-11 rounded-full bg-white/[0.05] px-4 py-2.5 text-sm text-white";

  const handleNav = (page: PageKey, e: MouseEvent) => {
    e.preventDefault();
    goToPage(page);
    setMobileOpen(false);
  };

  return (
    <header className="relative z-30 px-4 pt-4 md:px-8 md:pt-6 lg:sticky lg:top-0 lg:pt-5">
      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className="mx-auto max-w-[1200px] overflow-hidden px-4 py-2.5 md:px-6 md:py-3"
      >
        <div className="flex items-center justify-between gap-3">
          <a
            href="/"
            onClick={(e) => handleNav("home", e)}
            className="flex min-w-0 items-center gap-2.5 text-left sm:gap-3"
          >
            <div className="relative h-11 w-11 shrink-0 sm:h-12 sm:w-12">
              <img
                src="/branding/liberty-head.png"
                alt="Penn Liberty mark"
                className="h-full w-full object-contain object-center"
              />
            </div>
            <div className="min-w-0">
              {/* Wordmark matches business cards: slate → liberty blue fade */}
              <div className="text-[15px] font-semibold tracking-[0.04em] sm:text-lg sm:tracking-wide">
                <span className={lightMode ? "text-[#5b6573]" : "text-[#cdd5e1]"}>PEN</span>
                <span
                  className={`bg-gradient-to-r bg-clip-text text-transparent ${
                    lightMode ? "from-[#5b6573] to-[#1746b8]" : "from-[#cdd5e1] to-[#3f86f7]"
                  }`}
                >
                  N
                </span>
                <span className={lightMode ? "text-[#1746b8]" : "text-[#3f86f7]"}> LIBERTY</span>
              </div>
              <div className={`hidden text-[10px] uppercase tracking-[0.18em] sm:block ${subtleText}`}>
                {PENN_TAGLINE}
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={buildAppPath({ page: item.key })}
                onClick={(e) => handleNav(item.key, e)}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors duration-200 ${
                  activePage === item.key ? navActiveClasses : navIdleClasses
                }`}
                aria-current={activePage === item.key ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
            <a
              href={manageBuildingResidentLoginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`group rounded-full px-3.5 py-2 text-sm transition-colors duration-200 ${navIdleClasses}`}
              aria-label="Resident login, opens Buildium Resident portal in a new tab"
            >
              Resident Log in
              <span
                aria-hidden
                className="ml-1 inline-block text-[11px] opacity-50 transition-opacity group-hover:opacity-90"
              >
                ↗
              </span>
            </a>
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <a
              href={`tel:${PENN_PHONE_TEL}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                lightMode
                  ? "border-black/14 bg-white/80 text-black/80 hover:border-pl-gold/50"
                  : "border-white/14 bg-white/[0.04] text-white/85 hover:border-pl-gold/45"
              }`}
              aria-label={`Call ${PENN_PHONE_DISPLAY}`}
            >
              <Phone className="h-3.5 w-3.5 text-pl-gold" aria-hidden />
              {PENN_PHONE_DISPLAY}
            </a>
            <DisplayModeControl mode={displayMode} onChange={setDisplayMode} lightMode={lightMode} />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className={menuButtonClasses}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className={`mt-3 space-y-2 border-t pt-3 lg:hidden ${mobileBorder}`}>
            <div className="flex items-center justify-between gap-2 pb-1">
              <span className={`text-xs uppercase tracking-[0.2em] ${subtleText}`}>Display</span>
              <div className="flex items-center gap-1.5">
                {visibleDisplayModes.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setDisplayMode(pickDisplayMode(displayMode, item.key))}
                    className={`${mobileModeButton} ${
                      displayMode === item.key ? "ring-1 ring-pl-gold/70" : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={`mb-1 flex items-center gap-2 rounded-2xl px-3 py-3 ${
                lightMode ? "bg-black/6" : "bg-white/6"
              }`}
            >
              {theme.icon}
              <span className="text-sm">
                {weather.temperature !== null ? `${Math.round(weather.temperature)}°` : "--°"}{" "}
                Philadelphia
              </span>
            </div>
            <a
              href={`tel:${PENN_PHONE_TEL}`}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-2xl bg-pl-gold/15 px-3 py-3 text-sm font-semibold text-pl-navy"
            >
              <Phone className="h-4 w-4 text-pl-gold" aria-hidden />
              Call {PENN_PHONE_DISPLAY}
            </a>
            {navItems.map((item) => (
              <a
                key={item.key}
                href={buildAppPath({ page: item.key })}
                onClick={(e) => handleNav(item.key, e)}
                className={`block min-h-11 w-full rounded-2xl px-3 py-3 text-left text-[15px] ${
                  activePage === item.key ? mobileActiveClasses : mobileIdleClasses
                }`}
                aria-current={activePage === item.key ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
            <a
              href={manageBuildingResidentLoginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`block min-h-11 w-full rounded-2xl px-3 py-3 text-left text-[15px] ${mobileIdleClasses}`}
              aria-label="Resident login, opens Buildium Resident portal in a new tab"
              onClick={() => setMobileOpen(false)}
            >
              Resident Log in ↗
            </a>
          </div>
        )}
      </GlassCard>
    </header>
  );
}
