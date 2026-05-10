import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { SectionDivider } from "@/components/owners/SectionDivider";

const interestOptions = [
  "I want help managing",
  "I'm thinking of selling",
  "I'm not sure yet",
] as const;

type InterestOption = (typeof interestOptions)[number];

type OwnersCTAProps = {
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
  /** Set by path cards (“Explore management”, “Talk it through”). Cleared via onConsumeReviewPreset. */
  reviewInterestPreset?: InterestOption | null;
  onConsumeReviewPreset?: () => void;
};

export function OwnersCTA({
  lightMode,
  mutedText,
  subtleText,
  reviewInterestPreset,
  onConsumeReviewPreset,
}: OwnersCTAProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [property, setProperty] = useState("");
  const [interest, setInterest] = useState<string>(interestOptions[0]);

  useEffect(() => {
    if (!reviewInterestPreset) {
      return;
    }
    if (!interestOptions.includes(reviewInterestPreset)) {
      return;
    }

    setInterest(reviewInterestPreset);
    onConsumeReviewPreset?.();
  }, [reviewInterestPreset, onConsumeReviewPreset]);

  const submit = () => {
    const subject = encodeURIComponent("Property Review Request");
    const body = encodeURIComponent(
      [
        `Interest: ${interest}`,
        "",
        `Name: ${name}`,
        `Contact: ${contact}`,
        `Property: ${property}`,
      ].join("\n"),
    );
    window.location.href = `mailto:info@pennlibertyre.com?subject=${subject}&body=${body}`;
  };

  const inputBase = lightMode
    ? "border-black/14 bg-white/72 py-6 text-[15px] text-black placeholder:text-black/42 shadow-inner focus-visible:ring-[#d6b06a]/35"
    : "border-white/[0.13] bg-white/[0.05] py-6 text-[15px] text-white placeholder:text-white/45";

  const selectClasses = lightMode
    ? "h-12 w-full rounded-md border border-black/14 bg-white/72 px-3 text-[15px] text-black shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/35"
    : "h-12 w-full rounded-md border border-white/[0.13] bg-white/[0.05] px-3 text-[15px] text-white placeholder:text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/70";

  const optionClass = lightMode ? "bg-white text-black" : "bg-[#0a1322] text-white";

  const eyebrow = lightMode ? "text-[#926d28]" : "text-[#dcb672]/92";
  const heading = lightMode ? "text-black" : "text-white";
  const headingSub = lightMode ? "text-black/[0.82]" : "text-white/[0.88]";
  const strapline = mutedText;
  const metaRule = lightMode ? "border-black/[0.08]" : "border-white/[0.06]";
  const metaTitle = subtleText;
  const metaBody = lightMode ? "text-black/[0.78]" : "text-white/[0.8]";
  const metaSep = lightMode ? "bg-black/[0.1]" : "bg-white/[0.1]";
  const footInk = subtleText;

  const glassExtras = `${lightMode ? "ring-1 ring-black/[0.04]" : `${listingsRailChromeClass} ring-1 ring-white/[0.06]`}`;

  return (
    <section id="owners-property-review" className="scroll-mt-24 md:scroll-mt-28">
      <SectionDivider lightMode={lightMode} label="Let's start simple" number="03" />
      <div className="mt-9 grid gap-11 lg:grid-cols-[minmax(0,1.06fr)_minmax(280px,0.94fr)] lg:gap-14 lg:items-center">
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>Property desk</p>
          <h3 className={`mt-4 text-[clamp(1.75rem,2.6vw,2.25rem)] font-semibold leading-snug tracking-[-0.02em] md:leading-[1.1] ${heading}`}>
            Tell us about your property.
            <span className={`mt-3 block font-medium text-[0.88em] md:font-semibold md:text-[0.9em] ${headingSub}`}>
              We&apos;ll walk you through the best next step.
            </span>
          </h3>
          <p className={`mt-6 max-w-lg text-[0.985rem] leading-relaxed md:text-[1.02rem] ${strapline}`}>
            No glossy pitch deck — a short pulse check on ownership goals, timelines, condition, and what
            you&apos;ve already explored. Responses route straight to Penn Liberty inbox.
          </p>
          <div className={`mt-10 flex flex-wrap gap-x-7 gap-y-3 border-y py-6 text-[13px] md:text-sm ${metaRule}`}>
            <span className="inline-flex flex-col gap-1">
              <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${metaTitle}`}>Response time</span>
              <span className={metaBody}>Next business morning</span>
            </span>
            <span className={`hidden h-9 w-px shrink-0 self-center md:block ${metaSep}`} aria-hidden />
            <span className="inline-flex flex-col gap-1">
              <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${metaTitle}`}>Channel</span>
              <span className={metaBody}>Secure email compose</span>
            </span>
          </div>
        </div>
        <GlassCard
          variant={lightMode ? "frost" : "chrome"}
          lightMode={lightMode}
          className={`p-6 md:p-7 lg:max-w-full ${glassExtras}`}
        >
          <div className="relative z-10 grid gap-[0.7rem]">
            <Input
              id="owners-property-review-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className={`${inputBase}`}
            />
            <Input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Email or phone"
              className={`${inputBase}`}
            />
            <Input
              value={property}
              onChange={(event) => setProperty(event.target.value)}
              placeholder="Property address (or neighborhood)"
              className={`${inputBase}`}
            />
            <select
              value={interest}
              onChange={(event) => setInterest(event.target.value)}
              className={selectClasses}
            >
              {interestOptions.map((option) => (
                <option key={option} value={option} className={optionClass}>
                  {option}
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={submit}
              className="mt-2 rounded-full bg-[#d6b06a] py-7 text-[16px] font-semibold tracking-tight text-[#08111f] hover:bg-[#e4be78]"
            >
              Start with a property review
            </Button>
            <p className={`mt-4 text-[12px] leading-relaxed ${footInk}`}>
              We never blast your inbox after this—tell us explicitly if you&apos;d prefer text or a call-back in the
              compose window.
            </p>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
