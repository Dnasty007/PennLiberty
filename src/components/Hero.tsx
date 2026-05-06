import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { platforms, serviceCards, type PageKey } from "@/lib/data";
import type { ThemeMeta, WeatherState } from "@/lib/theme";

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
              {weather.temperature !== null ? ` - ${Math.round(weather.temperature)}°` : ""}
            </span>
          </div>

          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-tight sm:text-[3.7rem] md:text-[4.8rem] xl:text-[6.15rem]">
            Professional Property
            <br />
            Management in
            <br />
            Philadelphia.
          </h1>

          <p className={`mt-7 max-w-2xl text-lg md:text-[1.55rem] md:leading-[1.35] ${mutedText}`}>
            Trusted by Philadelphia property owners for reliable management, tenant placement, and
            maximized returns. Local expertise. Hands-on service.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              className="rounded-full bg-[#d6b06a] px-8 py-7 text-lg font-semibold text-[#08111f] shadow-[0_18px_44px_rgba(214,176,106,0.28)] hover:bg-[#e4be78]"
              onClick={() => goToPage("rentals")}
            >
              Browse Rentals
            </Button>
            <Button
              variant="outline"
              className={`${outlineButtonClasses} font-medium`}
              onClick={() => goToPage("property-management")}
            >
              Partner With Us
            </Button>
          </div>
        </div>

        <GlassCard
          lightMode={lightMode}
          className="w-full max-w-[760px] p-8 !bg-white/[0.012] !backdrop-blur-[12px] before:!opacity-36 after:!opacity-42 lg:justify-self-end lg:min-h-[356px]"
        >
          <div className="space-y-7">
            <div className={`text-[1.05rem] ${mutedText}`}>Philadelphia Portfolio</div>
            <div className="text-5xl font-semibold tracking-tight md:text-[4.4rem]">100+ Units</div>
            <div className={`text-lg ${mutedText}`}>Managed across Philly & surrounding areas</div>
            <div className="mt-2 grid grid-cols-2 gap-5">
              <GlassCard
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
        lightMode={lightMode}
        className="p-7 !bg-white/[0.006] !backdrop-blur-[16px] before:!opacity-45 after:!opacity-35 md:p-8"
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
                key={platform.name}
                className={`${pillClasses} flex min-h-[72px] items-center gap-3 text-left text-sm md:text-base`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
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
          <GlassCard lightMode={lightMode} key={service.title} className="p-6">
            <service.icon className="mb-4 h-6 w-6 text-[#d6b06a]" />
            <h3 className="text-xl font-semibold">{service.title}</h3>
            <p className={`mt-2 ${mutedText}`}>{service.desc}</p>
            <button onClick={() => goToPage(service.page)} className="mt-4 text-sm text-[#d6b06a]">
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
  );
}
