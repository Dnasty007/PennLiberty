# For Owners Redesign + AI Chat Assistant

Date: 2026-05-06
Status: Approved through v6 mockup; AI chat scope locked

## Goal

1. Replace the placeholder `property-management` section on the Penn Liberty site with a fully designed **For Owners** page that builds trust, educates owners on the value of professional management, and treats sales as an equal path to management.
2. Add an **AI chat assistant** that lets visitors ask questions and get routed to the right answer. Free to operate via Groq's free tier; no API key ever exposed in the browser.

## Audience and tone

- Mixed owner audience: small landlords, multi-family investors, out-of-state owners.
- Voice: warm, locally rooted, modern, professional. "Real person on the phone" feel, not corporate.
- Visual identity: liquid glass system from the rest of the site, with gold (`#d6b06a`) accent. Continuous Philadelphia park backdrop running through the page.

## Non-goals

- Booking system, payments, or document signing on this page.
- Site-wide deployment of the chat assistant in v1 (For Owners only).
- AI features beyond Q&A routing in v1 (no transcript export, no auth, no per-owner accounts).

## For Owners page structure

Six sections, in order, all rendered against a continuous Philly park backdrop with gold radial highlight in the upper right:

1. **Welcome (no card)** - Vertical gold rule + headline floating on the backdrop. Live "Ask Penn Liberty" pill anchored top-right of this section (replacing the v6 "Local team online" placeholder).
2. **Why good management matters (interactive tabs)** - Five vertical tabs (Time, Money, Risk, Property, Peace of Mind). Selecting a tab swaps a large title and body on the right side.
3. **However we can help (bento path picker)** - One large featured "Full-Service Management" card + two smaller stacked cards ("Real Estate Sales", "Talk it through"). All three cards have **3D mouse-tilt** with a gold light spot following the cursor.
4. **We know these blocks (asymmetric neighborhood grid)** - One tall hero tile + four shorter tiles. Hover lifts each tile in 3D with a deeper shadow. Tiles use Philly neighborhood imagery.
5. **Owner voices (oversized pull quote + polaroid)** - Large serif pull quote with attribution, paired with a tilted polaroid Philly photo that straightens on hover.
6. **Let's start simple (CTA)** - Headline floating on backdrop on the left, glass form card on the right with name / contact / property / interest dropdown / "Start With a Property Review" button. Includes a phone CTA fallback.

Each section after the welcome has a thin gold rule with a small uppercase label and a giant translucent number (01-05) sitting behind as decoration.

### Visual system rules

- Glass cards: `rgba(255,255,255,0.05)` background, `border-white/12`, `backdrop-blur(22px) saturate(140%)`, with two layered overlays (white highlight + gold gradient).
- Gold accent: `#d6b06a` for headings, links, focus rings, primary CTAs.
- Page backdrop: a single Philadelphia park image (Boathouse Row / Fairmount Park style) committed to `public/owners/philly-park.jpg`. Fallback gradient if image fails to load.
- Decorative numbers: `font-size: 110px`, `color: rgba(255,255,255,0.06)`, absolutely positioned.

### Interaction rules

- 3D tilt: `perspective(1200px)`, max rotation 8 degrees, applied via mouse-move handler. Reset on mouse-leave. Disabled on touch devices via media query.
- Education tab swap: keyed by tab id; content lives in a typed `EDU_PANELS` map.
- Hover lift on neighborhoods: max rotation 4 degrees + small `translateY` + deeper shadow.
- Polaroid: `rotate(-3deg)` default, `rotate(0deg) translateY(-6px) scale(1.02)` on hover.
- Live chat pill: pulsing gold dot, expands to chat panel on click.

## AI chat assistant

### Architecture

```
visitor browser  ->  /api/owner-chat  (Vercel Edge Function)  ->  Groq API
                          |
                          +- reads GROQ_API_KEY from env var
                          +- enforces rate limit + length cap + cache
                          +- returns plain JSON to browser
```

The visitor browser **never** receives or sees `GROQ_API_KEY`. Only the Edge Function reads it.

