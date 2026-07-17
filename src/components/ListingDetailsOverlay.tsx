import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, Mail, Phone, X } from "lucide-react";
import type { ListingAgent, PropertyDetail } from "@/lib/data";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { propertyOverview } from "@/lib/theme";

function getOverlayPortalRoot(): HTMLElement {
  let root = document.getElementById("pl-overlay-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "pl-overlay-root";
    document.documentElement.appendChild(root);
  }
  return root;
}

type ListingDetailsOverlayProps = {
  currentImageIndex: number;
  lightMode: boolean;
  listing: PropertyDetail | null;
  mutedText: string;
  onClose: () => void;
  onImageChange: (index: number) => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onScheduleTour: () => void;
  primaryActionLabel?: string;
  backLabel?: string;
};

type ListingTheme = {
  shellText: string;
  shellBorder: string;
  quietPill: string;
  closeButton: string;
  secondaryButton: string;
  detailMutedText: string;
  highlightCardClasses: string;
  imageOverlay: string;
  imageControlClasses: string;
  counterClasses: string;
  lightShellClasses: string;
  darkShellClasses: string;
  outlineBtn: string;
  ctaBg: string;
  cardBg: string;
  titleColor: string;
  dividerColor: string;
};

function buildListingTheme(lightMode: boolean): ListingTheme {
  return {
    shellText: lightMode ? "text-black" : "text-white",
    shellBorder: lightMode ? "border-black/10" : "border-white/10",
    quietPill: lightMode
      ? "border-black/12 bg-white/85 text-black/70"
      : "border-white/10 bg-white/[0.05] text-white/72",
    closeButton: lightMode
      ? "border-black/12 bg-white/85 text-black"
      : "border-white/10 bg-white/[0.05] text-white",
    secondaryButton: lightMode
      ? "rounded-full border-black/12 bg-white/88 px-6 py-6 text-black hover:bg-white"
      : "rounded-full border-white/15 bg-white/[0.04] px-6 py-6 text-white hover:bg-white/[0.08]",
    detailMutedText: lightMode ? "text-black/78" : "text-white/68",
    highlightCardClasses: lightMode
      ? "border-black/10 bg-white/34 text-black"
      : "border-white/10 bg-white/[0.05] text-white",
    imageOverlay: lightMode
      ? "absolute inset-0 bg-[linear-gradient(to_top,rgba(12,18,28,0.18),rgba(12,18,28,0.04)_38%,rgba(12,18,28,0.01))]"
      : "absolute inset-0 bg-[linear-gradient(to_top,rgba(4,10,16,0.58),rgba(4,10,16,0.1)_38%,rgba(4,10,16,0.04))]",
    imageControlClasses: lightMode
      ? "border-white/35 bg-white/30 text-white backdrop-blur-md hover:bg-white/42"
      : "border-white/15 bg-black/30 text-white backdrop-blur-md hover:bg-black/45",
    counterClasses: lightMode
      ? "border-white/35 bg-white/28 text-white backdrop-blur-md"
      : "border-white/15 bg-black/35 text-white backdrop-blur-md",
    lightShellClasses:
      "border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.46))] shadow-[0_28px_90px_rgba(12,18,28,0.14)] backdrop-blur-[20px]",
    darkShellClasses:
      "border-white/12 bg-[linear-gradient(180deg,rgba(10,18,30,0.97),rgba(8,14,26,0.99))] shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
    outlineBtn: lightMode
      ? "border-black/12 bg-black/[0.04] text-black/80"
      : "border-white/[0.12] bg-white/[0.04] text-white/85",
    ctaBg: lightMode
      ? "bg-gradient-to-t from-white/[0.98] via-white/90 to-transparent"
      : "bg-gradient-to-t from-[#05101e]/[0.98] via-[#05101e]/90 to-transparent",
    cardBg: lightMode
      ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,247,243,0.98))] border-black/[0.08]"
      : "bg-[linear-gradient(180deg,rgba(8,14,26,0.97),rgba(5,10,20,0.99))] border-white/[0.09]",
    titleColor: lightMode ? "text-black/92" : "text-white",
    dividerColor: lightMode ? "bg-black/[0.06]" : "bg-white/[0.07]",
  };
}

