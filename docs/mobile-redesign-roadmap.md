# Penn Liberty — Mobile-Native Redesign (working copy)

> In-repo working copy of the mobile redesign roadmap. Source of truth lives with
> the team; this file tracks decisions + progress as we implement. **390px primary
> width**, support down to 360px. Keep the existing visual language: quiet luxury,
> gold `#d6b06a`, glassmorphism, photo-forward, generous spacing, dark-mode bg swaps.

## Execution order
1. **Rentals Listing Page** ← current
2. Homepage
3. Refine Rental Detail page
4. For Owners page
5. Remaining pages (Contact, Team, About) + polish + project cleanup

---

## Decisions Log

### Priority 1 — Rentals Listing Page (approved June 2026)
1. **Mobile hero:** Replace the tall ~420px mural/pins hero with a compact branded
   strip (~208px) on `<md`. No pins, no physics, no Invaders on mobile. Strip shows:
   rentals background frame, "Philadelphia metro" chip, **unit count** ("N available
   now"), and a **Browse listings** button that scrolls to `#rentals-list`. Desktop
   hero unchanged (physics pins + Invaders Easter egg + collage).
2. **Mobile intro copy:** Condense aggressively — smaller `h1` ("Live inventory for
   touring.") + one line ("Philadelphia leases — tap a unit for photos, tour, and
   apply."). Drop the eyebrow, brand chip, and second paragraph on mobile. Full
   two-paragraph intro stays on `md+`.
3. **Card structure:** Extract `RentalListingCardMobile.tsx` (no rewrite). Polish
   only — tokens aligned with `RentalDetailSheet` (26px radius, gold price, pill
   borders, status dot, spacing). **No inline "apply"** on the mobile card; tap →
   sheet → sticky CTA owns apply.
4. **Section header:** Tighter on mobile — single line "Available now · N" (drop the
   "Featured leases" eyebrow + gold divider). Card gap bumped to `gap-5` on phones.
5. **Photo ratio:** Keep `aspect-[4/3]` for now (matches detail sheet language).
6. **Video badge:** Keep "15s tour" badge bottom-left when `videoUrl` exists; styled
   to match the detail sheet play affordance.
7. **Guardrails:** mobile gated via `isMobile` (consistent pattern), no new deps,
   `npm run build` must pass. Do not touch `hermes-skills/`, `rentals-incoming/`,
   FTP scripts, or the `rentals.json` workflow.
8. **Deep links / sheet:** Preserve current behavior — `/rentals/:slug` on mobile
   opens `RentalDetailSheet`; back/close returns to the listing without resetting
   scroll where avoidable.

**Success check:** first card visible within ~1–1.5 screens on an iPhone 15-class
device; card → sheet feels like one product; desktop Rentals page visually identical
to before (shared refactors are mobile-gated).

---

## Progress

- [x] **Priority 1 — Rentals Listing Page**
  - Compact mobile hero strip (`RentalsHeroStripMobile`); pins/physics/Invaders
    desktop-only.
  - Condensed mobile page intro.
  - Extracted + token-aligned `RentalListingCardMobile`.
  - Tightened mobile section header + card spacing; added `#rentals-list` anchor.
- [x] **Priority 2 — Homepage**
  - `Hero.tsx` split: `HeroMobile` (<md, via `isMobile`) / `HeroDesktop` (unchanged).
  - Mobile hero: weather chip, compact h1, one-line value prop, two full-width
    CTAs (gold "Browse Rentals", glass "For Property Owners").
  - Contained stat band (100+ Units · 98% Occupancy · 8+ Platforms).
  - Services as tappable rows (icon + title + chevron) in one glass card.
  - Platforms as a horizontal chip strip (`data-pl-horizontal-scroll`).
  - About condensed to one card with 2×2 stat chips.
- [x] **Cross-cutting — page transitions**
  - `.pl-page-enter` fade+rise (340ms) on every page change (nav + swipe),
    `prefers-reduced-motion` disables it; keyed wrapper in `App.tsx`.
  - Scroll-to-top on page change (skips first mount; detail-sheet open/close
    unaffected, preserving listing scroll per Decision 8).
- [x] **Priority 3 — Rental Detail page**
  - Token alignment achieved via P1 (listing card mirrors sheet: 26px radius,
    gold price scale, pill borders, status dot). No further sheet changes —
    it remains the quality bar.
- [x] **Priority 4 — For Owners page**
  - `OwnersQuickActionsMobile` under the hero (<md): gold "Get a free property
    review" (scrolls to the form) + Call / Email glass buttons. Conversion no
    longer buried 4 sections deep.
  - "At a glance" card: compact 3-up row on mobile (notes md+ only).
  - Section spacing `space-y-20→12`, tray `py-16→10`, hero padding trimmed (<md).
  - Path cards: tall min-heights md+ only; tighter mobile gaps.
  - Operate band: `p-5` + `mt-7` pillar grid on mobile.
- [x] **Priority 5 — Contact & Team**
  - Contact (<md): condensed header + instant tap rows (Call / Email) using the
    same row treatment as the rental ContactSheet; verbose mailto explainer
    hidden on phones. Desktop unchanged.
  - Team (<md): headline 2.4rem→2rem, tighter tracking + intro.
- [x] **Project health**
  - Proper `README.md` (stack, run, layout, mobile strategy, deploy, conventions).
  - Untouched per guardrails: `hermes-skills/`, `rentals-incoming/`, `qr-codes/`,
    FTP scripts, `rentals.json` workflow.

### Remaining / nice-to-have
- Visual QA pass on real 390px / 360px devices (light + dark).
- Image optimization audit (hero + listing photos).
- Hosting decision documentation (GoDaddy vs Vercel as primary).
