# Penn Liberty Real Estate — Website

Marketing + leasing site for [Penn Liberty Real Estate](https://pennlibertyre.com) (Philadelphia property
management, rentals, and sales). Live at **pennlibertyre.com** (GoDaddy) and **penn-liberty.vercel.app** (Vercel).

## Stack

- **React 19 + TypeScript (strict)** on **Vite 7**
- **Tailwind CSS 3** — quiet-luxury visual language: gold `#d6b06a`, glassmorphism, photo-forward
- **Leaflet** for the listings map, **EmailJS** for contact/owner forms, **Three.js** for the
  Rentals-hero Space Invaders Easter egg (desktop only, lazy-loaded)
- No backend — static SPA with hash-free client routing handled in `src/App.tsx`

## Run locally

```bash
npm install
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the production build
```

## Project layout

```
src/
  App.tsx                 # routing, theme, page shell, global swipe nav
  components/             # page sections + UI (RentalsSection, Hero, owners/, ui/)
  components/owners/      # For Owners page bands
  hooks/                  # useRentalsHeroPhysicsMode (isMobile / physics gating)
  lib/                    # data.ts (rentals/listings), theme, routing, physics
  lib/rentalsInvaders3d/  # Three.js mini-game engine (lazy chunk)
docs/
  mobile-redesign-roadmap.md   # mobile strategy + decisions log (keep updated)
```

## Mobile strategy

The site is **mobile-first below 768px** with dedicated mobile interfaces (not shrunk desktop):
compact heroes, stacked premium cards, bottom sheets (`RentalDetailSheet`), tap-first CTAs, and a
340ms page transition. Primary target width **390px**, supported down to 360px. The full strategy,
decisions log, and progress live in [docs/mobile-redesign-roadmap.md](docs/mobile-redesign-roadmap.md).

Desktop keeps the richer layer: physics rental pins, the Space Invaders Easter egg (click the
bottom-right corner of the Rentals hero), collage heroes, and 3D-tilt cards.

## Deployment

- **GoDaddy (pennlibertyre.com):** `npm run build`, then upload `dist/` per `DEPLOY-GODADDY.md`.
- **Vercel (penn-liberty.vercel.app):** auto-builds from the GitHub repo (`Dnasty007/PennLiberty`).

## Conventions

- `@/` path alias → `src/`
- Mobile gating uses `isMobile` from `useRentalsHeroPhysicsMode` (768px breakpoint + reduced-motion aware)
- All primary CTAs: gold pill (`bg-[#d6b06a]`, full rounded); secondary: glass/outline
- Rentals inventory lives in `src/lib/data.ts`; per-unit assets under `public/Rentals/<slug>/`
