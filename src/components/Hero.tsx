import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { platforms, serviceCards, type PageKey } from "@/lib/data";
import type { ThemeMeta, WeatherState } from "@/lib/theme";
import { use3DTilt } from "@/lib/use3DTilt";

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
  const tilt = use3DTilt({ maxRotateDeg: 7, trackLightSpot: true });

  const bgClasses = lightMode
    ? "border-black/[0.11] bg-white/[0.58] shadow-[0_20px_70px_rgba(12,18,28,0.13)] backdrop-blur-[16px]"
    : "border-white/[0.09] bg-[linear-gradient(180deg,rgba(8,15,26,0.84),rgba(8,15,26,0.74))] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-[14px]";

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`relative overflow-hidden rounded-[30px] border p-6 [transform-style:preserve-3d] ${bgClasses} before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),rgba(214,176,106,0.18),transparent_58%)] before:opacity-0 before:transition-opacity before:duration-200 data-[tilt-active=true]:before:opacity-100`}
    >
      <div className="relative z-10 flex h-full flex-col justify-between gap-4 [transform:translateZ(24px)]">
        <div>
          <service.icon className="mb-3.5 h-6 w-6 text-[#d6b06a]" />
          <h3 className="text-xl font-semibold tracking-tight">{service.title}</h3>
          <p className={`mt-1.5 text-[0.9375rem] leading-relaxed ${mutedText}`}>{service.desc}</p>
        </div>
        <button
          onClick={() => goToPage(service.page)}
          className={`text-[13px] font-semibold ${lightMode ? "text-black/60" : "text-[#d6b06a]"}`}
        >
          Explore <span className="ml-0.5">→</span>
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

export function Hero({
  goToPage,
  lightMode,
  mutedText,
  outlineButtonClasses,
  pillClasses,
  subtleText,
  theme,
  weather,
}: HeroProps) {
  return (
    <>
      <section className="grid min-w-0 items-center gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:pt-6">
        <div className="min-w-0 max-w-3xl">
          <div
            className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-xl ${
              lightMode
                ? "border-black/10 bg-white/45 text-black/75"
                : "border-white/15 bg-white/[0.012] text-white/80"
            }`}
          >
            {theme.icon}
            <span>
              Philadelphia
              {weather.temperature !== null ? ` - ${Math.round(weather.temperature)}°` : ""}
            </span>
          </div>

          <h1 className="max-w-4xl break-words text-5xl font-semibold leading-[1.0] tracking-[-1.5px] sm:text-[3.9rem] md:text-[5rem] xl:text-[6.3rem]">
            Professional Property
            Management in
            Philadelphia.
          </h1>

          <p className={`mt-5 max-w-2xl text-[1.1rem] md:text-[1.35rem] leading-snug ${mutedText}`}>
            Trusted by Philadelphia owners for reliable management, tenant placement, and maximized returns.
            Local expertise. Hands-on service.
          </p>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
            <Button
              className="rounded-full bg-[#d6b06a] px-9 py-7 text-lg font-semibold text-[#08111f] shadow-[0_18px_44px_rgba(214,176,106,0.35)] hover:bg-[#e4be78] active:scale-[0.985] transition-transform"
              onClick={() => goToPage("rentals")}
            >
              Browse Rentals
            </Button>
            <Button
              variant="outline"
              className={`${outlineButtonClasses} font-medium border-white/30 hover:bg-white/5`}
              onClick={() => goToPage("property-management")}
            >
              Get a Free Property Review
            </Button>
          </div>
        </div>

        <GlassCard
          variant={lightMode ? "frost" : "chrome"}
          lightMode={lightMode}
          className={`w-full max-w-[720px] p-7 lg:justify-self-end lg:mt-6 ${
            lightMode ? "" : "!bg-white/[0.01] !backdrop-blur-[14px] before:!opacity-30 after:!opacity-38"
          }`}
        >
          <div className="space-y-7">
            <div className="text-center text-[2.2rem] font-semibold italic tracking-wide text-[#d6b06a] md:text-[2.8rem] [font-family:'Cormorant_Garamond',serif] [text-shadow:0_0_24px_rgba(214,176,106,0.65),0_0_60px_rgba(214,176,106,0.3),0_0_100px_rgba(214,176,106,0.12)]">Our Portfolio</div>
            <div className="text-5xl font-semibold tracking-tight md:text-[4.4rem]">100+ Units</div>
            <div className={`text-lg ${mutedText}`}>Managed across Philly & surrounding areas</div>
            <div className="mt-2 grid grid-cols-2 gap-5">
              <GlassCard
                variant={lightMode ? "frost" : "soft"}
                lightMode={lightMode}
                className={`p-5 !rounded-[22px] ${
                  lightMode
                    ? "bg-white/24"
                    : "!bg-white/[0.018] !backdrop-blur-[10px] before:!opacity-22 after:!opacity-28"
                }`}
              >
                <div className="text-3xl font-semibold tracking-tight">98%</div>
                <div className={`mt-1.5 ${mutedText}`}>Occupancy</div>
              </GlassCard>
              <GlassCard
                variant={lightMode ? "frost" : "soft"}
                lightMode={lightMode}
                className={`p-5 !rounded-[22px] ${
                  lightMode
                    ? "bg-white/24"
                    : "!bg-white/[0.018] !backdrop-blur-[10px] before:!opacity-22 after:!opacity-28"
                }`}
              >
                <div className="text-3xl font-semibold tracking-tight">8+</div>
                <div className={`mt-1.5 ${mutedText}`}>Platforms</div>
              </GlassCard>
            </div>
          </div>
        </GlassCard>
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
              Maximum exposure across the platforms that matter most.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className={`${pillClasses} flex min-h-[82px] items-center gap-4 text-left text-sm md:text-base`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                    lightMode ? "border-black/10 bg-white/46" : "border-white/10 bg-white/[0.045]"
                  } ${platform.color}`}
                >
                  <span className="text-sm font-semibold tracking-tight">{platform.mark}</span>
                </div>
                <div className="leading-tight">{platform.name}</div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

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

      <GlassCard variant={lightMode ? "frost" : "chrome"} lightMode={lightMode} className="p-6 md:p-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className={`text-sm uppercase tracking-[0.2em] ${subtleText}`}>About Us</div>
            <h2 className="mt-2 text-3xl font-semibold">Penn Liberty Real Estate</h2>
            <p className={`mt-4 leading-relaxed ${mutedText}`}>
              Penn Liberty Real Estate was founded in 2009 by a father and son, two local market
              experts with experience across all areas of the real estate industry. The company has
              grown steadily despite market fluctuations, providing knowledgeable representation
              across Philadelphia and surrounding counties.
            </p>
            <p className={`mt-4 leading-relaxed ${mutedText}`}>
              Whether you are buying, selling, or investing, our team is positioned to guide you
              with real experience and local insight.
            </p>
            <div className="mt-6 font-medium text-[#d6b06a]">
              Over 25+ years of real estate experience delivering results in both sales and
              property management.
            </div>
          </div>
          <div className="grid gap-3">
            {[
              "2009 Founded",
              "100+ Units Managed",
              "8+ Listing Platforms",
              "25+ Years Experience",
            ].map((value) => (
              <div
                key={value}
                className={`rounded-2xl border p-4 font-semibold ${
                  lightMode
                    ? "border-black/10 bg-black/5"
                    : "border-white/10 bg-black/5 text-white"
                }`}
              >
                {value}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </>
  );
}