function AgentContactRow({
  label,
  agent,
  lightMode,
  detailMutedText,
  shellBorder,
  shellText,
}: {
  label: string;
  agent: ListingAgent;
  lightMode: boolean;
  detailMutedText: string;
  shellBorder: string;
  shellText: string;
}) {
  const rowBg = lightMode
    ? "border-black/12 bg-white/85"
    : "border-white/10 bg-white/[0.05]";
  const emailBtn = lightMode
    ? "border-black/12 bg-black/[0.04] text-black/80 hover:bg-black/[0.07]"
    : "border-white/15 bg-white/[0.06] text-white/90 hover:bg-white/[0.1]";

  return (
    <div className={`rounded-[20px] border p-4 ${rowBg} ${shellBorder}`}>
      <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>{label}</div>
      <div className={`mt-2 text-lg font-semibold ${shellText}`}>{agent.name}</div>
      {agent.license && (
        <div className={`mt-1 text-sm ${detailMutedText}`}>License {agent.license}</div>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {agent.phone && (
          <a
            href={`tel:${agent.phone.replace(/\D/g, "")}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#d6b06a]/35 bg-[#d6b06a]/10 px-4 py-2.5 text-sm font-medium text-[#d6b06a] transition hover:bg-[#d6b06a]/20"
          >
            <Phone className="h-4 w-4" />
            {agent.phone}
          </a>
        )}
        {agent.email && (
          <a
            href={`mailto:${agent.email}`}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${emailBtn}`}
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        )}
      </div>
    </div>
  );
}

function ListingDetailBody({
  listing,
  lightMode,
  theme,
  onScheduleTour,
  onClose,
  primaryActionLabel,
  backLabel,
  compact,
}: {
  listing: PropertyDetail;
  lightMode: boolean;
  theme: ListingTheme;
  onScheduleTour: () => void;
  onClose: () => void;
  primaryActionLabel: string;
  backLabel: string;
  compact?: boolean;
}) {
  const { shellText, detailMutedText, shellBorder, highlightCardClasses, secondaryButton } = theme;

  return (
    <div className={compact ? "space-y-5" : "space-y-6"}>
      {!compact && (
        <div>
          <div className={`text-[2rem] font-semibold tracking-tight md:text-5xl ${theme.titleColor}`}>
            {listing.price}
          </div>
          <h2 className={`mt-2 text-xl font-semibold md:text-3xl ${theme.titleColor}`}>{listing.title}</h2>
          <div className={`mt-3 text-base leading-relaxed ${detailMutedText}`}>{listing.address}</div>
          {listing.brokerage && (
            <div className="mt-3 text-sm uppercase tracking-[0.18em] text-[#d6b06a]">
              {listing.brokerage}
            </div>
          )}
        </div>
      )}

      {listing.description && (
        <div>
          <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Property Description</div>
          <p className={`mt-3 text-[1.02rem] leading-8 ${detailMutedText}`}>{listing.description}</p>
        </div>
      )}

      {!!listing.highlights?.length && (
        <div>
          <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Highlights</div>
          <div className="mt-3 grid gap-3">
            {listing.highlights.map((highlight) => (
              <div key={highlight} className={`rounded-[20px] border px-4 py-3 ${highlightCardClasses}`}>
                {highlight}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <GlassCard variant={lightMode ? "frost" : "soft"} lightMode={lightMode} className={`p-4 ${shellText}`}>
          <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Property Type</div>
          <div className="mt-2 text-lg font-medium">{listing.propertyType ?? "Residential"}</div>
        </GlassCard>
        <GlassCard variant={lightMode ? "frost" : "soft"} lightMode={lightMode} className={`p-4 ${shellText}`}>
          <div className={`text-xs uppercase tracking-[0.18em] ${detailMutedText}`}>Overview</div>
          <div className="mt-2 text-lg font-medium">{propertyOverview(listing)}</div>
        </GlassCard>
      </div>

      {(listing.listingAgent || listing.coListingAgent) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {listing.listingAgent && (
            <AgentContactRow
              label="Listing Agent"
              agent={listing.listingAgent}
              lightMode={lightMode}
              detailMutedText={detailMutedText}
              shellBorder={shellBorder}
              shellText={shellText}
            />
          )}
          {listing.coListingAgent && (
            <AgentContactRow
              label="Co-Listing Agent"
              agent={listing.coListingAgent}
              lightMode={lightMode}
              detailMutedText={detailMutedText}
              shellBorder={shellBorder}
              shellText={shellText}
            />
          )}
        </div>
      )}

      {!compact && (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button
            className="rounded-full bg-[#d6b06a] px-6 py-6 text-[#08111f] hover:bg-[#e4be78]"
            onClick={onScheduleTour}
          >
            {primaryActionLabel}
          </Button>
          <Button variant="outline" className={secondaryButton} onClick={onClose}>
            {backLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

function ListingImageGallery({
  listing,
  images,
  currentImageIndex,
  lightMode,
  theme,
  onImageChange,
  onNextImage,
  onPrevImage,
  onOpenLightbox,
  compact,
}: {
  listing: PropertyDetail;
  images: string[];
  currentImageIndex: number;
  lightMode: boolean;
  theme: ListingTheme;
  onImageChange: (index: number) => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onOpenLightbox?: () => void;
  compact?: boolean;
}) {
  const activeImage = images[currentImageIndex] ?? images[0];
  const { imageOverlay, imageControlClasses, counterClasses } = theme;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div
        className={`relative w-full overflow-hidden rounded-[22px] bg-[#0a121c] ${
          compact ? "aspect-[16/11] max-h-[min(300px,34vh)]" : "aspect-[16/10] max-h-[min(420px,45vh)]"
        }`}
      >
        <button
          type="button"
          className="group absolute inset-0 w-full cursor-zoom-in"
          onClick={onOpenLightbox}
          aria-label={onOpenLightbox ? "View full screen" : undefined}
          disabled={!onOpenLightbox}
        >
          <img src={activeImage} alt={listing.title} className="h-full w-full object-contain" />
          <div className={imageOverlay} />
          {onOpenLightbox && (
            <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
              <Expand className="h-4 w-4" />
            </div>
          )}
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrevImage}
              className={`absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition ${imageControlClasses}`}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onNextImage}
              className={`absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition ${imageControlClasses}`}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className={`absolute bottom-4 left-4 rounded-full border px-3 py-1.5 text-sm ${counterClasses}`}>
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      {images.length > 1 && (
        <div
          className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-pl-horizontal-scroll
        >
          {images.map((image, index) => {
            const isActive = index === currentImageIndex;
            return (
              <button
                key={`${listing.title}-gallery-thumb-${index}`}
                type="button"
                onClick={() => onImageChange(index)}
                className={`h-16 w-24 shrink-0 overflow-hidden rounded-[14px] border transition ${
                  isActive
                    ? "border-[#d6b06a] shadow-[0_10px_24px_rgba(214,176,106,0.22)]"
                    : lightMode
                      ? "border-black/12 bg-white/85"
                      : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <img
                  src={image}
                  alt={`${listing.title} image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ListingOverlayPanel({
  listing,
  images,
  currentImageIndex,
  lightMode,
  theme,
  onClose,
  onImageChange,
  onNextImage,
  onPrevImage,
  onScheduleTour,
  onOpenLightbox,
  primaryActionLabel,
  backLabel,
}: {
  listing: PropertyDetail;
  images: string[];
  currentImageIndex: number;
  lightMode: boolean;
  theme: ListingTheme;
  onClose: () => void;
  onImageChange: (index: number) => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onScheduleTour: () => void;
  onOpenLightbox: () => void;
  primaryActionLabel: string;
  backLabel: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    shellText,
    shellBorder,
    quietPill,
    closeButton,
    titleColor,
    detailMutedText,
    secondaryButton,
    cardBg,
  } = theme;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [listing.title]);

  const desktopShellClasses = lightMode
    ? "lg:border-black/8 lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.46))] lg:backdrop-blur-[20px] lg:shadow-[0_28px_90px_rgba(12,18,28,0.14)]"
    : "lg:border-white/12 lg:bg-[linear-gradient(180deg,rgba(10,18,30,0.97),rgba(8,14,26,0.99))] lg:shadow-[0_24px_80px_rgba(0,0,0,0.45)]";

  return (
    <div
      data-pl-no-page-swipe
      className={`pl-overlay-enter fixed inset-0 z-[100] flex flex-col lg:items-start lg:justify-center lg:overflow-y-auto lg:overscroll-contain lg:p-8 ${
        lightMode ? "bg-[#faf7f3] lg:bg-[rgba(9,16,26,0.18)] lg:backdrop-blur-xl" : "bg-[#06101d] lg:bg-[rgba(4,10,16,0.72)] lg:backdrop-blur-xl"
      }`}
    >
      <div className="fixed inset-0 overscroll-none max-lg:hidden" onClick={onClose} aria-hidden="true" />

      <div
        className={`pl-sheet-enter relative z-10 flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-0 ${shellText} ${cardBg} lg:my-auto lg:h-auto lg:max-h-[min(920px,calc(100dvh-2rem))] lg:max-w-[920px] lg:rounded-[28px] lg:border ${desktopShellClasses}`}
      >
        <div className={`flex shrink-0 items-center justify-between gap-4 border-b px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:items-start lg:px-6 lg:py-5 lg:pt-5 ${shellBorder}`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {listing.mlsNumber && (
                <div className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] lg:text-xs ${quietPill}`}>
                  MLS# {listing.mlsNumber}
                </div>
              )}
              {listing.status && (
                <div className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] lg:text-xs ${quietPill}`}>
                  {listing.status}
                </div>
              )}
            </div>
            {/* Desktop keeps the rich pinned header; on mobile this moves into the
                scroll body so the reading area gets the full screen height. */}
            <div className="hidden lg:block">
              <div className="mt-3 text-[2.35rem] font-semibold leading-none tracking-tight text-[#d6b06a]">
                {listing.price}
              </div>
              <h2 className={`mt-2.5 text-2xl font-semibold leading-snug tracking-tight ${titleColor}`}>
                {listing.title}
              </h2>
              <p className={`mt-2 text-base leading-relaxed ${detailMutedText}`}>{listing.address}</p>
              {listing.brokerage && (
                <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[#d6b06a]">{listing.brokerage}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${closeButton}`}
            aria-label="Close listing details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 lg:px-6 lg:py-5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Mobile identity — scrolls with content (desktop shows it pinned in the header) */}
          <div className="mb-4 lg:hidden">
            <div className="text-[1.85rem] font-semibold leading-none tracking-tight text-[#d6b06a]">
              {listing.price}
            </div>
            <h2 className={`mt-2 text-lg font-semibold leading-snug tracking-tight ${titleColor}`}>
              {listing.title}
            </h2>
            <p className={`mt-1.5 text-sm leading-relaxed ${detailMutedText}`}>{listing.address}</p>
            {listing.brokerage && (
              <p className="mt-1.5 text-xs uppercase tracking-[0.18em] text-[#d6b06a]">{listing.brokerage}</p>
            )}
          </div>

          <ListingImageGallery
            listing={listing}
            images={images}
            currentImageIndex={currentImageIndex}
            lightMode={lightMode}
            theme={theme}
            onImageChange={onImageChange}
            onNextImage={onNextImage}
            onPrevImage={onPrevImage}
            onOpenLightbox={onOpenLightbox}
            compact
          />

          <div className={`mt-6 border-t pt-6 ${shellBorder}`}>
            <ListingDetailBody
              listing={listing}
              lightMode={lightMode}
              theme={theme}
              onScheduleTour={onScheduleTour}
              onClose={onClose}
              primaryActionLabel={primaryActionLabel}
              backLabel={backLabel}
              compact
            />
          </div>
        </div>

        <div className={`flex shrink-0 flex-wrap gap-3 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6 ${shellBorder}`}>
          <Button
            className="rounded-full bg-[#d6b06a] px-6 py-6 text-[#08111f] hover:bg-[#e4be78]"
            onClick={onScheduleTour}
          >
            {primaryActionLabel}
          </Button>
          <Button variant="outline" className={secondaryButton} onClick={onClose}>
            {backLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ListingDetailsOverlay({
  currentImageIndex,
  lightMode,
  listing,
  mutedText: _mutedText,
  onClose,
  onImageChange,
  onNextImage,
  onPrevImage,
  onScheduleTour,
  primaryActionLabel = "Schedule Tour",
  backLabel = "Back to Listings",
}: ListingDetailsOverlayProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") onNextImage();
      if (e.key === "ArrowLeft") onPrevImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, onNextImage, onPrevImage]);

  useEffect(() => {
    if (!listing) return;
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [listing]);

  useEffect(() => {
    if (!listing || lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listing, lightboxOpen, onClose]);

  if (!listing) {
    return null;
  }

  const images = listing.gallery.length ? listing.gallery : [listing.image];
  const activeImage = images[currentImageIndex] ?? images[0];
  const theme = buildListingTheme(lightMode);

  return createPortal(
    <>
      <ListingOverlayPanel
        listing={listing}
        images={images}
        currentImageIndex={currentImageIndex}
        lightMode={lightMode}
        theme={theme}
        onClose={onClose}
        onImageChange={onImageChange}
        onNextImage={onNextImage}
        onPrevImage={onPrevImage}
        onScheduleTour={onScheduleTour}
        onOpenLightbox={() => setLightboxOpen(true)}
        primaryActionLabel={primaryActionLabel}
        backLabel={backLabel}
      />

      {lightboxOpen && (
        <div
          data-pl-no-page-swipe
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/94 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-md transition hover:bg-white/[0.15]"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close fullscreen"
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={activeImage}
            alt={listing.title}
            className="max-h-screen max-w-full object-contain px-14 py-14"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-md transition hover:bg-white/[0.15]"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevImage();
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white backdrop-blur-md transition hover:bg-white/[0.15]"
                onClick={(e) => {
                  e.stopPropagation();
                  onNextImage();
                }}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/50 px-4 py-1.5 text-sm text-white backdrop-blur-md">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>,
    getOverlayPortalRoot(),
  );
}
