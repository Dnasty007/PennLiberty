import { useState } from "react";
import emailjs from "@emailjs/browser";
import {
  Camera,
  CalendarClock,
  ClipboardList,
  FileText,
  Paintbrush,
  Receipt,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { SectionDivider } from "@/components/owners/SectionDivider";

const EMAILJS_SERVICE_ID = "Owner_Email_Website";
const EMAILJS_TEMPLATE_ID = "template_mol56qf";
const EMAILJS_PUBLIC_KEY = "ykKMeoPCgTNLT5di1";

const deliverables = [
  {
    icon: ClipboardList,
    title: "Full Property Checklist",
    body: "A room-by-room walkthrough documenting the current condition of every space — kitchens and baths to basement and exterior.",
  },
  {
    icon: Camera,
    title: "Photo Documentation",
    body: "The entire property photographed during the visit, so you see what we see. Walls, paint, appliances, fixtures, flooring — timestamped.",
  },
  {
    icon: Wrench,
    title: "Maintenance Findings",
    body: "Repair and maintenance issues flagged before they become larger, more expensive problems. We catch the small things while they're small.",
  },
  {
    icon: Receipt,
    title: "Repair Cost Estimates",
    body: "Each flagged item comes with a transparent estimate, so you have real numbers in hand when deciding what to approve.",
  },
  {
    icon: Paintbrush,
    title: "Condition & Paint Notes",
    body: "Notes on paint, finishes, and overall presentation — useful for planning turnovers, refreshes, and capital improvements.",
  },
  {
    icon: FileText,
    title: "Owner-Ready Report",
    body: "Everything compiled into one clean, organized document delivered directly to you. No piecing it together from texts and emails.",
  },
] as const;

const propertyTypes = ["Unit — $55 per visit", "House — $75 per visit"] as const;
const cadenceOptions = ["Every 3 months", "Every 6 months"] as const;

type OwnersInspectionsProps = {
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
};

export function OwnersInspections({ lightMode, mutedText, subtleText }: OwnersInspectionsProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [property, setProperty] = useState("");
  const [propertyType, setPropertyType] = useState<string>(propertyTypes[0]);
  const [cadence, setCadence] = useState<string>(cadenceOptions[0]);
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const nameEmpty = name.trim().length === 0;
  const emailEmpty = email.trim().length === 0;
  const phoneEmpty = phone.trim().length === 0;
  const propertyEmpty = property.trim().length === 0;
  const isValid = !nameEmpty && !emailEmpty && !phoneEmpty && !propertyEmpty;

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
          title: "Inspection Program Enrollment",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: property.trim(),
          message: `Inspection Program opt-in — ${propertyType}; cadence: ${cadence}.`,
          time: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
        },
        EMAILJS_PUBLIC_KEY,
      );
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setProperty("");
      setPropertyType(propertyTypes[0]);
      setCadence(cadenceOptions[0]);
      setAttempted(false);
    } catch {
      setStatus("error");
    }
  };

  /* ── Styles (mirrors OwnersCTA) ─────────────────────────────────────────── */
  const eyebrow = lightMode ? "text-[#926d28]" : "text-[#dcb672]/92";
  const heading = lightMode ? "text-black" : "text-white";
  const headingSub = lightMode ? "text-black/[0.82]" : "text-white/[0.88]";
  const cardShell = lightMode
    ? "border-black/[0.09] bg-white/[0.42]"
    : "border-white/[0.09] bg-[rgba(255,255,255,0.025)]";
  const priceShell = lightMode
    ? "border-[#c49a42]/50 bg-[#d6b06a]/[0.14]"
    : "border-[#d6b06a]/40 bg-[#d6b06a]/[0.09]";
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
  const selectLabel = lightMode ? "text-black/62" : "text-white/60";
  const footInk = subtleText;
  const glassExtras = lightMode
    ? "ring-1 ring-black/[0.04]"
    : `${listingsRailChromeClass} ring-1 ring-white/[0.06]`;

  const fieldLabel = (label: string) => (
    <span className="flex items-center gap-1 text-[12px] font-medium text-red-500">
      <span>*</span> {label} is required
    </span>
  );

  return (
    <section id="owners-inspections" className="scroll-mt-24 lg:scroll-mt-36">
      <SectionDivider lightMode={lightMode} label="Property Inspection Program" number="03" />

      <div className="mt-9">
        {/* Intro */}
        <div className="max-w-2xl">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>
            New for owners · opt-in
          </p>
          <h3 className={`mt-4 text-[clamp(1.75rem,2.6vw,2.25rem)] font-semibold leading-snug tracking-[-0.02em] md:leading-[1.1] ${heading}`}>
            Full clarity on your property&apos;s condition.
            <span className={`mt-3 block font-medium text-[0.88em] md:font-semibold md:text-[0.9em] ${headingSub}`}>
              Delivered by the team that already manages it.
            </span>
          </h3>
          <p className={`mt-6 text-[0.985rem] leading-relaxed md:text-[1.02rem] ${mutedText}`}>
            A photo-documented condition report every three to six months — on a schedule you
            control, without ever having to travel to your property. Every inspection is conducted
            personally by our office: we walk every room, flag maintenance items early, and attach
            transparent repair estimates so you decide with real numbers in hand.
          </p>
        </div>

        {/* Deliverables */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deliverables.map((item) => (
            <div key={item.title} className={`rounded-[20px] border p-4 ${cardShell}`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d6b06a]/12">
                <item.icon className="h-[18px] w-[18px] text-[#d6b06a]" aria-hidden />
              </span>
              <div className={`mt-3 text-[15px] font-semibold ${heading}`}>{item.title}</div>
              <p className={`mt-1.5 text-[13px] leading-relaxed ${mutedText}`}>{item.body}</p>
            </div>
          ))}
        </div>

        {/* Pricing + terms */}
        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr]">
          <div className={`rounded-[20px] border p-5 text-center ${priceShell}`}>
            <div className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${subtleText}`}>Unit inspection</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-[#d6b06a]">$55</div>
            <div className={`mt-1 text-xs ${mutedText}`}>per unit · per visit</div>
          </div>
          <div className={`rounded-[20px] border p-5 text-center ${priceShell}`}>
            <div className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${subtleText}`}>House inspection</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-[#d6b06a]">$75</div>
            <div className={`mt-1 text-xs ${mutedText}`}>per house · per visit</div>
          </div>
          <div className={`flex flex-col justify-center gap-2.5 rounded-[20px] border p-5 ${cardShell}`}>
            <div className={`flex items-start gap-2.5 text-[13px] leading-snug ${mutedText}`}>
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[#d6b06a]" aria-hidden />
              <span>Recurs every 3 or 6 months — your choice at enrollment, adjustable anytime.</span>
            </div>
            <div className={`flex items-start gap-2.5 text-[13px] leading-snug ${mutedText}`}>
              <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-[#d6b06a]" aria-hidden />
              <span>Deducted from your monthly owner statement — no surprise invoices.</span>
            </div>
            <div className={`flex items-start gap-2.5 text-[13px] leading-snug ${mutedText}`}>
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#d6b06a]" aria-hidden />
              <span>Covers the walkthrough and report; approved repairs are quoted separately.</span>
            </div>
          </div>
        </div>

        {/* Opt-in */}
        <div className="mt-8">
          {!formOpen && status !== "success" ? (
            <Button
              type="button"
              onClick={() => setFormOpen(true)}
              className="w-full rounded-full bg-[#d6b06a] py-7 text-[16px] font-semibold tracking-tight text-[#08111f] shadow-[0_14px_32px_rgba(214,176,106,0.3)] transition-transform hover:bg-[#e4be78] active:scale-[0.985] sm:w-auto sm:px-10"
            >
              Opt in to the Inspection Program
            </Button>
          ) : (
            <GlassCard
              variant={lightMode ? "frost" : "chrome"}
              lightMode={lightMode}
              className={`max-w-xl p-6 md:p-7 ${glassExtras}`}
            >
              {status === "success" ? (
                <div className="relative z-10 flex flex-col items-center justify-center gap-4 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d6b06a]/15 text-3xl">
                    ✓
                  </div>
                  <p className="text-[1.25rem] font-semibold text-[#d6b06a]">Message sent!</p>
                  <p className={`max-w-[280px] text-[14px] leading-relaxed ${footInk}`}>
                    You&apos;re on the list — we&apos;ll confirm your enrollment and schedule your
                    first inspection.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("idle");
                      setFormOpen(false);
                    }}
                    className={`mt-2 text-[13px] underline underline-offset-2 ${footInk}`}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="relative z-10 grid gap-[0.7rem]">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>
                    Enroll — takes under a minute
                  </p>

                  <div className="grid gap-1">
                    {attempted && nameEmpty && fieldLabel("Your name")}
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className={attempted && nameEmpty ? inputError : inputBase}
                    />
                  </div>

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

                  <div className="grid gap-1">
                    {attempted && propertyEmpty && fieldLabel("Property address")}
                    <AddressAutocomplete
                      value={property}
                      onChange={setProperty}
                      placeholder="Property address (add multiple if needed)"
                      className={`flex h-10 w-full rounded-md border px-3 text-sm ring-offset-background transition-colors ${attempted && propertyEmpty ? inputError : inputBase}`}
                    />
                  </div>

                  <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
                    <div className="grid gap-1">
                      <span className={`text-[11px] font-medium uppercase tracking-[0.14em] ${selectLabel}`}>Property type</span>
                      <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={selectBase}>
                        {propertyTypes.map((option) => (
                          <option key={option} value={option} className={optionClass}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <span className={`text-[11px] font-medium uppercase tracking-[0.14em] ${selectLabel}`}>Inspection cadence</span>
                      <select value={cadence} onChange={(e) => setCadence(e.target.value)} className={selectBase}>
                        {cadenceOptions.map((option) => (
                          <option key={option} value={option} className={optionClass}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {status === "error" && (
                    <p className="text-[12px] text-red-500">
                      Something went wrong. Please try again or call us directly.
                    </p>
                  )}

                  <Button
                    type="button"
                    onClick={submit}
                    disabled={status === "sending"}
                    className="mt-2 rounded-full bg-[#d6b06a] py-7 text-[16px] font-semibold tracking-tight text-[#08111f] transition-transform hover:bg-[#e4be78] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "sending" ? "Sending…" : "Enroll in inspections"}
                  </Button>

                  <p className={`mt-1 text-[12px] leading-relaxed ${footInk}`}>
                    Goes straight to our office — we confirm your cadence and schedule from there.
                  </p>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </section>
  );
}
