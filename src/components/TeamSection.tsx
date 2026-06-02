import { Building2, LandPlot, ShieldCheck, Users } from "lucide-react";
import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import type { PageKey, TeamPerson } from "@/lib/data";
import { teamPrincipals, teamStaff } from "@/lib/data";

/** Larger full-color head mark — reads reliably on dark overlays (bundled `/public/branding`). */
const TEAM_WATERMARK_SRC = "/branding/liberty-head.png";

type TeamSectionProps = {
  goToPage: (page: PageKey) => void;
  lightMode: boolean;
  mutedText: string;
  outlineButtonClasses: string;
  subtleText: string;
};

function monogramForPerson(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const mid = parts[1]?.replace(/\./g, "").trim();

  /* e.g. "Ramon L. Caceres" → initials from first name + middle */
  if (parts.length >= 3 && mid && mid.length <= 2 && /^[A-Za-z]+$/.test(mid)) {
    return `${parts[0]!.charAt(0)}${mid.charAt(0)}`.toUpperCase();
  }
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type Tier = "principal" | "staff";

function TeamPortraitCard({
  lightMode,
  mutedText,
  person,
  tier,
}: {
  lightMode: boolean;
  mutedText: string;
  person: TeamPerson;
  tier: Tier;
}) {
  const monogram = monogramForPerson(person.name);

  const isPrincipal = tier === "principal";
  const photo = person.photo?.trim();

  const cornerMonogramBadge = (
    <div
      aria-hidden
      className={`absolute right-3 top-3 z-[14] grid h-10 w-10 place-items-center rounded-full border-[1.5px] text-[11px] font-bold tracking-[0.12em] shadow-[0_10px_28px_rgba(0,0,0,0.35)] ring-4 ring-transparent backdrop-blur-md transition motion-safe:group-hover:-translate-y-px motion-safe:group-hover:ring-[#d6b06a]/18 sm:right-4 sm:top-4 sm:h-11 sm:w-11 sm:text-xs ${
        lightMode ? "border-black/15 bg-white/92 text-black/92" : "border-white/[0.18] bg-black/72 text-[#f4dfb4]"
      }`}
    >
      {monogram}
    </div>
  );

  return (
    <article
      className={`group flex min-h-full flex-col overflow-hidden rounded-[20px] border transition-colors duration-300 sm:rounded-[23px] ${
        lightMode
          ? "border-black/[0.08] bg-gradient-to-br from-white/82 to-white/42 shadow-[0_12px_36px_rgba(12,18,28,0.06)] hover:border-[#d6b06a]/38"
          : "border-white/[0.09] bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_14px_48px_rgba(0,0,0,0.24)] hover:border-[#d6b06a]/26"
      }`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden ${
          isPrincipal ? "aspect-[6/5] sm:aspect-[5/4]" : "aspect-[5/4] max-sm:aspect-[8/7]"
        } ${
          lightMode
            ? "bg-gradient-to-br from-black/[0.04] via-[#d6b06a]/[0.07] to-black/[0.02]"
            : "bg-[linear-gradient(145deg,rgba(18,26,38,0.95),rgba(8,14,26,0.88))]"
        }`}
      >
        {cornerMonogramBadge}
        {photo ? (
          <>
            <img
              src={photo}
              alt=""
              decoding="async"
              className={`absolute inset-0 z-[1] h-full w-full object-cover object-[center_28%] transition duration-500 motion-safe:group-hover:scale-[1.03]`}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[46%] bg-gradient-to-t from-black/76 via-black/38 to-transparent"
              aria-hidden
            />
          </>
        ) : (
          <>
            <div className="pointer-events-none absolute inset-0 z-[1] grid place-items-center p-[10%]" aria-hidden>
              <img
                src={TEAM_WATERMARK_SRC}
                alt=""
                decoding="async"
                loading="lazy"
                className={`pointer-events-none max-h-full max-w-[min(100%,320px)] w-auto select-none object-contain drop-shadow-[0_14px_32px_rgba(0,0,0,0.32)] motion-safe:transition motion-safe:duration-500 motion-safe:ease-out sm:max-w-[min(100%,370px)] ${
                  isPrincipal ? "" : "max-w-[min(100%,280px)] sm:max-w-[min(100%,290px)]"
                } ${
                  lightMode
                    ? "opacity-95 saturate-[0.94] hue-rotate-[-6deg] group-hover:opacity-100"
                    : "opacity-[0.72] saturate-[1.08] brightness-[1.07] contrast-[1.03] motion-safe:group-hover:opacity-[0.85]"
                }`}
              />
            </div>
            <div
              className={`pointer-events-none absolute inset-0 z-[2] ${
                lightMode
                  ? "bg-[radial-gradient(ellipse_105%_80%_at_50%_48%,transparent_42%,rgba(255,246,239,0.22)_94%)]"
                  : "bg-[radial-gradient(ellipse_105%_80%_at_50%_48%,transparent_40%,rgba(6,14,26,0.58)_96%)]"
              }`}
              aria-hidden
            />
          </>
        )}

        <div
          className="pointer-events-none absolute left-1/2 top-[50%] z-[6] aspect-square w-[min(148%,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(214,176,106,0.18)_0%,transparent_74%)] opacity-70 blur-[2.35rem] transition duration-700 group-hover:opacity-100 motion-reduce:opacity-55 motion-reduce:group-hover:opacity-70"
          aria-hidden
        />

      </div>
      <div className={`flex flex-1 flex-col ${isPrincipal ? "px-5 pb-6 pt-5 md:px-6" : "px-4 pb-5 pt-4 sm:px-5 sm:pb-5 sm:pt-4"}`}>
        <h3
          className={`font-semibold leading-snug tracking-tight ${isPrincipal ? "text-lg md:text-xl" : "text-[15px] sm:text-[0.95rem] md:text-base"} ${lightMode ? "text-black" : "text-white"}`}
        >
          {person.name}
        </h3>
        <p
          className={`mt-1 font-semibold uppercase leading-snug tracking-[0.14em] text-[#d6b06a] md:tracking-[0.15em] ${isPrincipal ? "text-[12px] md:text-[0.8125rem]" : "text-[10px] sm:text-[11px]"}`}
        >
          {person.role}
        </p>
        <p className={`text-[13px] leading-relaxed md:text-[0.9375rem] ${mutedText} ${isPrincipal ? "mt-3 min-h-[5.75rem]" : "mt-2.5"}`}>{person.bio}</p>
        {person.tagline && (
          <p className={`mt-2 text-[13px] italic leading-relaxed md:text-[0.9375rem] text-[#d6b06a]`}>
            {person.tagline}
          </p>
        )}
      </div>
    </article>
  );
}

const pillars = [
  {
    icon: LandPlot,
    title: "Rooted here",
    body: "We work neighborhoods we know, not flyover markets, with relationships that compound over time.",
  },
  {
    icon: ShieldCheck,
    title: "Execution + care",
    body: "From listings and leasing to portfolio management: clear updates, diligent follow-through.",
  },
  {
    icon: Building2,
    title: "One firm, many hats",
    body: "Owners, renters, sellers, buyers: one disciplined team aligning operations and brokerage.",
  },
] as const;

export function TeamSection({
  goToPage,
  lightMode,
  mutedText,
  outlineButtonClasses,
  subtleText,
}: TeamSectionProps) {
  return (
    <section className="space-y-10 md:space-y-14 lg:space-y-16">
      {/* Editorial masthead — echoes Listings / Home headline rhythm */}
      <div className="max-w-4xl">
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
            lightMode
              ? "border-black/10 bg-white/45 text-black/78 backdrop-blur-xl"
              : "border-white/15 bg-white/[0.012] text-white/82 backdrop-blur-xl"
          }`}
        >
          <Users className="h-4 w-4 shrink-0 text-[#d6b06a]" aria-hidden />
          <span>Philadelphia-based brokerage & management</span>
        </div>

        <div className={`text-xs font-semibold uppercase tracking-[0.22em] ${subtleText}`}>About</div>

        <h1
          className={`mt-3 max-w-[22ch] font-semibold leading-[1.04] tracking-[-1.5px] text-[2.4rem] sm:text-[3rem] md:text-[3.55rem] lg:text-[4.1rem] ${
            lightMode ? "text-black" : "text-white"
          }`}
        >
          People first. Philadelphia anchored.
        </h1>

        <p className={`mt-5 max-w-2xl text-[1.05rem] leading-snug md:text-[1.22rem] ${mutedText}`}>
          Penn Liberty pairs sales, leasing, and property management inside one disciplined practice, so decisions
          move faster and communication stays humane.
        </p>
      </div>

      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`overflow-visible px-5 py-6 md:px-7 md:py-8 ${lightMode ? "ring-1 ring-black/[0.04]" : `ring-1 ring-white/[0.06] ${listingsRailChromeClass}`}`}
      >
        <div className="mb-6 md:mb-8">
          <div className={`h-px w-12 rounded-full md:w-14 ${lightMode ? "bg-[#d6b06a]/55" : "bg-[#d6b06a]/65"}`} aria-hidden />
          <p className={`mt-4 text-[10px] font-bold uppercase tracking-[0.28em] ${subtleText}`}>How we work</p>
          <h2 className={`mt-3 text-xl font-semibold tracking-tight md:text-[1.35rem] ${lightMode ? "text-black" : "text-white"}`}>
            Principles behind the desks
          </h2>
        </div>

        <ul className="grid gap-4 md:grid-cols-3 md:gap-5">
          {pillars.map((item) => {
            const Icon = item.icon;

            return (
              <li
                key={item.title}
                className={`rounded-[22px] border px-5 py-5 md:px-6 md:py-6 ${
                  lightMode
                    ? "border-black/[0.08] bg-white/50 shadow-[0_12px_36px_rgba(12,18,28,0.06)]"
                    : "border-white/[0.08] bg-white/[0.03] shadow-[0_14px_44px_rgba(0,0,0,0.26)]"
                }`}
              >
                <Icon className={`h-9 w-9 ${lightMode ? "text-[#99773d]" : "text-[#e8cc8b]"}`} aria-hidden />
                <h3 className={`mt-4 text-[15px] font-semibold tracking-tight md:text-base ${lightMode ? "text-black" : "text-white"}`}>
                  {item.title}
                </h3>
                <p className={`mt-2 text-sm leading-relaxed md:text-[0.9375rem] ${mutedText}`}>{item.body}</p>
              </li>
            );
          })}
        </ul>
      </GlassCard>

      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`overflow-visible px-5 py-6 md:px-7 md:py-8 ${lightMode ? "ring-1 ring-black/[0.04]" : `ring-1 ring-white/[0.06] ${listingsRailChromeClass}`}`}
      >
        <div className="mb-6 md:mb-8">
          <div className={`h-px w-12 rounded-full md:w-14 ${lightMode ? "bg-[#d6b06a]/55" : "bg-[#d6b06a]/65"}`} aria-hidden />
          <p className={`mt-4 text-[10px] font-bold uppercase tracking-[0.28em] ${subtleText}`}>Leadership</p>
          <h2 id="about-team" className={`mt-3 text-xl font-semibold tracking-tight md:text-[1.35rem] ${lightMode ? "text-black" : "text-white"}`}>
            The Penn Liberty Team
          </h2>
          <p className={`mt-2 max-w-2xl text-sm ${mutedText}`}>
            Founders and operators first. The rest of our licensed agents round out brokerage and leasing at the desk and in the field.
          </p>
        </div>

        <div className="space-y-8 md:space-y-12">
          <div>
            <h3 className={`text-[11px] font-bold uppercase tracking-[0.2em] ${subtleText}`}>Founders · principals</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {teamPrincipals.map((person) => (
                <TeamPortraitCard key={person.name} person={person} tier="principal" lightMode={lightMode} mutedText={mutedText} />
              ))}
            </div>
          </div>

          <div className={`h-px bg-gradient-to-r from-transparent via-[#d6b06a]/22 to-transparent`} aria-hidden />

          <div>
            <h3 className={`text-[11px] font-bold uppercase tracking-[0.2em] ${subtleText}`}>Office · management · brokerage</h3>
            <div className="mt-4 grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {teamStaff.map((person) => (
                <TeamPortraitCard key={person.name} person={person} tier="staff" lightMode={lightMode} mutedText={mutedText} />
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard variant={lightMode ? "frost" : "soft"} lightMode={lightMode} className={`p-6 md:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:p-10`}>
        <div className="max-w-xl lg:pb-1">
          <p className={`text-[11px] font-bold uppercase tracking-[0.26em] ${subtleText}`}>Next step</p>
          <h2 className={`mt-3 text-xl font-semibold tracking-tight md:text-2xl ${lightMode ? "text-black" : "text-white"}`}>Tell us what you&apos;re aiming for.</h2>
          <p className={`mt-3 text-sm leading-relaxed md:text-base ${mutedText}`}>
            A question about a lease, listing, investment, or your building. The fastest path is a direct conversation.
          </p>
        </div>
        <div className="mt-6 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0">
          <Button
            type="button"
            className="rounded-full bg-[#d6b06a] px-8 py-6 text-[15px] font-semibold text-[#08111f] shadow-[0_14px_32px_rgba(214,176,106,0.35)] hover:bg-[#e4be78]"
            onClick={() => goToPage("contact")}
          >
            Contact Penn Liberty
          </Button>
          <Button variant="outline" type="button" className={`rounded-full py-6 text-[15px] ${outlineButtonClasses}`} onClick={() => goToPage("listings")}>
            Browse listings
          </Button>
        </div>
      </GlassCard>
    </section>
  );
}