### Frontend component

`src/components/AIAssistant.tsx`:

- Floating glass pill at top-right of the For Owners welcome section (matches the v6 placement).
- Pill shows pulsing gold dot + "Ask Penn Liberty".
- On click: pill expands into a glass panel (~360px wide, ~480px tall on desktop; full-width sheet on mobile).
- Panel shows:
  - Header: "Penn Liberty Assistant" + close button.
  - Conversation list (user bubbles + assistant bubbles).
  - 4-6 suggestion chips when conversation is empty (e.g. "How does management work?", "Do you sell properties?", "What if I'm out of state?", "How do I list my rental?").
  - Input row: text input + send button. Keyboard support: `Enter` sends, `Esc` closes.
- Loading state: dot loader bubble while waiting for response.
- Error state: friendly fallback ("Something went wrong. Want to use the contact form instead?") with a button that scrolls to the CTA section and pre-fills the property field with the user's last message.
- Off-topic / fallback: same handling - direct visitors to the contact form when the model can't help.
- Persists conversation in `sessionStorage` so refresh-resilient within a single visit.

### Backend (Vercel Edge Function)

`api/owner-chat.ts`:

- **Runtime:** Edge (`export const config = { runtime: 'edge' }`).
- **Method:** POST only. Returns 405 otherwise.
- **Body schema:** `{ messages: Array<{ role: 'user' | 'assistant', content: string }> }`. Max 12 messages per request, max 500 chars per message.
- **System prompt:** Hand-written, baked into the function. Tells the model:
  - Identity: Penn Liberty Real Estate, Philadelphia, since 2009.
  - Services: full-service property management (leasing, tenants, rent, maintenance, vendor coordination, owner reporting) and real estate sales.
  - Coverage: Center City, Northern Liberties, Fishtown, Temple area, North Philly, South Philly, West Philly, and surrounding neighborhoods.
  - Voice: warm, concise, locally rooted. Plain-spoken, not corporate.
  - Hard rules: never invent prices, fees, or guarantees; never claim to be a lawyer, tax advisor, or licensed inspector; for unclear questions, encourage the visitor to use the property review form or call 215-987-4444.
- **Model:** `llama-3.3-70b-versatile` on Groq. Temperature 0.4. Max tokens 350.
- **Streaming:** disabled in v1 (simpler, easier to cache; streaming added in v2).
- **Rate limit:** in-memory map keyed by IP, rolling 10-min window, 8 messages per IP. Map TTL is the function instance lifetime (acceptable for v1 - a future revision could move to Upstash).
- **Daily cap:** simple in-memory counter resets on UTC date change. If the day's total exceeds 200 calls, function returns the fallback message instead of calling Groq.
- **Cache:** SHA-256 hash of the user's last message + system prompt version. If hash exists in an in-memory map, return cached answer. (In-memory only in v1; revisitable.)
- **Response shape:** `{ reply: string, source: 'groq' | 'cache' | 'fallback' }`.

### Cost guardrails

| Layer | Mechanism | Effect |
|---|---|---|
| 1 | Suggestion chips | Common questions never reach the model |
| 2 | In-memory cache | Repeat questions in the same instance return instantly, free |
| 3 | Per-IP rate limit | Single visitor cannot spam |
| 4 | Daily cap | Function refuses calls past a daily ceiling |
| 5 | Length cap | Long pastes blocked before reaching Groq |

Realistic ongoing cost: $0 (Groq free tier).

### Security

- `GROQ_API_KEY` lives only in Vercel environment variables. Never committed to git, never hardcoded, never returned in any response.
- `.gitignore` is updated to include `.env*` (currently missing).
- The Edge Function validates the request body shape before calling Groq.
- CORS is restricted to the deployed origin in production. For local dev, the Vite dev server proxies `/api/*` to a local function.

## File structure

New files:

