import { ChevronRight, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { useRentalsHeroPhysicsMode } from "@/hooks/useRentalsHeroPhysicsMode";
import { platforms, serviceCards, type PageKey } from "@/lib/data";
import {
  PENN_BROKERAGE_LICENSE,
  PENN_FOUNDED_YEAR,
  PENN_PHONE_DISPLAY,
  PENN_PHONE_TEL,
  PENN_UNITS_MANAGED,
} from "@/lib/brand";
import type { ThemeMeta, WeatherState } from "@/lib/theme";
import { use3DTilt } from "@/lib/use3DTilt";

/** Real portfolio imagery for the homepage photo panel */
const HOME_PORTFOLIO = [
  {
    src: "/sale-media/1704-w-diamond/download.png",
    label: "Multi-family · North Philly",
    meta: "Managed & listed",
  },
  {
    src: "/sale-media/1711-n-gratz-st/getmedia.jpeg",
    label: "Triplex · Temple corridor",
    meta: "Investment sale",
  },
  {
    src: "/sale-media/2811-castor-ave/cover.jpg",
    label: "Portfolio asset · Philly",
    meta: "Active listing",
  },
] as const;

const PORTFOLIO_CYCLE_MS = 5200;
const UNITS_COUNT_TARGET = 175;

function ServiceCard({
  service,
  lightMode,
  mutedText,
  goToPage,
}: {
  service: (typeof serviceCards)[number];
  lightMode: boolean;
  mutedText: string;
  goToPage: (page: PageKey) => void;
}) {
  const tilt = use3DTilt({ maxRotateDeg: 6, trackLightSpot: true });

  const bgClasses = lightMode
    ? "border-black/[0.13] bg-white/[0.86] shadow-[0_22px_70px_rgba(12,18,28,0.14)] backdrop-blur-[20px]"
    : "border-white/[0.09] bg-[linear-gradient(180deg,rgba(8,15,26,0.84),rgba(8,15,26,0.74))] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[14px]";

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`relative overflow-hidden rounded-card border p-6 [transform-style:preserve-3d] ${bgClasses} before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),rgba(214,176,106,0.18),transparent_58%)] before:opacity-0 before:transition-opacity before:duration-200 data-[tilt-active=true]:before:opacity-100`}
    >
      <div className="relative z-10 flex h-full flex-col justify-between gap-4 [transform:translateZ(24px)]">
        <div>
          <service.icon className="mb-3.5 h-6 w-6 text-pl-gold" />
          <h3 className="text-xl font-semibold tracking-tight">{service.title}</h3>
          <p className={`mt-1.5 text-[0.9375rem] leading-relaxed ${mutedText}`}>{service.desc}</p>
        </div>
        <button
          type="button"
          onClick={() => goToPage(service.page)}
          className={`text-left text-[13px] font-semibold ${lightMode ? "text-black/60" : "text-pl-gold"}`}
        >
          {service.cta} <span className="ml-0.5">→</span>
        </button>
      </div>
    </div>
  );
}

type HeroProps = {
  goToPage: (page: PageKey) => void;
  lightMode: boolean;
  mutedText: string;
  outlineButtonClasses: string;
  pillClasses: string;
  subtleText: string;
  theme: ThemeMeta;
  weather: WeatherState;
};

