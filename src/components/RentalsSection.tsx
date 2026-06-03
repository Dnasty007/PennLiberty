import { ClipboardList, KeyRound, Mail, MapPin } from "lucide-react";
import { GlassCard, listingsRailChromeClass } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import type { PageKey } from "@/lib/data";
import { rentalMapPinOffsets, type Rental } from "@/lib/data";

const PENN_PHONE_TEL = "+12159227900";
const PENN_EMAIL = "info@pennlibertyre.com";

type RentalsSectionProps = {
  /** Navigate to Contact, etc. */
  goToPage?: (page: PageKey) => void;
  lightMode: boolean;
  mutedText: string;
  onOpenRentalDetails?: (id: number) => void;
  outlineButtonClasses?: string;
  rentalsHeroSrc: string;
  rentals: Rental[];
  subtleText: string;
};

function configuredBuildiumApplicationUrl(): string | undefined {
  const raw = import.meta.env.VITE_BUILDIUM_RENTAL_APPLICATION_URL?.trim();
  return raw || undefined;
}

function openRentalApplication(rental: Rental) {
  const listingUrl = rental.applicationUrl?.trim();
  const globalUrl = configuredBuildiumApplicationUrl();
  const url = listingUrl || globalUrl;

  if (url && /^https?:\/\//i.test(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  openRentalInquiry(rental);
}

function openRentalInquiry(rental: Rental) {
  const subject = encodeURIComponent(`Rental inquiry: ${rental.title}`);
  const body = encodeURIComponent(
    [
      "Hi Penn Liberty,",
      "",
      `I'm interested in this rental: ${rental.title}`,
      rental.address,
      `Advertised rent: ${rental.price}`,
      rental.meta,
      "",
      "My move-in timeline:",
      "",
      "Questions:",
    ].join("\n"),
  );

  window.location.href = `mailto:${PENN_EMAIL}?subject=${subject}&body=${body}`;
}

export function RentalsSection({
  goToPage,
  lightMode,
  mutedText,
  onOpenRentalDetails,
  outlineButtonClasses,
  rentalsHeroSrc,
  rentals,
  subtleText,
}: RentalsSectionProps) {
  const hasRentals = rentals.length > 0;

  const mailGeneralLeasing = () => {
    window.location.href =
      `mailto:${PENN_EMAIL}?subject=` + encodeURIComponent("Rental inquiry, current availability");
  };

  return (
    <section className="space-y-8 md:space-y-10 lg:space-y-12">
      <div className="max-w-4xl">
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
            lightMode
              ? "border-black/10 bg-white/45 text-black/78 backdrop-blur-xl"
              : "border-white/15 bg-white/[0.012] text-white/82 backdrop-blur-xl"
          }`}
        >
          <KeyRound className="h-4 w-4 shrink-0 text-[#d6b06a]" aria-hidden />
          <span>Leasing desk · Philadelphia metro</span>
        </div>

        <div className={`text-xs font-semibold uppercase tracking-[0.22em] ${subtleText}`}>Rentals</div>

        <h1
          className={`mt-3 font-semibold leading-[0.94] tracking-[-1.2px] text-[2.35rem] sm:text-[3rem] md:text-[3.45rem] lg:text-[4rem] ${lightMode ? "text-black" : "text-white"}`}
        >
          Live Inventory, curated for touring.
        </h1>

        <p className={`mt-5 max-w-2xl text-[1.05rem] leading-snug md:text-[1.2rem] ${lightMode ? "text-black" : mutedText}`}>
          Browse available units below. Photos, rent, and neighborhood at a glance. Submit an application
          directly from any card.
        </p>
        <p className={`mt-3 text-sm md:text-[0.9375rem] ${subtleText}`}>
          Availability turns over fast, call{" "}
          <a href={`tel:${PENN_PHONE_TEL}`} className="font-medium text-[#d6b06a] underline decoration-[#d6b06a]/55 underline-offset-[3px]">
            215-922-7900
          </a>{" "}
          or{" "}
          <button
            type="button"
            onClick={() => goToPage?.("contact")}
            className="font-medium text-[#d6b06a] underline decoration-[#d6b06a]/55 underline-offset-[3px]"
          >
            email
          </button>{" "}
          for today&apos;s applications, pets policy, and showing windows.
        </p>
      </div>

      <GlassCard
        variant={lightMode ? "frost" : "chrome"}
        lightMode={lightMode}
        className={`overflow-visible p-4 md:p-5 lg:p-6 ${lightMode ? "ring-1 ring-black/[0.04]" : `${listingsRailChromeClass} ring-1 ring-white/[0.06]`}`}
      >
        <div className="relative isolate min-h-[420px] overflow-hidden rounded-[26px] border border-[#d6b06a]/18 bg-[#0f1824] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] sm:min-h-[480px] md:min-h-[520px]">
          <span className="sr-only">
            Philadelphia skyline used as an editorial leasing backdrop; overlays mark featured units.
          </span>
          <img
            src={rentalsHeroSrc}
            alt=""
            role="presentation"
            loading="eager"
            decoding="async"
            className="pointer-events-none absolute inset-0 z-0 size-full object-cover object-[50%_80%] scale-[1.14]"
            fetchPriority="high"
          />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,rgba(6,10,18,0.12),rgba(5,10,18,0.42))]" />

          <div className="pointer-events-none absolute left-4 top-4 z-[2] flex flex-wrap items-center gap-2 sm:left-5 sm:top-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/55 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-xl">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#d6b06a]" aria-hidden />
              Featured units
            </div>
          </div>

          {!hasRentals ? (
            <div className="absolute inset-0 z-[3] flex items-center justify-center p-6 text-center">
              <div className="max-w-md rounded-[22px] border border-white/14 bg-black/55 px-6 py-5 text-sm text-white shadow-[0_20px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                Nothing featured in the grid right now. We still lease daily. Call or email for the live
                workbook.
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    onClick={mailGeneralLeasing}
                    className="rounded-full bg-[#d6b06a] px-6 py-5 text-sm font-semibold text-[#08111f] hover:bg-[#e4be78]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" aria-hidden />
                      Email leasing
                    </span>
                  </Button>
                  {goToPage && outlineButtonClasses ? (
                    <Button
                      type="button"
                      variant="outline"
                      className={outlineButtonClasses}
                      onClick={() => goToPage("contact")}
                    >
                      Contact page
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            rentals.map((rental, index) => {
              const position =
                rentalMapPinOffsets[index % rentalMapPinOffsets.length] ?? rentalMapPinOffsets[0];

              return (
                <div
                  key={rental.id}
                  className="absolute z-[3] -translate-x-1/2 -translate-y-1/2"
                  style={{ top: position.top, left: position.left }}
                >
                  <button
                    type="button"
                    onClick={() => onOpenRentalDetails?.(rental.id)}
                    style={{ translate: "nudge" in position ? position.nudge : undefined }}
                    className="max-w-[11rem] rounded-2xl border border-[#d6b06a]/25 bg-black/58 px-3 py-2 text-center text-xs font-medium text-white shadow-[0_12px_34px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-200 hover:border-[#d6b06a]/60 hover:bg-black/75 hover:scale-105 hover:shadow-[0_16px_40px_rgba(0,0,0,0.55)] sm:max-w-[12rem]"
                  >
                    <span className="line-clamp-2 leading-snug">{rental.title}</span>
                    <span className="mt-1 block font-semibold tracking-tight text-[#f4dfb4]">{rental.price}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

      </GlassCard>

      {hasRentals ? (
        <div>
          <div className="mb-5 md:mb-6">
            <div className={`h-px w-12 rounded-full md:w-14 ${lightMode ? "bg-[#d6b06a]/55" : "bg-[#d6b06a]/65"}`} aria-hidden />
            <p className={`mt-4 text-[10px] font-bold uppercase tracking-[0.28em] ${subtleText}`}>Featured leases</p>
            <h2 className={`mt-3 text-xl font-semibold tracking-tight md:text-[1.35rem] ${lightMode ? "text-black" : "text-white"}`}>
              Available now ({rentals.length})
            </h2>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
            {rentals.map((rental) => (
              <li key={rental.id} className="min-w-0">
                <article
                  className={`group flex h-full flex-col overflow-hidden rounded-[22px] border transition-colors duration-300 md:rounded-[24px] ${
                    onOpenRentalDetails ? "cursor-pointer" : ""
                  } ${
                    lightMode
                      ? "border-black/[0.08] bg-gradient-to-br from-white/88 to-white/45 shadow-[0_14px_42px_rgba(12,18,28,0.07)] hover:border-[#d6b06a]/38"
                      : "border-white/[0.09] bg-gradient-to-b from-white/[0.08] to-white/[0.025] shadow-[0_14px_48px_rgba(0,0,0,0.26)] hover:border-[#d6b06a]/28"
                  }`}
                  onClick={() => onOpenRentalDetails?.(rental.id)}
                >
                  <div className="relative isolate aspect-[16/11] shrink-0 overflow-hidden bg-[#0f1824]">
                    <img
                      src={rental.image}
                      alt={rental.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-[transform] duration-500 motion-safe:group-hover:scale-[1.04]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a11]/88 via-[#050a11]/25 to-transparent" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3.5 pb-3.5 pt-10">
                      <p className="text-lg font-semibold tabular-nums tracking-tight text-[#f8e9c8] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                        {rental.price}
                      </p>
                    </div>
                    <div
                      className={`pointer-events-none absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] backdrop-blur-md ${
                        lightMode ? "bg-white/88 text-black/62 ring-1 ring-black/12" : "bg-black/54 text-[#efd9a9] ring-1 ring-white/16"
                      }`}
                    >
                      <MapPin className="mr-1.5 h-3 w-3 shrink-0 text-[#d6b06a]" aria-hidden />
                      <span className="truncate">{rental.area}</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col px-4 pb-5 pt-4 sm:px-5 sm:pt-4">
                    <h3 className={`text-base font-semibold leading-snug tracking-tight sm:text-lg ${lightMode ? "text-black/95" : "text-white/[0.96]"}`}>
                      {rental.title}
                    </h3>
                    <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>{rental.meta}</p>
                    <Button
                      type="button"
                      className="mt-5 w-full rounded-full bg-[#d6b06a] py-5 text-sm font-semibold text-[#08111f] shadow-[0_12px_28px_rgba(214,176,106,0.3)] hover:bg-[#e4be78]"
                      onClick={(e) => { e.stopPropagation(); openRentalApplication(rental); }}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
                        Submit your application
                      </span>
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <GlassCard variant={lightMode ? "frost" : "chrome"} lightMode={lightMode} className={`px-6 py-12 text-center md:px-10 ${lightMode ? "" : listingsRailChromeClass}`}>
          <p className={`mx-auto max-w-lg text-sm leading-relaxed md:text-base ${mutedText}`}>
            No rentals are featured right now. Call or email for current availability.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              onClick={mailGeneralLeasing}
              className="rounded-full bg-[#d6b06a] px-8 py-6 text-[15px] font-semibold text-[#08111f] hover:bg-[#e4be78]"
            >
              Email leasing
            </Button>
            {goToPage && outlineButtonClasses ? (
              <Button type="button" variant="outline" className={`rounded-full px-8 py-6 ${outlineButtonClasses}`} onClick={() => goToPage("contact")}>
                Contact Penn Liberty
              </Button>
            ) : null}
          </div>
        </GlassCard>
      )}

      <GlassCard
        variant={lightMode ? "frost" : "soft"}
        lightMode={lightMode}
        className={`px-5 py-6 md:flex md:items-center md:justify-between md:gap-10 md:px-8 md:py-8`}
      >
        <p className={`max-w-3xl text-[11px] leading-relaxed md:text-sm ${subtleText}`}>
          Concessions, pet policy, parking, move-in dates, and income requirements change daily. Verify
          details before applying.
        </p>
        {goToPage && outlineButtonClasses ? (
          <div className="mt-4 shrink-0 md:mt-0">
            <Button
              type="button"
              variant="outline"
              className={`rounded-full px-8 py-6 text-[15px] [translate:5px_18px] ${outlineButtonClasses}`}
              onClick={() => goToPage("contact")}
            >
              Go to contact
            </Button>
          </div>
        ) : null}
      </GlassCard>
    </section>
  );
}
