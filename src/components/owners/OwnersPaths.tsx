import { ownersPaths, type OwnersPath } from "@/lib/owners";
import { SectionDivider } from "@/components/owners/SectionDivider";
import type { PageKey } from "@/lib/data";
import { use3DTilt } from "@/lib/use3DTilt";

const OPERATE_ANCHOR = "owners-operate-heading";
const REVIEW_SECTION = "owners-property-review";
const REVIEW_NAME_FIELD = "owners-property-review-name";

function scrollElementIntoViewPreferStart(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusAfterScroll(selector: string, delayMs = 420) {
  window.setTimeout(() => {
    document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  }, delayMs);
}

function PathCard({
  path,
  featured,
  lightMode,
  onActivate,
}: {
  path: OwnersPath;
  featured: boolean;
  lightMode: boolean;
  onActivate: () => void;
}) {
  const tilt = use3DTilt({ maxRotateDeg: 7, trackLightSpot: true });

  const featuredBg = lightMode
    ? "min-h-[260px] border-[#c49a42]/55 bg-[linear-gradient(150deg,rgba(214,176,106,0.28),rgba(255,255,255,0.55))] shadow-[0_22px_56px_-16px_rgba(12,18,28,0.16)]"
    : "min-h-[260px] border-[#d6b06a]/45 bg-[linear-gradient(150deg,rgba(214,176,106,0.16),rgba(255,255,255,0.03))] shadow-[0_26px_64px_-18px_rgba(0,0,0,0.45)]";
  const defaultBg = lightMode
    ? "min-h-[200px] border-black/[0.09] bg-white/[0.38] xl:min-h-[240px]"
    : "min-h-[200px] border-white/[0.09] bg-[rgba(255,255,255,0.02)] xl:min-h-[240px]";

  const ringOffset = lightMode ? "focus-visible:ring-offset-[rgba(246,243,239,1)]" : "focus-visible:ring-offset-[rgba(10,21,39,1)]";
  const eyebrowDefault = lightMode ? "text-black/45" : "text-white/48";
  const eyebrowFeatured = lightMode ? "text-[#7a5916]" : "text-[#e5c98a]";
  const titleInk = lightMode ? "text-black" : "text-white";
  const bodyInk = lightMode ? "text-black/[0.68]" : "text-white/[0.72]";
  const ctaDefault = lightMode ? "text-[#8b6914]" : "text-[#d6b06a]";
  const ctaFeatured = lightMode ? "text-[#5c430a]" : "text-[#edd7a9]";

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`group relative overflow-hidden rounded-[26px] border p-[1.35rem] transition-[border-color,background] duration-300 [transform-style:preserve-3d] md:p-7 ${
        featured ? featuredBg : defaultBg
      } before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),rgba(214,176,106,0.15),transparent_58%)] before:opacity-0 before:transition-opacity before:duration-200 data-[tilt-active=true]:before:opacity-100`}
    >
      <button
        type="button"
        onClick={onActivate}
        className={`absolute inset-0 z-20 rounded-[inherit] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b06a] focus-visible:ring-offset-2 ${ringOffset}`}
        aria-label={`${path.title}: ${path.cta}`}
      />

      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between gap-4 [transform:translateZ(24px)]">
        <div>
          <span
            className={`text-[11px] uppercase tracking-[0.22em] ${
              featured ? eyebrowFeatured : eyebrowDefault
            }`}
          >
            {path.eyebrow}
          </span>
          <h3 className={`mt-3 text-xl font-semibold tracking-tight ${titleInk}`}>{path.title}</h3>
          <p className={`mt-2 text-[0.9375rem] leading-relaxed ${bodyInk}`}>{path.body}</p>
        </div>
        <div className={`text-[13px] font-semibold ${featured ? ctaFeatured : ctaDefault}`}>
          <span aria-hidden>{path.cta}</span>
          <span aria-hidden className="ml-0.5">
            →
          </span>
        </div>
      </div>
    </div>
  );
}

type OwnersPathsProps = {
  lightMode: boolean;
  mutedText: string;
  subtleText: string;
  /** Contact page (“Explore selling”); mail bootstrap uses `sessionStorage` key `pl-contact-bootstrap`. */
  goToPage?: (page: PageKey) => void;
  /** Align the property-review interest select before we scroll there (management / exploratory paths). */
  onPresetPropertyReviewInterest?: (
    preset: "I want help managing" | "I'm thinking of selling" | "I'm not sure yet",
  ) => void;
};

export function OwnersPaths({
  lightMode,
  mutedText,
  subtleText,
  goToPage,
  onPresetPropertyReviewInterest,
}: OwnersPathsProps) {
  const sorted = [...ownersPaths].sort((a, b) => Number(b.featured) - Number(a.featured));

  const activate = (path: OwnersPath) => {
    switch (path.key) {
      case "manage":
        onPresetPropertyReviewInterest?.("I want help managing");
        scrollElementIntoViewPreferStart(OPERATE_ANCHOR);
        break;
      case "sell":
        try {
          sessionStorage.setItem(
            "pl-contact-bootstrap",
            JSON.stringify({
              draft:
                "Hi Penn Liberty,\n\nI'm reaching out about selling (or valuing) a Philadelphia property and would appreciate guidance on next steps.\n",
              focusCompose: true,
            }),
          );
        } catch {
          /* ignore quota / privacy mode */
        }
        goToPage?.("contact");
        break;
      case "unsure":
        onPresetPropertyReviewInterest?.("I'm not sure yet");
        scrollElementIntoViewPreferStart(REVIEW_SECTION);
        focusAfterScroll(`#${REVIEW_NAME_FIELD}`);
        break;
      default:
        break;
    }
  };

  const introMuted = mutedText;

  return (
    <section>
      <SectionDivider lightMode={lightMode} label="However we can help" number="02" />
      <p className={`mt-6 max-w-2xl text-sm leading-snug md:text-[0.95rem] md:leading-relaxed ${introMuted}`}>
        Whether you want a management team that takes everything off your plate, you&apos;re thinking about
        selling, or you just want to talk through your options — we&apos;ve got a clear next step for you.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((path) => (
          <PathCard
            key={path.key}
            path={path}
            featured={path.featured}
            lightMode={lightMode}
            onActivate={() => activate(path)}
          />
        ))}
      </div>
    </section>
  );
}