```
api/
  owner-chat.ts                       # Vercel Edge Function (Groq proxy)
src/
  components/
    OwnersSection.tsx                 # Top-level owner page section
    OwnersHero.tsx                    # Welcome with gold rule + AI pill
    OwnersWhyManagement.tsx           # Education tabs
    OwnersPaths.tsx                   # 3D-tilt bento path picker
    OwnersNeighborhoods.tsx           # Asymmetric neighborhood grid
    OwnersVoices.tsx                  # Pull quote + polaroid
    OwnersCTA.tsx                     # Inviting form CTA
    AIAssistant.tsx                   # Floating chat pill + panel
    AIAssistant.module.css            # (optional) scoped styles for chat
  lib/
    owners.ts                         # Static content: tabs, paths, neighborhoods, voices
    use3DTilt.ts                      # Reusable 3D mouse-tilt hook
public/
  owners/
    philly-park.jpg                   # Page-wide backdrop (Philly park / Boathouse Row)
    neighborhoods/
      northern-liberties.jpg
      temple.jpg
      fishtown.jpg
      south-philly.jpg
      center-city.jpg
docs/superpowers/specs/
  2026-05-06-for-owners-redesign-and-ai-chat-design.md  # this file
```

Modified files:

```
src/App.tsx                           # replace property-management section with <OwnersSection />
src/lib/data.ts                       # rename property-management label if needed (optional)
.gitignore                            # add .env*
package.json                          # add @vercel/node types if needed for tooling (not required for Edge runtime)
README.md                             # add brief note on env var setup
```

## Image plan

For v1 we use placeholder images sourced from Unsplash via stable, hand-picked URLs (committed to `public/owners/` so the page does not depend on Unsplash uptime in production). The user can swap in real photographer-supplied photos later by replacing the files at the same paths.

Selection criteria:
- Park backdrop: leafy green Philly park scene with depth, low-saturation enough to read as background.
- Neighborhood tiles: recognizable rowhomes / streetscapes for each neighborhood.

## Error handling

| Failure | Behavior |
|---|---|
| `GROQ_API_KEY` missing | Function returns `{ reply: "<fallback>", source: 'fallback' }` and logs a warning. Chat shows the fallback message and a contact-form link. |
| Groq 429 / 500 | Function returns fallback, chat keeps working. |
| Rate limit hit | Function returns "We're getting a lot of questions right now. Want to use the contact form?" with form link. |
| Network error in browser | Chat shows generic error and offers to scroll to the contact form. |
| Image asset missing | Page background falls back to a CSS gradient of `#06101d` -> `#0a1322`. |

## Testing approach

- **Manual smoke tests:**
  - Open `/` in dev, navigate to For Owners. Verify all six sections render at desktop and mobile widths.
  - Hover over the three path picker cards on desktop - 3D tilt fires.
  - Click each education tab - panel content swaps.
  - Open the chat pill - panel opens, suggestion chips visible.
  - Send a message with `GROQ_API_KEY` set - response appears within a few seconds.
  - Send a message without `GROQ_API_KEY` - fallback appears.
  - Send 9+ messages quickly - rate-limit fallback fires.
  - Send a 600-character message - length cap fires before Groq is called.
- **Type checking:** `npm run build` (which runs `tsc -b`) must pass cleanly.
- **No automated tests in v1** - this is a UI / content surface and the chat backend is small. Follow-on work can add Playwright smoke tests.

## Deployment

- Vite/Vercel auto-detection picks up `api/owner-chat.ts` as a serverless function with no extra config.
- User must add `GROQ_API_KEY` in Vercel project settings before chat works in production.
- A `vercel.json` file is **not** required - Vercel detects the `api/` folder and TypeScript automatically.

## Open questions for v2 / later

- Move rate limit + cache to Upstash KV so they survive function cold starts.
- Stream responses for faster perceived speed.
- Add chat to other pages (Rentals, Listings).
- Replace placeholder Unsplash images with original Penn Liberty photography.
- Lightweight analytics on which questions visitors ask most (informs FAQs and copy).

## Out of scope

- Lead routing to a CRM.
- Email automation when the form is submitted (current site uses `mailto:` and that stays).
- Multi-language support.
- Real-time presence ("agent online now") - the chat is AI, not human.
