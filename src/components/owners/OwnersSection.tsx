import { useCallback, useState } from "react";
import { ClipboardCheck, Mail, Phone } from "lucide-react";
import { OwnersHero } from "@/components/owners/OwnersHero";
import { OwnersWhyManagement } from "@/components/owners/OwnersWhyManagement";
import { OwnersPaths } from "@/components/owners/OwnersPaths";
import { OwnersCTA } from "@/components/owners/OwnersCTA";
import { OwnersCoverageBand } from "@/components/owners/OwnersCoverageBand";
import { OwnersInspections } from "@/components/owners/OwnersInspections";
import { OwnersOperateBand } from "@/components/owners/OwnersOperateBand";
import { ownersCardBackdropImageClass } from "@/lib/siteImagery";

type OwnersSectionProps = {
  backdropSrc?: string;
  editorialHeroSrc: string;
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
};

const OWNERS_PHONE_TEL = "+12159227900";
const OWNERS_PHONE_DISPLAY = "215-922-7900";
const OWNERS_MAILTO =
  "mailto:info@pennlibertyre.com?subject=" +
  encodeURIComponent("Property owner inquiry") +
  "&body=" +
  encodeURIComponent("Hi Penn Liberty,\n\nI own a property in Philadelphia and would like to talk.\n\nAddress:\nQuestions:\n");

/** Low-friction conversion actions surfaced right under the hero on phones —
 *  the full review form (section 03) is several screens down on mobile. */
function OwnersQuickActionsMobile({ lightMode }: { lightMode: boolean }) {
  const glassRow = lightMode
    ? "border-black/[0.10] bg-white/[0.55] text-black/85 active:bg-white/[0.75]"
    : "border-white/[0.12] bg-white/[0.05] text-white/90 active:bg-white/[0.10]";

  const scrollToReview = () => {
    document
      .getElementById("owners-property-review")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mt-7 space-y-3 md:hidden">
      <button
        type="button"
        onClick={scrollToReview}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d6b06a] py-4 text-[15px] font-semibold text-[#08111f] shadow-[0_14px_32px_rgba(214,176,106,0.3)] transition active:brightness-95"
      >
        <ClipboardCheck className="h-4 w-4" aria-hidden />
        Get a free property review
      </button>
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${OWNERS_PHONE_TEL}`}
          className={`flex items-center justify-center gap-2 rounded-full border py-3.5 text-sm font-semibold backdrop-blur-md transition ${glassRow}`}
        >
          <Phone className="h-4 w-4 text-[#d6b06a]" aria-hidden />
          {OWNERS_PHONE_DISPLAY}
        </a>
        <a
          href={OWNERS_MAILTO}
          className={`flex items-center justify-center gap-2 rounded-full border py-3.5 text-sm font-semibold backdrop-blur-md transition ${glassRow}`}
        >
          <Mail className="h-4 w-4 text-[#d6b06a]" aria-hidden />
          Email us
        </a>
      </div>
    </div>
  );
}

export function OwnersSection({
  backdropSrc,
  editorialHeroSrc,
  lightMode,
  mutedText,
  subtleText,
}: OwnersSectionProps) {
  const [reviewInterestPreset, setReviewInterestPreset] = useState<
    "I want help managing" | "I'm thinking of selling" | "I'm not sure yet" | null
  >(null);

  const consumeReviewPreset = useCallback(() => {
    setReviewInterestPreset(null);
  }, []);

  const presetInterestForCards = (
    preset: "I want help managing" | "I'm thinking of selling" | "I'm not sure yet",
  ) => {
    setReviewInterestPreset(preset);
  };

  const shellBorder = lightMode ? "border-black/[0.10]" : "border-white/[0.09]";
  const shellShadow = lightMode
    ? "shadow-[0_40px_100px_-36px_rgba(12,18,28,0.18)]"
    : "shadow-[0_52px_120px_-32px_rgba(0,0,0,0.62)]";

  const scrim =
    lightMode
      ? "bg-[radial-gradient(760px_480px_at_82%_-8%,rgba(214,176,106,0.2)_0%,transparent_54%),radial-gradient(560px_400px_at_12%_100%,rgba(82,124,196,0.08)_0%,transparent_50%),linear-gradient(180deg,rgba(255,252,246,0.45)_0%,rgba(246,242,236,0.55)_74%,rgba(235,229,219,0.62)_100%)]"
      : "bg-[radial-gradient(820px_500px_at_82%_-8%,rgba(214,176,106,0.16)_0%,transparent_55%),radial-gradient(640px_420px_at_12%_100%,rgba(82,124,196,0.11)_0%,transparent_50%),linear-gradient(180deg,rgba(10,21,37,0.48)_0%,rgba(7,13,26,0.88)_76%,rgba(5,11,21,0.94)_100%)]";

  const bodyTrayRule = lightMode ? "border-black/[0.08]" : "border-white/[0.07]";
  const bodyTrayBg = lightMode
    ? "bg-gradient-to-b from-white/[0.52] via-white/[0.66] to-white/[0.78]"
    : "bg-gradient-to-b from-[rgba(9,17,31,0.42)] via-[rgba(7,13,26,0.62)] to-[rgba(5,10,21,0.82)]";

  return (
    <section
      className={`relative isolate mx-auto max-w-[1180px] overflow-hidden rounded-[32px] border ${shellBorder} ${shellShadow}`}
      aria-labelledby="owners-hero-title"
    >
      {backdropSrc ? (
        <div
          aria-hidden
          className={`${ownersCardBackdropImageClass} -z-20`}
          style={{ backgroundImage: `url("${backdropSrc}")` }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 -z-20 bg-[#f5f3ee]" />
      )}
      <div aria-hidden className={`absolute inset-0 -z-10 ${scrim}`} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-[#d6b06a]/42 to-transparent sm:inset-x-14"
      />

      <div className="relative z-[2] px-5 pb-9 pt-9 sm:px-8 md:px-10 md:pb-16 md:pt-14">
        <OwnersHero lightMode={lightMode} mutedText={mutedText} subtleText={subtleText} />
        <OwnersQuickActionsMobile lightMode={lightMode} />
      </div>

      <div className={`relative z-[2] border-t ${bodyTrayRule} ${bodyTrayBg} backdrop-blur-md`}>
        <div className="mx-auto max-w-5xl space-y-12 px-5 py-10 sm:px-8 md:space-y-28 md:px-11 md:py-22 lg:py-24">
          <OwnersOperateBand lightMode={lightMode} mutedText={mutedText} subtleText={subtleText} />
          <OwnersWhyManagement lightMode={lightMode} mutedText={mutedText} />
          <OwnersPaths
            lightMode={lightMode}
            mutedText={mutedText}
            subtleText={subtleText}
            onPresetPropertyReviewInterest={presetInterestForCards}
          />
          <OwnersCoverageBand editorialHeroSrc={editorialHeroSrc} lightMode={lightMode} mutedText={mutedText} subtleText={subtleText} />
          <OwnersInspections lightMode={lightMode} mutedText={mutedText} subtleText={subtleText} />
          <OwnersCTA
            lightMode={lightMode}
            mutedText={mutedText}
            subtleText={subtleText}
            reviewInterestPreset={reviewInterestPreset}
            onConsumeReviewPreset={consumeReviewPreset}
          />
        </div>
      </div>
    </section>
  );
}
