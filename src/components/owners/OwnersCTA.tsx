import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { SectionDivider } from "@/components/owners/SectionDivider";

const EMAILJS_SERVICE_ID  = "Owner_Email_Website";
const EMAILJS_TEMPLATE_ID = "template_mol56qf";
const EMAILJS_PUBLIC_KEY  = "ykKMeoPCgTNLT5di1";

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
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [property, setProperty] = useState("");
  const [interest, setInterest] = useState<string>(interestOptions[0]);
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => {
    if (!reviewInterestPreset) return;
    if (!interestOptions.includes(reviewInterestPreset)) return;
    setInterest(reviewInterestPreset);
    onConsumeReviewPreset?.();
  }, [reviewInterestPreset, onConsumeReviewPreset]);

  const nameEmpty     = name.trim().length === 0;
  const emailEmpty    = email.trim().length === 0;
  const phoneEmpty    = phone.trim().length === 0;
  const propertyEmpty = property.trim().length === 0;
  const isValid       = !nameEmpty && !emailEmpty && !phoneEmpty && !propertyEmpty;

  const submit = async () => {
    if (!isValid) {
      setAttempted(true);
      return;
    }

    setStatus("sending");

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          title:   "Property Review Request",
          name:    name.trim(),
          email:   email.trim(),
          phone:   phone.trim(),
          address: property.trim(),
          message: interest,
          time:    new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
        },
        EMAILJS_PUBLIC_KEY,
      );

      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setProperty("");
      setInterest(interestOptions[0]);
      setAttempted(false);
    } catch {
      setStatus("error");
    }
  };

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const inputBase = lightMode
    ? "border-black/15 bg-white py-6 text-[15px] text-black placeholder:text-black/75 focus-visible:ring-[#d6b06a]/40"
    : "border-white/[0.13] bg-white/[0.05] py-6 text-[15px] text-white placeholder:text-white/45";

  const inputError = lightMode
    ? "border-red-500/70 bg-white py-6 text-[15px] text-black placeholder:text-black/75 focus-visible:ring-red-400/40"
    : "border-red-400/60 bg-white/[0.05] py-6 text-[15px] text-white placeholder:text-white/45";

  const selectBase = lightMode
    ? "h-12 w-full rounded-md border border-black/15 bg-white px-3 text-[15px] text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/40"
    : "h-12 w-full rounded-md border border-white/[0.13] bg-white/[0.05] px-3 text-[15px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/70";

  const optionClass = lightMode ? "bg-white text-black" : "bg-[#0a1322] text-white";
  const eyebrow     = lightMode ? "text-[#926d28]" : "text-[#dcb672]/92";
  const heading     = lightMode ? "text-black" : "text-white";
  const headingSub  = lightMode ? "text-black/[0.82]" : "text-white/[0.88]";
  const metaRule    = lightMode ? "border-black/[0.08]" : "border-white/[0.06]";
  const metaTitle   = subtleText;
  const metaBody    = lightMode ? "text-black/[0.78]" : "text-white/[0.8]";
  const metaSep     = lightMode ? "bg-black/[0.1]" : "bg-white/[0.1]";
  const footInk     = subtleText;
  const glassExtras = lightMode
    ? "ring-1 ring-black/[0.04]"
    : `${listingsRailChromeClass} ring-1 ring-white/[0.06]`;

  const fieldLabel = (label: string) => (
    <span className="flex items-center gap-1 text-[12px] font-medium text-red-500">
      <span>*</span> {label} is required
    </span>
  );

  return (
    <section id="owners-property-review" className="scroll-mt-24 md:scroll-mt-28">
      <SectionDivider lightMode={lightMode} label="Let's start simple" number="03" />
      <div className="mt-9 grid gap-11 lg:grid-cols-[minmax(0,1.06fr)_minmax(280px,0.94fr)] lg:gap-14 lg:items-center">

        {/* Left — copy */}
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>Property desk</p>
          <h3 className={`mt-4 text-[clamp(1.75rem,2.6vw,2.25rem)] font-semibold leading-snug tracking-[-0.02em] md:leading-[1.1] ${heading}`}>
            Tell us about your property.
            <span className={`mt-3 block font-medium text-[0.88em] md:font-semibold md:text-[0.9em] ${headingSub}`}>
              We&apos;ll walk you through the best next step.
            </span>
          </h3>
          <p className={`mt-6 max-w-lg text-[0.985rem] leading-relaxed md:text-[1.02rem] ${mutedText}`}>
            No glossy pitch deck. A short pulse check on ownership goals, timelines, condition, and what
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
              <span className={metaBody}>Direct to inbox</span>
            </span>
          </div>
        </div>

        {/* Right — form */}
        <GlassCard
          variant={lightMode ? "frost" : "chrome"}
          lightMode={lightMode}
          className={`p-6 md:p-7 lg:max-w-full ${glassExtras}`}
        >
          {status === "success" ? (
            /* ── Success state ── */
            <div className="relative z-10 flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d6b06a]/15 text-3xl">
                ✓
              </div>
              <p className="text-[1.25rem] font-semibold text-[#d6b06a]">Message sent!</p>
              <p className={`max-w-[260px] text-[14px] leading-relaxed ${footInk}`}>
                We received your details and will be in touch next business morning.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className={`mt-2 text-[13px] underline underline-offset-2 ${footInk}`}
              >
                Submit another request
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <div className="relative z-10 grid gap-[0.7rem]">

              {/* Name */}
              <div className="grid gap-1">
                {attempted && nameEmpty && fieldLabel("Your name")}
                <Input
                  id="owners-property-review-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={attempted && nameEmpty ? inputError : inputBase}
                />
              </div>

              {/* Email */}
              <div className="grid gap-1">
                {attempted && emailEmpty && fieldLabel("Email address")}
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  type="email"
                  className={attempted && emailEmpty ? inputError : inputBase}
                />
              </div>

              {/* Phone */}
              <div className="grid gap-1">
                {attempted && phoneEmpty && fieldLabel("Phone number")}
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  type="tel"
                  className={attempted && phoneEmpty ? inputError : inputBase}
                />
              </div>

              {/* Property — Google Places autocomplete */}
              <div className="grid gap-1">
                {attempted && propertyEmpty && fieldLabel("Property address")}
                <AddressAutocomplete
                  value={property}
                  onChange={setProperty}
                  placeholder="Property address (or neighborhood)"
                  className={`flex h-10 w-full rounded-md border px-3 text-sm ring-offset-background transition-colors ${attempted && propertyEmpty ? inputError : inputBase}`}
                />
              </div>

              {/* Interest */}
              <select
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className={selectBase}
              >
                {interestOptions.map((option) => (
                  <option key={option} value={option} className={optionClass}>
                    {option}
                  </option>
                ))}
              </select>

              {/* Send error */}
              {status === "error" && (
                <p className="text-[12px] text-red-500">
                  Something went wrong. Please try again or call us directly.
                </p>
              )}

              {/* Submit */}
              <Button
                type="button"
                onClick={submit}
                disabled={status === "sending"}
                className="mt-2 rounded-full bg-[#d6b06a] py-7 text-[16px] font-semibold tracking-tight text-[#08111f] hover:bg-[#e4be78] active:scale-[0.985] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "sending" ? "Sending…" : "Start with a property review"}
              </Button>

              <p className={`mt-1 text-[12px] leading-relaxed ${footInk}`}>
                We never share your information. This goes straight to Penn Liberty.
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </section>
  );
}