function PlatformPill({
  platform,
  lightMode,
}: {
  platform: (typeof platforms)[number];
  lightMode: boolean;
}) {
  return (
    <a
      href={platform.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
        lightMode
          ? "border-black/[0.12] bg-white/88 text-black/80 hover:border-[#d6b06a]/45 hover:bg-white"
          : "border-white/[0.10] bg-white/[0.045] text-white/80 hover:border-[#d6b06a]/40 hover:bg-white/[0.08]"
      }`}
      aria-label={`Open ${platform.name} in a new tab`}
    >
      <span className={`text-[13px] font-semibold ${platform.color}`}>{platform.mark}</span>
      {platform.name}
      <ExternalLink className="h-3 w-3 opacity-45" aria-hidden />
    </a>
  );
}

/** Mobile-only: auto-slides by default; users can still swipe the strip manually. */
function PlatformMarqueeMobile({ lightMode }: { lightMode: boolean }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const userInteractingRef = useRef(false);
  const marqueeItems = [...platforms, ...platforms];

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = performance.now();
    const pxPerSecond = 36;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!userInteractingRef.current) {
        const half = scroller.scrollWidth / 2;
        if (half > 0) {
          scroller.scrollLeft += pxPerSecond * dt;
          if (scroller.scrollLeft >= half) {
            scroller.scrollLeft -= half;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const half = scroller.scrollWidth / 2;
    if (half > 0 && scroller.scrollLeft >= half) {
      scroller.scrollLeft -= half;
    }
  };

  return (
    <div
      ref={scrollerRef}
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ WebkitOverflowScrolling: "touch" }}
      data-pl-horizontal-scroll
      onTouchStart={() => {
        userInteractingRef.current = true;
      }}
      onTouchEnd={() => {
        userInteractingRef.current = false;
      }}
      onTouchCancel={() => {
        userInteractingRef.current = false;
      }}
      onScroll={handleScroll}
    >
      <div className="flex w-max gap-2.5">
        {marqueeItems.map((platform, index) => (
          <PlatformPill key={`${platform.name}-${index}`} platform={platform} lightMode={lightMode} />
        ))}
      </div>
    </div>
  );
}

/**
 * Quiet Ledger Frame + life:
 * open photo stage (crossfade cycle), clickable filmstrip, count-up units,
 * soft Ken Burns, living gold seam — still one composed object.
 */
function PortfolioPhotoPanel({ lightMode }: { lightMode: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [unitsDisplay, setUnitsDisplay] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const countedRef = useRef(false);

  const active = HOME_PORTFOLIO[activeIdx] ?? HOME_PORTFOLIO[0];
  const filmstrip = HOME_PORTFOLIO; // all three selectable

  const frameBorder = lightMode ? "border-black/[0.09]" : "border-white/[0.12]";
  const frameShadow = lightMode
    ? "shadow-[0_28px_80px_rgba(12,18,28,0.12)]"
    : "shadow-[0_28px_80px_rgba(0,0,0,0.38)]";
  const ledgerBg = lightMode ? "bg-[#f5f3ee]" : "bg-[#0a121c]";
  const ink = lightMode ? "text-[#0c1220]" : "text-white";
  const muted = lightMode ? "text-black/58" : "text-white/58";

  const stats = [
    { value: "98%", label: "Occupancy" },
    { value: "8+", label: "Platforms" },
    { value: String(PENN_FOUNDED_YEAR), label: "Founded" },
  ] as const;

  // Auto-cycle photos when in view / not hovered
  useEffect(() => {
    if (paused || HOME_PORTFOLIO.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % HOME_PORTFOLIO.length);
    }, PORTFOLIO_CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  // Count-up 0 → 175 when panel enters viewport
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setUnitsDisplay(UNITS_COUNT_TARGET);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || countedRef.current) return;
        countedRef.current = true;

        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // ease-out cubic
          const eased = 1 - (1 - t) ** 3;
          setUnitsDisplay(Math.round(UNITS_COUNT_TARGET * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Preload portfolio images
  useEffect(() => {
    HOME_PORTFOLIO.forEach((shot) => {
      const img = new Image();
      img.src = shot.src;
    });
  }, []);

  const selectShot = (idx: number) => {
    setActiveIdx(idx);
    setPaused(true);
    // Resume auto-cycle after a beat so the click “sticks”
    window.setTimeout(() => setPaused(false), PORTFOLIO_CYCLE_MS * 1.4);
  };

  return (
    <div ref={rootRef} className="relative w-full max-w-[720px] lg:justify-self-end">
      <div
        className={`overflow-hidden rounded-card border ${frameBorder} ${frameShadow}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Photo stage */}
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[5/4]">
          {HOME_PORTFOLIO.map((shot, idx) => (
            <img
              key={shot.src}
              src={shot.src}
              alt={shot.label}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
                idx === activeIdx
                  ? "opacity-100 motion-safe:pl-portfolio-ken"
                  : "opacity-0"
              }`}
              decoding="async"
              fetchPriority={idx === 0 ? "high" : "low"}
              aria-hidden={idx !== activeIdx}
            />
          ))}

          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_35%,transparent_55%,rgba(0,0,0,0.14)_100%)]"
            aria-hidden
          />
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-14 ${
              lightMode
                ? "bg-gradient-to-t from-[#f5f3ee]/90 via-[#f5f3ee]/25 to-transparent"
                : "bg-gradient-to-t from-[#0a121c]/90 via-[#0a121c]/25 to-transparent"
            }`}
            aria-hidden
          />

          {/* Live property label — updates with cycle */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 sm:bottom-4 sm:left-4 sm:right-4">
            <div className="min-w-0 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 backdrop-blur-md">
              <p className="truncate text-[11px] font-semibold text-white sm:text-[12px]">
                {active.label}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
              {HOME_PORTFOLIO.map((shot, idx) => (
                <span
                  key={shot.src}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeIdx
                      ? "w-5 bg-[#d6b06a] shadow-[0_0_8px_rgba(214,176,106,0.65)]"
                      : "w-1.5 bg-white/45"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Living gold seam — visible in dark, light, and neutral (cream) */}
        <div
          className={`relative w-full overflow-hidden ${lightMode ? "h-[3px]" : "h-[2.5px]"}`}
          aria-hidden
        >
          <div
            className={`absolute inset-0 ${
              lightMode
                ? "bg-gradient-to-r from-[#d6b06a]/25 via-[#d6b06a] to-[#d6b06a]/25"
                : "bg-gradient-to-r from-transparent via-[#d6b06a]/85 to-transparent"
            }`}
          />
          <div
            className={`pl-gold-seam-sweep absolute inset-y-0 w-2/5 ${
              lightMode
                ? "bg-gradient-to-r from-transparent via-[#f4dfb4] to-transparent opacity-95 shadow-[0_0_12px_rgba(214,176,106,0.75)]"
                : "bg-gradient-to-r from-transparent via-[#f4dfb4] to-transparent opacity-95 shadow-[0_0_10px_rgba(214,176,106,0.55)]"
            }`}
          />
        </div>

        {/* Ledger */}
        <div className={`px-5 py-5 sm:px-6 sm:py-6 ${ledgerBg}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.2rem] italic leading-none tracking-wide text-[#d6b06a] sm:text-[1.35rem]">
                Our portfolio
              </p>
              <p
                className={`mt-2.5 text-[2.15rem] font-semibold leading-none tracking-[-0.03em] sm:text-[2.45rem] ${ink}`}
              >
                <span className="text-[#d6b06a] tabular-nums">
                  {unitsDisplay}
                  <span className="align-top text-[0.55em]">+</span>
                </span>
                <span className="ml-2 text-[0.55em] font-semibold tracking-normal opacity-80">
                  units
                </span>
              </p>
              <p className={`mt-2.5 max-w-[30ch] text-[13.5px] font-medium leading-snug sm:text-[14.5px] ${muted}`}>
                Managed across Philly & surrounding areas
              </p>
            </div>

            <div
              className={`flex shrink-0 divide-x ${lightMode ? "divide-black/10" : "divide-white/12"}`}
              role="list"
              aria-label="Portfolio highlights"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="px-3.5 first:pl-0 last:pr-0 sm:px-4" role="listitem">
                  <div className="text-[1.05rem] font-semibold tracking-tight text-[#d6b06a] sm:text-[1.15rem]">
                    {stat.value}
                  </div>
                  <div className={`mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${muted}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive filmstrip — drives the hero stage */}
      <div className="mt-3.5 grid grid-cols-3 gap-2.5 sm:gap-3">
        {filmstrip.map((shot, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              key={shot.src}
              type="button"
              onClick={() => selectShot(idx)}
              className={`group min-w-0 text-left transition ${
                isActive ? "opacity-100" : "opacity-85 hover:opacity-100"
              }`}
              aria-pressed={isActive}
              aria-label={`Show ${shot.label}`}
            >
              <div
                className={`relative overflow-hidden rounded-panel border transition duration-300 ${
                  isActive
                    ? "border-[#d6b06a]/70 shadow-[0_0_0_1px_rgba(214,176,106,0.35),0_12px_28px_rgba(12,18,28,0.12)]"
                    : `${frameBorder} hover:border-[#d6b06a]/40`
                }`}
              >
                <div className="relative aspect-[16/11]">
                  <img
                    src={shot.src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                  {isActive && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#d6b06a] shadow-[0_0_8px_rgba(214,176,106,0.8)]" />
                  )}
                </div>
              </div>
              <p className={`mt-1.5 px-0.5 text-[11px] font-semibold leading-snug sm:text-[12px] ${ink}`}>
                {shot.label}
              </p>
              <p className={`px-0.5 text-[10px] font-medium sm:text-[11px] ${muted}`}>{shot.meta}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Mobile-native homepage (<md) */
function HeroMobile({
  goToPage,
  lightMode,
  mutedText,
  subtleText,
  theme,
  weather,
}: HeroProps) {
  const rowStyle = lightMode
    ? "border-black/[0.08] bg-black/[0.03] active:bg-black/[0.07]"
    : "border-white/[0.09] bg-white/[0.04] active:bg-white/[0.09]";

  return (
    <>
      <section className="min-w-0">
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] backdrop-blur-xl ${
            lightMode
              ? "border-black/12 bg-white/85 text-black/80"
              : "border-white/15 bg-white/[0.012] text-white/80"
          }`}
        >
          {theme.icon}
          <span>
            Philadelphia
            {weather.temperature !== null ? ` · ${Math.round(weather.temperature)}°` : ""}
          </span>
        </div>

        <h1 className="break-words text-[2.05rem] font-semibold leading-[1.06] tracking-[-0.03em]">
          Property management & rentals in Philadelphia.
        </h1>

        <p className={`mt-3 text-[1rem] leading-snug ${mutedText}`}>
          Reliable management, tenant placement, and multi-family sales — local and hands-on since{" "}
          {PENN_FOUNDED_YEAR}.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            size="cta"
            className="w-full shadow-cta"
            onClick={() => goToPage("property-management")}
          >
            Get a Free Property Review
          </Button>
          <Button
            variant="outline"
            size="cta"
            className={`w-full font-medium ${
              lightMode
                ? "border-black/15 bg-white/85 text-black/80"
                : "border-white/20 bg-white/[0.03] text-white/85"
            }`}
            onClick={() => goToPage("rentals")}
          >
            Browse Rentals
          </Button>
        </div>
      </section>

      {/* Mobile — same Quiet Ledger Frame (no duplicate stats glass) */}
      <div
        className={`overflow-hidden rounded-card border shadow-[0_20px_56px_rgba(12,18,28,0.10)] ${
          lightMode ? "border-black/[0.09]" : "border-white/[0.12]"
        }`}
      >
        <div className="relative aspect-[16/10]">
          <img
            src={HOME_PORTFOLIO[0].src}
            alt={HOME_PORTFOLIO[0].label}
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_35%,transparent_55%,rgba(0,0,0,0.12)_100%)]"
            aria-hidden
          />
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 ${
              lightMode
                ? "bg-gradient-to-t from-[#f5f3ee]/90 via-[#f5f3ee]/20 to-transparent"
                : "bg-gradient-to-t from-[#0a121c]/90 via-[#0a121c]/20 to-transparent"
            }`}
            aria-hidden
          />
        </div>
        {/* Living gold seam (mobile) — same continuous sweep as desktop */}
        <div
          className={`relative w-full overflow-hidden ${lightMode ? "h-[3px]" : "h-[2.5px]"}`}
          aria-hidden
        >
          <div
            className={`absolute inset-0 ${
              lightMode
                ? "bg-gradient-to-r from-[#d6b06a]/25 via-[#d6b06a] to-[#d6b06a]/25"
                : "bg-gradient-to-r from-transparent via-[#d6b06a]/85 to-transparent"
            }`}
          />
          <div
            className={`pl-gold-seam-sweep absolute inset-y-0 w-2/5 ${
              lightMode
                ? "bg-gradient-to-r from-transparent via-[#f4dfb4] to-transparent opacity-95 shadow-[0_0_12px_rgba(214,176,106,0.75)]"
                : "bg-gradient-to-r from-transparent via-[#f4dfb4] to-transparent opacity-95"
            }`}
          />
        </div>
        <div className={`px-4 py-4 ${lightMode ? "bg-[#f5f3ee]" : "bg-[#0a121c]"}`}>
          <p className="font-display text-[1.15rem] italic text-[#d6b06a]">Our portfolio</p>
          <p className={`mt-2 text-[1.85rem] font-semibold leading-none tracking-tight ${lightMode ? "text-[#0c1220]" : "text-white"}`}>
            <span className="text-[#d6b06a]">{PENN_UNITS_MANAGED}</span>
            <span className="ml-1.5 text-[0.55em] font-semibold opacity-80">units</span>
          </p>
          <p className={`mt-2 text-[13px] font-medium leading-snug ${mutedText}`}>
            Managed across Philly & surrounding areas
          </p>
          <div
            className={`mt-4 flex divide-x ${lightMode ? "divide-black/10" : "divide-white/12"}`}
          >
            {[
              ["98%", "Occupancy"],
              ["8+", "Platforms"],
              [String(PENN_FOUNDED_YEAR), "Founded"],
            ].map(([value, label]) => (
              <div key={label} className="flex-1 px-2 first:pl-0 last:pr-0">
                <div className="text-[15px] font-semibold text-[#d6b06a]">{value}</div>
                <div className={`mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${subtleText}`}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GlassCard variant={lightMode ? "frost" : "chrome"} lightMode={lightMode} className="p-4">
        <p className={`px-1 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[0.24em] ${subtleText}`}>
          How can we help?
        </p>
        <div className="space-y-2.5">
          {serviceCards.map((service) => (
            <button
              key={service.title}
              type="button"
              onClick={() => goToPage(service.page)}
              className={`flex w-full items-center gap-3.5 rounded-[18px] border px-4 py-3.5 text-left transition ${rowStyle}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pl-gold/12">
                <service.icon className="h-5 w-5 text-pl-gold" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[15px] font-semibold leading-snug ${
                    lightMode ? "text-black/90" : "text-white"
                  }`}
                >
                  {service.title}
                </span>
                <span className={`mt-0.5 block truncate text-[12.5px] ${mutedText}`}>{service.desc}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-pl-gold" aria-hidden />
            </button>
          ))}
        </div>
      </GlassCard>

      <div>
        <p className={`mb-2.5 px-1 text-[10px] font-bold uppercase tracking-[0.24em] ${subtleText}`}>
          Listed on 8+ platforms · tap to verify
        </p>
        <PlatformMarqueeMobile lightMode={lightMode} />
      </div>

      <GlassCard variant={lightMode ? "frost" : "chrome"} lightMode={lightMode} className="p-5">
        <div className={`text-[10px] font-bold uppercase tracking-[0.24em] ${subtleText}`}>About Us</div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Penn Liberty Real Estate</h2>
        <p className={`mt-3 text-[0.92rem] leading-relaxed ${mutedText}`}>
          Founded in {PENN_FOUNDED_YEAR} by a father and son — local market experts providing
          knowledgeable representation across Philadelphia and surrounding counties.
        </p>
        <p className={`mt-3 text-[12px] font-medium ${lightMode ? "text-pl-gold-ink" : "text-pl-gold"}`}>
          License {PENN_BROKERAGE_LICENSE} · {PENN_PHONE_DISPLAY}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {[
            `${PENN_FOUNDED_YEAR} Founded`,
            `${PENN_UNITS_MANAGED} Units`,
            "8+ Platforms",
            "25+ Years Exp.",
          ].map((value) => (
            <div
              key={value}
              className={`rounded-2xl border px-3 py-3 text-[13px] font-semibold ${
                lightMode ? "border-black/10 bg-black/5" : "border-white/10 bg-black/5 text-white"
              }`}
            >
              {value}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          className={`mt-4 w-full rounded-full py-5 ${
            lightMode ? "border-black/12" : "border-white/15"
          }`}
          onClick={() => goToPage("team")}
        >
          Meet the team
        </Button>
      </GlassCard>

      {/* Final conversion bar */}
      <div
        className={`rounded-card border p-4 ${
          lightMode ? "border-black/12 bg-white/88" : "border-white/10 bg-white/[0.04]"
        }`}
      >
        <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${subtleText}`}>Ready?</p>
        <div className="mt-3 flex flex-col gap-2.5">
          <Button size="cta" className="w-full" onClick={() => goToPage("property-management")}>
            Free property review
          </Button>
          <a
            href={`tel:${PENN_PHONE_TEL}`}
            className={`flex min-h-12 w-full items-center justify-center rounded-full border text-[15px] font-semibold ${
              lightMode
                ? "border-black/14 bg-white/88 text-black/85"
                : "border-white/15 bg-white/[0.04] text-white/90"
            }`}
          >
            Call {PENN_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </>
  );
}

export function Hero(props: HeroProps) {
  const { isMobile } = useRentalsHeroPhysicsMode();
  if (isMobile) return <HeroMobile {...props} />;
  return <HeroDesktop {...props} />;
}

function HeroDesktop({
  goToPage,
  lightMode,
  mutedText,
  outlineButtonClasses,
  subtleText,
  theme,
  weather,
}: HeroProps) {
  return (
    <>
      <section className="grid min-w-0 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-4">
        <div className="min-w-0 max-w-3xl">
          <div
            className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-xl ${
              lightMode
                ? "border-black/12 bg-white/85 text-black/80"
                : "border-white/15 bg-white/[0.012] text-white/80"
            }`}
          >
            {theme.icon}
            <span>
              Philadelphia
              {weather.temperature !== null ? ` · ${Math.round(weather.temperature)}°` : ""}
            </span>
            <span className={`mx-1 opacity-30`} aria-hidden>
              ·
            </span>
            <span className={lightMode ? "text-pl-gold-ink" : "text-pl-gold"}>Since {PENN_FOUNDED_YEAR}</span>
          </div>

          <h1 className="max-w-4xl break-words text-[clamp(2.35rem,4.6vw,4.35rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            Professional property management in Philadelphia.
          </h1>

          <p className={`mt-5 max-w-2xl text-[1.1rem] leading-snug md:text-[1.28rem] ${mutedText}`}>
            Trusted by Philadelphia owners for reliable management, tenant placement, and maximized
            returns. Local expertise. Hands-on service.
          </p>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
            <Button size="cta" className="px-9 text-lg shadow-cta" onClick={() => goToPage("property-management")}>
              Get a Free Property Review
            </Button>
            <Button
              variant="outline"
              size="cta"
              className={`${outlineButtonClasses} font-medium`}
              onClick={() => goToPage("rentals")}
            >
              Browse Rentals
            </Button>
            <button
              type="button"
              onClick={() => goToPage("listings")}
              className={`text-left text-sm font-semibold underline-offset-4 transition hover:underline sm:self-center sm:px-2 ${
                lightMode ? "text-black/55 hover:text-black" : "text-white/55 hover:text-white"
              }`}
            >
              Investment listings →
            </button>
          </div>

          <p className={`mt-5 text-[12px] font-medium tracking-wide ${subtleText}`}>
            PA Brokerage License {PENN_BROKERAGE_LICENSE}
            <span className="mx-2 opacity-40">·</span>
            <a href={`tel:${PENN_PHONE_TEL}`} className="hover:text-pl-gold">
              {PENN_PHONE_DISPLAY}
            </a>
          </p>
        </div>

        <PortfolioPhotoPanel lightMode={lightMode} />
      </section>

      {/* Audience paths first — conversion before logos */}
      <section className="grid gap-6 md:grid-cols-3">
        {serviceCards.map((service) => (
          <ServiceCard
            key={service.title}
            service={service}
            lightMode={lightMode}
            mutedText={mutedText}
            goToPage={goToPage}
          />
        ))}
      </section>

      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`p-7 md:p-8 ${lightMode ? "" : "!bg-white/[0.006] !backdrop-blur-[16px] before:!opacity-45 after:!opacity-35"}`}
      >
        <div className="grid gap-6 md:grid-cols-[0.9fr_2.1fr] md:items-center">
          <div className="pr-2">
            <h2 className="text-2xl font-semibold md:text-[2rem]">Listed on 8+ major platforms</h2>
            <p className={`mt-3 text-base md:text-lg ${mutedText}`}>
              Maximum exposure across the networks that matter most for Philly rentals and sales.
              Click any platform to open the real site — search your address and see the distribution
              for yourself.
            </p>
            <p className={`mt-3 text-[13px] font-medium ${lightMode ? "text-pl-gold-ink" : "text-pl-gold"}`}>
              Opens in a new tab · no login required
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {platforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex min-h-[78px] items-center gap-3 rounded-panel border px-3.5 py-3 text-left text-sm transition duration-200 md:text-[15px] ${
                  lightMode
                    ? "border-black/[0.12] bg-white/90 hover:border-[#d6b06a]/50 hover:bg-white hover:shadow-[0_12px_32px_rgba(12,18,28,0.08)]"
                    : "border-white/[0.10] bg-white/[0.04] hover:border-[#d6b06a]/40 hover:bg-white/[0.08]"
                }`}
                aria-label={`Open ${platform.name} in a new tab`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${
                    lightMode
                      ? "border-black/12 bg-white group-hover:border-[#d6b06a]/35"
                      : "border-white/10 bg-white/[0.045] group-hover:border-[#d6b06a]/35"
                  } ${platform.color}`}
                >
                  <span className="text-sm font-semibold tracking-tight">{platform.mark}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 leading-tight font-medium">
                    <span className="truncate">{platform.name}</span>
                    <ExternalLink
                      className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-55"
                      aria-hidden
                    />
                  </div>
                  <div className={`mt-0.5 text-[11px] font-medium ${mutedText}`}>Visit site ↗</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard variant={lightMode ? "frost" : "chrome"} lightMode={lightMode} className="p-6 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-[0.24em] ${subtleText}`}>About Us</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Penn Liberty Real Estate</h2>
            <p className={`mt-4 leading-relaxed ${mutedText}`}>
              Penn Liberty Real Estate was founded in {PENN_FOUNDED_YEAR} by a father and son — two local
              market experts with experience across sales and property management. The company has grown
              steadily despite market fluctuations, providing knowledgeable representation across
              Philadelphia and surrounding counties.
            </p>
            <p className={`mt-4 leading-relaxed ${mutedText}`}>
              Whether you are buying, selling, investing, or placing a rental, our team guides you with
              real experience and local insight.
            </p>
            <div className="mt-6 font-medium text-pl-gold">
              Over 25+ years of real estate experience delivering results in both sales and property
              management.
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="cta" onClick={() => goToPage("team")}>
                Meet the team
              </Button>
              <Button
                variant="outline"
                size="cta"
                className={outlineButtonClasses}
                onClick={() => goToPage("contact")}
              >
                Contact the desk
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              `${PENN_FOUNDED_YEAR} Founded`,
              `${PENN_UNITS_MANAGED} Units Managed`,
              "8+ Listing Platforms",
              "25+ Years Experience",
            ].map((value) => (
              <div
                key={value}
                className={`rounded-panel border px-4 py-4 font-semibold ${
                  lightMode
                    ? "border-black/10 bg-black/[0.04]"
                    : "border-white/10 bg-white/[0.04] text-white"
                }`}
              >
                {value}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Closing conversion bar */}
      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className="flex flex-col items-start justify-between gap-5 p-6 md:flex-row md:items-center md:p-8"
      >
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${subtleText}`}>
            Three paths · one desk
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight md:text-xl">
            Owners · Renters · Investors — we&apos;ll steer you right.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button size="cta" onClick={() => goToPage("property-management")}>
            Free property review
          </Button>
          <Button
            variant="outline"
            size="cta"
            className={outlineButtonClasses}
            onClick={() => goToPage("rentals")}
          >
            Browse rentals
          </Button>
          <Button
            variant="outline"
            size="cta"
            className={outlineButtonClasses}
            onClick={() => goToPage("listings")}
          >
            Investment map
          </Button>
        </div>
      </GlassCard>
    </>
  );
}
