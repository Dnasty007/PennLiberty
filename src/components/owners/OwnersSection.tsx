import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { OwnersHero } from "@/components/owners/OwnersHero";
import { OwnersWhyManagement } from "@/components/owners/OwnersWhyManagement";
import { OwnersPaths } from "@/components/owners/OwnersPaths";
import { OwnersCTA } from "@/components/owners/OwnersCTA";
import { OwnersCoverageBand } from "@/components/owners/OwnersCoverageBand";
import { OwnersOperateBand } from "@/components/owners/OwnersOperateBand";
import type { PageKey } from "@/lib/data";

type OwnersSectionProps = {
  backdropSrc: string;
  editorialHeroSrc: string;
  assistantTrigger?: ReactNode;
  goToPage?: (page: PageKey) => void;
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
};

export function OwnersSection({
  backdropSrc,
  editorialHeroSrc,
  assistantTrigger,
  goToPage,
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
      ? "bg-[radial-gradient(760px_480px_at_82%_-8%,rgba(214,176,106,0.24)_0%,transparent_54%),radial-gradient(560px_400px_at_12%_100%,rgba(82,124,196,0.09)_0%,transparent_50%),linear-gradient(180deg,rgba(255,252,246,0.82)_0%,rgba(246,242,236,0.9)_74%,rgba(235,229,219,0.95)_100%)]"
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
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url("${backdropSrc}")`, transform: "scale(1.04)" }}
      />
      <div aria-hidden className={`absolute inset-0 -z-10 ${scrim}`} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-[#d6b06a]/42 to-transparent sm:inset-x-14"
      />

      <div className="relative z-[2] px-5 pb-14 pt-12 sm:px-8 md:px-10 md:pb-16 md:pt-14">
        <OwnersHero lightMode={lightMode} mutedText={mutedText} subtleText={subtleText} trailing={assistantTrigger} />
      </div>

      <div className={`relative z-[2] border-t ${bodyTrayRule} ${bodyTrayBg} backdrop-blur-md`}>
        <div className="mx-auto max-w-5xl space-y-20 px-5 py-16 sm:px-8 md:space-y-28 md:px-11 md:py-22 lg:py-24">
          <OwnersOperateBand lightMode={lightMode} mutedText={mutedText} subtleText={subtleText} />
          <OwnersWhyManagement lightMode={lightMode} mutedText={mutedText} />
          <OwnersPaths
            lightMode={lightMode}
            mutedText={mutedText}
            subtleText={subtleText}
            goToPage={goToPage}
            onPresetPropertyReviewInterest={presetInterestForCards}
          />
          <OwnersCoverageBand editorialHeroSrc={editorialHeroSrc} lightMode={lightMode} mutedText={mutedText} subtleText={subtleText} />
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
