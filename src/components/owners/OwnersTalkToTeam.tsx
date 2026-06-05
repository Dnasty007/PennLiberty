import { useState } from "react";
import emailjs from "@emailjs/browser";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { SectionDivider } from "@/components/owners/SectionDivider";

const EMAILJS_SERVICE_ID = "Owner_Email_Website";
const EMAILJS_TEMPLATE_ID = "template_mol56qf";
const EMAILJS_PUBLIC_KEY = "ykKMeoPCgTNLT5di1";

const PENN_PHONE_DISPLAY = "215-922-7900";
const PENN_PHONE_TEL = "+12159227900";

type OwnersTalkToTeamProps = {
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
};

export function OwnersTalkToTeam({ lightMode, mutedText, subtleText }: OwnersTalkToTeamProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const nameEmpty = name.trim().length === 0;
  const emailEmpty = email.trim().length === 0;
  const phoneEmpty = phone.trim().length === 0;
  const isValid = !nameEmpty && !emailEmpty && !phoneEmpty;

  const inputBase = lightMode
    ? "border-black/15 bg-white py-6 text-[15px] text-black placeholder:text-black/75 focus-visible:ring-[#d6b06a]/40"
    : "border-white/[0.13] bg-white/[0.05] py-6 text-[15px] text-white placeholder:text-white/45";

  const inputError = lightMode
    ? "border-red-500/70 bg-white py-6 text-[15px] text-black placeholder:text-black/75 focus-visible:ring-red-400/40"
    : "border-red-400/60 bg-white/[0.05] py-6 text-[15px] text-white placeholder:text-white/45";

  const textareaBase = lightMode
    ? "min-h-[7rem] w-full resize-y rounded-md border border-black/15 bg-white px-3 py-3 text-[15px] text-black placeholder:text-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/40"
    : "min-h-[7rem] w-full resize-y rounded-md border border-white/[0.13] bg-white/[0.05] px-3 py-3 text-[15px] text-white placeholder:text-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a]/70";

  const eyebrow = lightMode ? "text-[#926d28]" : "text-[#dcb672]/92";
  const heading = lightMode ? "text-black" : "text-white";
  const headingSub = lightMode ? "text-black/[0.82]" : "text-white/[0.88]";
  const footInk = subtleText;
  const glassExtras = lightMode
    ? "ring-1 ring-black/[0.04]"
    : `${listingsRailChromeClass} ring-1 ring-white/[0.06]`;

  const fieldLabel = (label: string) => (
    <span className="flex items-center gap-1 text-[12px] font-medium text-red-500">
      <span>*</span> {label} is required
    </span>
  );

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
          title: "Talk to Our Team — For Owners",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: "For Owners page",
          message: message.trim() || "General owner inquiry",
          time: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
        },
        EMAILJS_PUBLIC_KEY,
      );

      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setAttempted(false);
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="owners-talk-to-team" className="scroll-mt-24 md:scroll-mt-28">
      <SectionDivider lightMode={lightMode} label="Talk to our team" />
      <div className="mt-9 grid gap-11 lg:grid-cols-[minmax(0,1.02fr)_minmax(280px,0.98fr)] lg:gap-14 lg:items-center">
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${eyebrow}`}>Owner desk</p>
          <h3 className={`mt-4 text-[clamp(1.65rem,2.4vw,2.1rem)] font-semibold leading-snug tracking-[-0.02em] ${heading}`}>
            Prefer a person over a portal?
            <span className={`mt-3 block font-medium text-[0.9em] ${headingSub}`}>
              Call or send a note — we route it straight to Penn Liberty.
            </span>
          </h3>
          <p className={`mt-6 max-w-lg text-[0.985rem] leading-relaxed md:text-[1.02rem] ${mutedText}`}>
            Questions about management, a building you&apos;re considering, or what happens after you hand us the keys.
            No chatbot — a real team member follows up next business morning.
          </p>
          <a
            href={`tel:${PENN_PHONE_TEL}`}
            className={`mt-8 inline-flex items-center gap-3 rounded-2xl border px-5 py-4 text-[15px] font-semibold transition hover:border-[#d6b06a]/55 ${
              lightMode
                ? "border-black/12 bg-white/70 text-black shadow-[0_12px_32px_rgba(12,18,28,0.08)] hover:bg-white"
                : "border-white/14 bg-white/[0.05] text-white hover:bg-white/[0.08]"
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d6b06a]/15 text-[#d6b06a]">
              <Phone className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${subtleText}`}>Call Penn Liberty</span>
              <span className="tabular-nums tracking-tight">{PENN_PHONE_DISPLAY}</span>
            </span>
          </a>
        </div>

        <GlassCard
          variant={lightMode ? "frost" : "chrome"}
          lightMode={lightMode}
          className={`p-6 md:p-7 ${glassExtras}`}
        >
          {status === "success" ? (
            <div className="relative z-10 flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d6b06a]/15 text-3xl text-[#d6b06a]">
                ✓
              </div>
              <p className="text-[1.25rem] font-semibold text-[#d6b06a]">Message sent!</p>
              <p className={`max-w-[260px] text-[14px] leading-relaxed ${footInk}`}>
                We received your note and will be in touch next business morning.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className={`mt-2 text-[13px] underline underline-offset-2 ${footInk}`}
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="relative z-10 grid gap-[0.7rem]">
              <div className="grid gap-1">
                {attempted && nameEmpty && fieldLabel("Your name")}
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className={attempted && nameEmpty ? inputError : inputBase}
                />
              </div>
              <div className="grid gap-1">
                {attempted && emailEmpty && fieldLabel("Email address")}
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className={attempted && emailEmpty ? inputError : inputBase}
                />
              </div>
              <div className="grid gap-1">
                {attempted && phoneEmpty && fieldLabel("Phone number")}
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  autoComplete="tel"
                  className={attempted && phoneEmpty ? inputError : inputBase}
                />
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What can we help with? (optional)"
                className={textareaBase}
              />
              {status === "error" && (
                <p className="text-[12px] text-red-500">
                  Something went wrong. Please try again or call {PENN_PHONE_DISPLAY}.
                </p>
              )}
              <Button
                type="button"
                onClick={submit}
                disabled={status === "sending"}
                className="mt-2 rounded-full bg-[#d6b06a] py-7 text-[16px] font-semibold tracking-tight text-[#08111f] hover:bg-[#e4be78] active:scale-[0.985] transition-transform disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send message"}
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
