import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Clock, Mail, MapPinned, MessageSquare, Phone, Send } from "lucide-react";
import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useRentalsHeroPhysicsMode } from "@/hooks/useRentalsHeroPhysicsMode";
import type { PageKey } from "@/lib/data";

import { PENN_EMAIL, PENN_PHONE_DISPLAY, PENN_PHONE_TEL } from "@/lib/brand";
import { sendWebsiteLead } from "@/lib/emailjs";

const PENN_CONTACT_SUBJECT_DEFAULT = "Penn Liberty: website inquiry";

/** Shared with deep links — subject + starter body cue many mail handlers to open Compose, not the inbox listing. */
function penWebsiteMailtoHref(draft: string, name?: string): string {
  const signOff = name?.trim() ? `\n\nThanks,\n${name.trim()}` : "\n\nThanks,\n";
  const body =
    draft.trim().length > 0
      ? `${draft.trim()}${signOff}\n\nSent from pennlibertyre.com/contact`
      : `Hi Penn Liberty,\n\n${signOff}\n`;
  return (
    `mailto:${PENN_EMAIL}?subject=${encodeURIComponent(PENN_CONTACT_SUBJECT_DEFAULT)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

function gmailWebComposeHref(draft: string, name?: string): string {
  const signOff = name?.trim() ? `\n\nThanks,\n${name.trim()}` : "\n\nThanks,\n";
  const body =
    draft.trim().length > 0
      ? `${draft.trim()}${signOff}\n\nSent from pennlibertyre.com/contact`
      : `Hi Penn Liberty,\n\n${signOff}\n`;
  const q = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: PENN_EMAIL,
    su: PENN_CONTACT_SUBJECT_DEFAULT,
    body,
  });
  return `https://mail.google.com/mail/?${q}`;
}

type ContactBootstrap = { draft?: string; focusCompose?: boolean };

/** Set from other pages (e.g. For Owners “Explore selling”). Keys must stay in sync with `OwnersPaths` sell handler. */
const CONTACT_BOOTSTRAP_KEY = "pl-contact-bootstrap";

function readAndConsumeContactBootstrap(): ContactBootstrap | null {
  try {
    const raw = sessionStorage.getItem(CONTACT_BOOTSTRAP_KEY);
    if (!raw) {
      return null;
    }
    sessionStorage.removeItem(CONTACT_BOOTSTRAP_KEY);
    return JSON.parse(raw) as ContactBootstrap;
  } catch {
    return null;
  }
}

type ContactSectionProps = {
  goToPage: (page: PageKey) => void;
  lightMode: boolean;
  mutedText: string;
  outlineButtonClasses: string;
  subtleText: string;
};

export function ContactSection({
  goToPage,
  lightMode,
  mutedText,
  outlineButtonClasses,
  subtleText,
}: ContactSectionProps) {
  const [noteDraft, setNoteDraft] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const { isMobile } = useRentalsHeroPhysicsMode();

  const sendMessage = async () => {
    if (!noteDraft.trim() || !contactName.trim() || !contactEmail.trim()) return;
    setSendStatus("sending");
    setSendError(null);
    try {
      await sendWebsiteLead({
        title: "Contact Page",
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim() || "N/A",
        address: "N/A",
        message: noteDraft.trim(),
        time: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      });
      setSendStatus("success");
      setNoteDraft("");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
    } catch (err) {
      setSendStatus("error");
      setSendError(
        err instanceof Error && err.message
          ? err.message
          : `Something went wrong. Please call us at ${PENN_PHONE_DISPLAY}.`,
      );
    }
  };

  useEffect(() => {
    const data = readAndConsumeContactBootstrap();
    if (!data) {
      return;
    }

    if (data.draft) {
      setNoteDraft(data.draft);
    }

    if (data.focusCompose) {
      window.setTimeout(() => {
        const ta = document.getElementById("contact-note-draft");
        ta?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => (ta as HTMLTextAreaElement)?.focus({ preventScroll: true }), 120);
      }, 260);
    }
  }, []);

  const mailtoHrefQuick = useMemo(
    () => penWebsiteMailtoHref(noteDraft, contactName),
    [noteDraft, contactName],
  );
  const gmailComposeHrefMemo = useMemo(
    () => gmailWebComposeHref(noteDraft, contactName),
    [noteDraft, contactName],
  );

  function chromeRow({ subtitle, title, children }: { subtitle?: string; title: string; children: ReactNode }) {
    return (
      <div className={`border-b pb-6 last:border-b-0 last:pb-0 ${lightMode ? "border-black/[0.08]" : "border-white/[0.09]"}`}>
        {subtitle ? <p className={`mb-3 text-[10px] font-bold uppercase tracking-[0.24em] ${subtleText}`}>{subtitle}</p> : null}
        <div className={`text-lg font-semibold tracking-tight ${lightMode ? "text-black" : "text-white"}`}>{title}</div>
        <div className="mt-3">{children}</div>
      </div>
    );
  }

  const textareaBase =
    lightMode
      ? "rounded-[22px] border border-black/12 bg-white/72 px-4 py-3.5 text-[15px] text-black placeholder:text-black/42 shadow-inner transition outline-none focus:border-[#d6b06a]/55 focus-visible:ring-2 focus-visible:ring-[#d6b06a]/25"
      : "rounded-[22px] border border-white/16 bg-white/[0.06] px-4 py-3.5 text-[15px] text-white placeholder:text-white/40 shadow-inner transition outline-none focus:border-[#d6b06a]/45 focus-visible:ring-2 focus-visible:ring-[#d6b06a]/25";

  return (
    <section className="space-y-6 md:space-y-14">
      {isMobile ? (
        <div>
          <h1 className={`font-semibold leading-[1.04] tracking-[-0.6px] text-[1.95rem] ${lightMode ? "text-black" : "text-white"}`}>
            Reach the desk.
          </h1>
          <p className={`mt-2 text-[0.95rem] leading-snug ${mutedText}`}>
            Listings, leasing, and property management — we&apos;ll steer you right.
          </p>

          {/* Instant actions — same row treatment as the rental contact sheet */}
          <div className="mt-5 space-y-3">
            <a
              href={`tel:${PENN_PHONE_TEL}`}
              className="flex w-full items-center gap-3.5 rounded-[18px] border border-[#d6b06a]/30 bg-[#d6b06a]/10 px-4 py-3.5 transition active:bg-[#d6b06a]/20"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d6b06a]/20">
                <Phone className="h-4 w-4 text-[#d6b06a]" />
              </span>
              <span>
                <span className={`block text-sm font-semibold ${lightMode ? "text-black/90" : "text-white"}`}>Call Penn Liberty</span>
                <span className="block text-xs text-[#d6b06a]">{PENN_PHONE_DISPLAY}</span>
              </span>
            </a>
            <a
              href={mailtoHrefQuick}
              className={`flex w-full items-center gap-3.5 rounded-[18px] border px-4 py-3.5 transition ${
                lightMode
                  ? "border-black/[0.08] bg-black/[0.03] active:bg-black/[0.06]"
                  : "border-white/[0.09] bg-white/[0.04] active:bg-white/[0.08]"
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${lightMode ? "bg-black/[0.06]" : "bg-white/[0.07]"}`}>
                <Mail className={`h-4 w-4 ${lightMode ? "text-black/55" : "text-white/55"}`} />
              </span>
              <span>
                <span className={`block text-sm font-semibold ${lightMode ? "text-black/90" : "text-white"}`}>Email the desk</span>
                <span className={`block text-xs ${lightMode ? "text-black/55" : "text-white/50"}`}>Opens a prefilled draft</span>
              </span>
            </a>
          </div>
        </div>
      ) : (
      <div className="max-w-4xl">
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
            lightMode
              ? "border-black/12 bg-white/85 text-black/80 backdrop-blur-xl"
              : "border-white/15 bg-white/[0.012] text-white/82 backdrop-blur-xl"
          }`}
        >
          <MessageSquare className="h-4 w-4 shrink-0 text-[#d6b06a]" aria-hidden />
          <span>Talk with Penn Liberty</span>
        </div>

        <div className={`text-xs font-semibold uppercase tracking-[0.22em] ${subtleText}`}>Contact</div>

        <h1
          className={`mt-3 font-semibold leading-[0.94] tracking-[-1.2px] text-[2.35rem] sm:text-[3rem] md:text-[3.45rem] lg:text-[4rem] ${lightMode ? "text-black" : "text-white"}`}
        >
          Reach the desk. Fast paths, same team.
        </h1>

        <p className={`mt-5 max-w-2xl text-[1.05rem] leading-snug md:text-[1.2rem] ${mutedText}`}>
          Prefer a voice, an email thread, or a quick note routed through your own mail client. We operate across
          listings, leasing, and property management in Philadelphia. We&apos;ll steer you right.
        </p>
      </div>
      )}

      <div className="grid gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <GlassCard
          variant={lightMode ? "frost" : "chrome"}
          lightMode={lightMode}
          className={`overflow-visible px-5 py-6 md:px-7 md:py-8 ${lightMode ? "ring-1 ring-black/[0.04]" : `${listingsRailChromeClass} ring-1 ring-white/[0.06]`}`}
        >
          <div className="mb-6 md:mb-8">
            <div className={`h-px w-12 rounded-full md:w-14 ${lightMode ? "bg-[#d6b06a]/55" : "bg-[#d6b06a]/65"}`} aria-hidden />
            <p className={`mt-4 text-[10px] font-bold uppercase tracking-[0.28em] ${subtleText}`}>Direct lines</p>
            <h2 className={`mt-3 text-xl font-semibold tracking-tight md:text-[1.35rem] ${lightMode ? "text-black" : "text-white"}`}>
              Skip the voicemail maze
            </h2>
          </div>

          <div className="space-y-6">
            {chromeRow({
              subtitle: "Call",
              title: PENN_PHONE_DISPLAY,
              children: (
                <a
                  href={`tel:${PENN_PHONE_TEL}`}
                  className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-pl-gold px-6 py-4 text-sm font-semibold text-pl-navy shadow-cta transition hover:bg-pl-gold-hover sm:w-auto md:justify-start md:rounded-[22px] md:py-5"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  Call {PENN_PHONE_DISPLAY}
                </a>
              ),
            })}
            {chromeRow({
              subtitle: "Email",
              title: PENN_EMAIL,
              children: (
                <div className="flex max-w-md flex-col gap-3">
                  <a
                    href={mailtoHrefQuick}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold transition sm:w-auto md:justify-start md:rounded-[22px] md:py-5 ${
                      lightMode
                        ? "border border-[#d6b06a]/45 bg-[rgba(214,176,106,0.12)] text-[#08111f] hover:bg-[rgba(214,176,106,0.2)]"
                        : "border border-[#d6b06a]/35 bg-[#d6b06a]/10 text-[#f4dfb4] hover:bg-[#d6b06a]/14"
                    }`}
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                    Open compose in mail app
                  </a>
                  <a
                    href={gmailComposeHrefMemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[13px] font-medium underline decoration-[0.06em] underline-offset-[3px] ${lightMode ? "text-black/72 hover:text-black" : "text-white/[0.68] hover:text-white"}`}
                  >
                    Use Gmail in the browser instead (opens compose in a new tab)
                  </a>
                  <p className={`hidden text-[12px] leading-relaxed md:block ${mutedText}`}>
                    Bare mailto links can land on Gmail’s inbox depending on Chrome settings. We pass subject and a
                    starter message so handlers open a draft when they can.
                  </p>
                </div>
              ),
            })}
            {chromeRow({
              subtitle: "Coverage",
              title: "Philadelphia metro · by appointment",
              children: (
                <div className={`flex items-start gap-3 text-sm leading-relaxed md:text-[0.9375rem] ${mutedText}`}>
                  <MapPinned className="mt-1 h-[18px] w-[18px] shrink-0 text-[#d6b06a]" aria-hidden />
                  <span>
                    Field visits and showings across the neighborhoods we lease and sell. We&apos;ll match you with the
                    right licensee.
                  </span>
                </div>
              ),
            })}
            {chromeRow({
              subtitle: "Hours",
              title: "Weekdays, responsive weekends",
              children: (
                <div className={`flex items-start gap-3 text-sm leading-relaxed md:text-[0.9375rem] ${mutedText}`}>
                  <Clock className="mt-1 h-[18px] w-[18px] shrink-0 text-[#d6b06a]" aria-hidden />
                  <span>
                    Office hours mirror active deals and tours; if we&apos;re tied up at a lease signing, reply times
                    stay within one business day.
                  </span>
                </div>
              ),
            })}
          </div>
        </GlassCard>

        <GlassCard variant={lightMode ? "frost" : "soft"} lightMode={lightMode} className="p-6 md:p-8 lg:p-9">
          {sendStatus === "success" ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d6b06a]/15 text-3xl">✓</div>
              <p className="text-[1.25rem] font-semibold text-[#d6b06a]">Message sent!</p>
              <p className={`max-w-[260px] text-[14px] leading-relaxed ${subtleText}`}>
                We received your note and will be in touch shortly.
              </p>
              <button type="button" onClick={() => setSendStatus("idle")} className={`mt-2 text-[13px] underline underline-offset-2 ${subtleText}`}>
                Send another message
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 md:mb-6">
                <div className={`h-px w-12 rounded-full md:w-14 ${lightMode ? "bg-[#d6b06a]/55" : "bg-[#d6b06a]/65"}`} aria-hidden />
                <p className={`mt-4 text-[10px] font-bold uppercase tracking-[0.28em] ${subtleText}`}>Send a message</p>
                <h2 className={`mt-3 text-xl font-semibold tracking-tight md:text-[1.35rem] ${lightMode ? "text-black" : "text-white"}`}>
                  Drop us a note
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] ${subtleText}`}>
                      Name *
                    </span>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      autoComplete="name"
                      placeholder="Your name"
                      className={`w-full ${textareaBase}`}
                    />
                  </label>
                  <label className="block">
                    <span className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] ${subtleText}`}>
                      Email *
                    </span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="you@email.com"
                      className={`w-full ${textareaBase}`}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] ${subtleText}`}>
                    Phone <span className="normal-case tracking-normal opacity-70">(optional)</span>
                  </span>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="215-555-0100"
                    className={`w-full ${textareaBase}`}
                  />
                </label>
                <label className="block">
                  <span className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] ${subtleText}`}>
                    Message *
                  </span>
                  <textarea
                    id="contact-note-draft"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={5}
                    placeholder="Example: I'm underwriting a duplex near Temple. Can someone walk comps and leasing expectations this week?"
                    className={`w-full resize-y ${textareaBase}`}
                  />
                </label>

                {sendStatus === "error" && (
                  <p className="text-[12px] leading-relaxed text-red-500">
                    {sendError ?? (
                      <>
                        Something went wrong. Please{" "}
                        <a href={`tel:${PENN_PHONE_TEL}`} className="font-semibold underline">
                          call us at {PENN_PHONE_DISPLAY}
                        </a>
                        .
                      </>
                    )}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={sendMessage}
                  disabled={
                    sendStatus === "sending" ||
                    !noteDraft.trim() ||
                    !contactName.trim() ||
                    !contactEmail.trim()
                  }
                  className="rounded-full bg-pl-gold py-6 text-[15px] font-semibold text-pl-navy shadow-cta hover:bg-pl-gold-hover disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                >
                  <span className="inline-flex items-center gap-2">
                    <Send className="h-4 w-4" aria-hidden />
                    {sendStatus === "sending" ? "Sending…" : "Send Message"}
                  </span>
                </Button>
              </div>
            </>
          )}
        </GlassCard>
      </div>

      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`overflow-visible px-5 py-5 md:flex md:items-center md:justify-between md:gap-8 md:p-8 ${lightMode ? "" : listingsRailChromeClass}`}
      >
        <div className="max-w-2xl">
          <p className={`text-[11px] font-bold uppercase tracking-[0.26em] ${subtleText}`}>While you&apos;re here</p>
          <p className={`mt-3 text-[15px] font-semibold leading-snug md:text-lg ${lightMode ? "text-black" : "text-white"}`}>
            Browsing listings or onboarding an owner portfolio?
          </p>
          <p className={`mt-2 text-sm ${mutedText}`}>Jump back into the workflows that explain how we operate day to day.</p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0 md:shrink-0">
          <Button variant="outline" type="button" className={`rounded-full px-8 py-6 ${outlineButtonClasses}`} onClick={() => goToPage("listings")}>
            Listings map
          </Button>
          <Button variant="outline" type="button" className={`rounded-full px-8 py-6 ${outlineButtonClasses}`} onClick={() => goToPage("team")}>
            Meet the team
          </Button>
        </div>
      </GlassCard>
    </section>
  );
}
