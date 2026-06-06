# Claude Code Opus 4.8 Max — Master Build Script

## Penn Liberty Rentals Hero: Desktop Space Invaders (Pins = Shields Only)

Copy everything in the **TASK PROMPT** section below into Claude Code as the primary task prompt.

---

## How to use this file

1. Open this file in Cursor/VS Code: `penn-liberty-site/RENTALS-INVADERS-BUILD-SCRIPT.md`
2. Select all (`Ctrl+A`) inside the **TASK PROMPT** fenced block, or copy the whole file
3. Paste into Claude Code with Opus 4.8 Max in the `penn-liberty-site/` folder
4. Say: **"Execute Session 1, then continue through Session 4 without stopping unless build fails."**
5. If context runs out, resume with: **"Continue Rentals Invaders from Session N per RENTALS-INVADERS-BUILD-SCRIPT.md"**

**Cursor Agent one-liner:**

> Build desktop Rentals hero Space Invaders per RENTALS-INVADERS-BUILD-SCRIPT.md — pins = shields only, launcher bottom-right, full engine under `src/lib/rentalsInvaders/`, 4 sessions, `npm run build` each phase.

---

## TASK PROMPT (copy from here ↓)

# MISSION

You are implementing a **desktop-only Easter egg** on the Penn Liberty real estate website: a **full-featured Space Invaders** game embedded inside the **Rentals hero** section. Rental listing pins (floating physics chips) become **moving shield obstacles** — they block player AND enemy bullets but are NOT destroyable targets.

**Repository:** `penn-liberty-site/` (React 19 + Vite 7 + TypeScript + Tailwind 3)  
**Live site:** pennlibertyre.com  
**Scope:** Desktop only (`md+`, ≥768px). Mobile untouched.  
**Design lock:** Option 1 — pins are shields only (classic SI; pins never open rentals during game).

---

# NON-NEGOTIABLE RULES

1. **Do not break existing rentals UX** — browse mode, mobile cards, deep links, Apply flow must still work when game is inactive.
2. **Desktop only** — launcher + game hidden below `md`. Respect `prefers-reduced-motion: reduce` (hide launcher, same as physics pins).
3. **No new npm dependencies** unless absolutely required — prefer Canvas 2D + Web Audio API. No Phaser/Three.js unless you document why.
4. **Match existing code style** — `@/` path alias, functional React, minimal comments, focused diffs.
5. **Run `npm run build` before claiming done** — must pass with zero TS errors.
6. **Do not commit** unless user asks.
7. **Pins are NOT shootable** — bullets die on pin hit; pins stay; no rental detail opens from shooting pins.
8. **Game must be escapable** — ESC, visible Quit button, game over → return to browse.

---

# PROJECT CONTEXT (READ THESE FILES FIRST)

| File | Purpose |
|------|---------|
| `src/components/RentalsSection.tsx` | Rentals hero container (`heroRef`), collage, pins, `usePhysicsPins` gate |
| `src/components/RentalsHeroPhysics.tsx` | Zero-G floating pin layer (`hidden md:block`, z-20) |
| `src/lib/rentalHeroPhysics.ts` | `PhysicsBody`, `spawnPhysicsBodies`, `stepPhysicsSimulation` |
| `src/hooks/useRentalsHeroPhysicsMode.ts` | `usePhysicsPins`, `useStaticDesktopPins`, `isMobile` |
| `src/lib/data.ts` | `Rental` type, `initialRentals` inventory |
| `src/App.tsx` | Page routing; `[data-pl-no-page-swipe]` exempts areas from global swipe |
| `src/index.css` | `.rental-pin`, `.rental-pin--physics` styles |

**Hero container** (`RentalsSection.tsx` ~line 435):

- `relative isolate min-h-[420px] sm:min-h-[480px] md:min-h-[520px]`
- Rounded `rounded-[26px]`, Philadelphia mural background + collage overlays
- "Featured units" badge top-left (`z-[2]`)

**Current pin physics:**

```ts
export type PhysicsBody = {
  rentalId: number;
  x: number; y: number;
  vx: number; vy: number;
  radius: number; // default 54
};
```

Pins render as DOM buttons (`rental-pin-chip`, max-w ~11rem) centered on `(x, y)`.

**Brand colors:**

- Gold: `#d6b06a`, `#f4dfb4`, `#e4be78`
- Dark navy: `#0f1824`, `#08111f`, `#05101e`
- Accent blue (dev handles): `#5ec8ff`

---

# FEATURE OVERVIEW

## Browse mode (existing)

User sees mural + floating rental chips. Click chip → rental detail sheet.

## Game mode (new)

1. Small **Space Invaders launcher** bottom-right of hero (pixel-art invader icon).
2. Click → enter game. Hero dims slightly; canvas game layer activates.
3. Pins continue floating (slowed) as **moving asteroids/shields**.
4. Classic Space Invaders: player cannon, invader grid, bullets, lives, score, waves.
5. Bullets collide with pins (both sides) — bullet destroyed, pin unchanged.
6. ESC or Quit → exit game, restore browse mode.

**State flow:**

- Page load → Browse
- Click launcher → Game
- ESC / Quit / Game Over dismiss → Browse

---

# ARCHITECTURE (REQUIRED)

Create a **game engine module** separate from React render churn. React owns mode toggle + canvas mount; engine owns simulation.

## New file structure

```
src/lib/rentalsInvaders/
  constants.ts      # speeds, colors, wave tables, key codes
  types.ts          # GameState, Entity types, PinObstacle
  collision.ts      # circle/AABB tests, bullet-pin, bullet-invader
  entities.ts       # spawn waves, update player/invaders/bullets
  engine.ts         # fixed-timestep loop, state machine (menu/play/pause/over)
  render.ts         # canvas draw: sprites, HUD, particles
  audio.ts          # Web Audio procedural bleeps (no asset files required for Phase 1)
  sprites.ts        # pixel sprite bitmaps as Uint8 arrays OR draw procedurally
  pinBridge.ts      # read PhysicsBody[] → PinObstacle[] for collision

src/components/
  RentalsInvadersLauncher.tsx   # bottom-right button, hidden md:flex
  RentalsHeroInvadersGame.tsx   # canvas overlay, keyboard, game loop hookup

src/hooks/
  useRentalsInvadersMode.ts     # gameActive state, optional context
```

## Integration pattern

**Option A (preferred):** Lift shared world state into a small context or callback ref:

1. Refactor `RentalsHeroPhysics` to accept optional `mode: 'browse' | 'game'`:
   - `browse`: current behavior (repulsion, clicks open rental)
   - `game`: reduced drift (~25%), no repulsion, no click handlers, expose `bodiesRef` via `onBodiesUpdate` callback each frame OR `useImperativeHandle`

2. `RentalsSection` orchestrates:

```tsx
const [invadersActive, setInvadersActive] = useState(false);
// hero gets data-pl-no-page-swipe when game active
{usePhysicsPins && <RentalsHeroPhysics mode={invadersActive ? 'game' : 'browse'} ... />}
{usePhysicsPins && !prefersReducedMotion && (
  <RentalsInvadersLauncher onStart={() => setInvadersActive(true)} hidden={invadersActive} />
)}
{invadersActive && (
  <RentalsHeroInvadersGame
    heroRef={heroRef}
    getPinBodies={() => bodiesRef.current}
    onExit={() => setInvadersActive(false)}
  />
)}
```

**Option B:** Duplicate pin positions read from DOM — avoid if possible; physics ref is source of truth.

## Z-index stack (game active)

| Layer | z-index | pointer-events |
|-------|---------|----------------|
| Mural bg | 0 | none |
| Collage | 5–15 | none |
| Gradient | 1 | none |
| Featured badge → SCORE HUD | 2 / 40 | none / game HUD |
| Pin chips (shields) | 20 | none in game |
| Canvas game | 30 | auto |
| Launcher | 25 | auto (hidden in game) |
| Quit / Pause UI | 35 | auto |

Add `data-pl-no-page-swipe` on hero when game active (see `App.tsx` swipe handler).

---

# GAME DESIGN SPEC — "SUPER DETAILED" SPACE INVADERS

## Phase 1 — Playable classic (SHIP THIS FIRST)

### Player

- Cannon at bottom center, moves horizontally only
- Bounds: inside hero width, ~40px from bottom
- Speed: ~6 px/frame (scale to hero width)
- One player bullet on screen (classic) OR max 3 (config flag — default 1 for authenticity)
- Fire: Space; cooldown ~400ms
- 3 lives; death on enemy bullet or invader reaching bottom / collision with player

### Invaders

- Grid: **5 rows × 11 columns** (classic proportions, scaled to fit hero)
- Row point values: 30, 25, 20, 15, 10 (bottom to top)
- Movement: synchronized horizontal march, step down at edges, speed increases as invaders die
- Classic tempo: `speed = baseSpeed + (totalSpawned - aliveCount) * stepBoost`
- Animation: 2-frame sprite toggle on each horizontal step
- Enemy firing: random bottom-row invader shoots; frequency scales with wave + alive count
- Max 3 enemy bullets on screen

### UFO (bonus)

- Random spawn every 20–40 seconds during wave
- Moves across top; shooting awards 50/100/150 random
- Distinct sound

### Waves

- Clear all invaders → next wave; invaders step faster each wave
- Wave 1 complete → wave 2 with slightly lower starting positions or faster march

### Bullets

- Player bullet: upward, fast
- Enemy bullet: downward, slower, optional slight zigzag on wave 3+ (Phase 2)

### Pin obstacles (THE TWIST)

- Each `PhysicsBody` → collision circle `radius` (54px) OR tight rounded-rect fit to chip (~88×48 px) — **circle is fine for Phase 1**
- Every frame: test all active bullets against all pins
- On hit: bullet `active = false`, spawn 3–6 particle sparks at impact; pin unaffected
- Pins keep slow physics drift in game mode (see pinBridge)
- **Invaders do not collide with pins** (they fly above pin zone) — only bullets interact with pins

### HUD

- Top: `SCORE: 0000` (replace or supplement "Featured units" in game mode)
- Lives icons bottom-left (3 ships)
- Wave number top-right
- Semi-transparent dark vignette on mural during play

### Controls

| Key | Action |
|-----|--------|
| ← → or A D | Move |
| Space | Fire |
| P | Pause |
| Esc | Quit to browse |

Prevent default on these keys while game focused to avoid page scroll.

### End states

- **Game Over:** player lives = 0 → overlay "GAME OVER" + final score + "Play Again" + "Quit"
- **Quit:** restores browse mode, pins clickable again

---

## Phase 2 — Juice & authenticity

- **Canvas internal resolution:** 2× hero size, `imageSmoothingEnabled = false` for crisp pixels
- **Procedural sprites:** 8×8 or 11×8 invader frames, player ship, UFO (gold/navy palette)
- **Sounds (Web Audio):**
  - Player shoot: short square wave blip
  - Invader step: bass thump, tempo tied to march speed
  - Explosion: noise burst
  - UFO: warbling tone
  - Game over: descending arpeggio
- **Particles:** invader death = 8–12 pixel debris; pin block = small gold sparks
- **Screen shake** on player death (translate canvas 2–4px, 200ms)
- **High score:** `localStorage` key `pl-rentals-invaders-hs`
- **CRT overlay:** optional faint scanlines at 8% opacity

---

## Phase 3 — Polish

- Start screen: "PRESS SPACE TO START" blinking 1.5s after launcher click
- March speed algorithm matches 1978 feel (document formula in constants.ts)
- Enemy bullet aimed at player on wave 5+ (30% chance)
- Pause menu with blur backdrop
- Launcher idle animation: 2-frame invader bob on 1s loop

---

# PIN PHYSICS IN GAME MODE

Modify `stepPhysicsSimulation` OR wrap it in `pinBridge.ts`:

```ts
// Game mode overrides
GAME_DRIFT_STRENGTH = 0.004   // ~25% of browse
GAME_REPULSION = false
GAME_PIN_COLLISION = true     // pins still bounce off each other
GAME_MAX_SPEED = 1.8
```

Browse mode unchanged when `invadersActive === false`.

---

# LAUNCHER UI SPEC

**Component:** `RentalsInvadersLauncher.tsx`

- Position: `absolute right-4 bottom-4 z-[25] hidden md:inline-flex`
- Size: ~40×40px hit area
- Visual: pixel invader (canvas or CSS box-shadow pixels), gold on dark circle
- Subtle pulse animation (respect reduced motion — static if `prefers-reduced-motion`)
- `aria-label="Play Space Invaders"`
- Tooltip on hover: "Play" (title attribute)
- Only render when `usePhysicsPins === true` (no physics = no game)

---

# COLLISION IMPLEMENTATION NOTES

```ts
// collision.ts
function circleHitsCircle(ax, ay, ar, bx, by, br): boolean
function pointInCircle(px, py, cx, cy, r): boolean
function bulletHitsPin(bullet, pin: PhysicsBody): boolean
function bulletHitsInvader(bullet, invader): boolean
function rectOverlapsCircle(rx, ry, rw, rh, cx, cy, cr): boolean // optional tighter pin hitbox
```

Run collision after entity position updates each tick. Order:

1. Move entities
2. Bullet-pin (destroy bullets)
3. Bullet-invader (destroy both, add score)
4. Bullet-player (damage player)
5. Check invader descent / player collision

---

# PERFORMANCE

- One `requestAnimationFrame` loop when game active; **do not** run browse physics repulsion in same frame at full cost — game mode uses reduced pin step
- Pool bullets (max 4 player + 4 enemy objects, reuse)
- No React setState per frame — mutate engine state, draw canvas only
- DPR-aware canvas sizing on resize (ResizeObserver on hero)

---

# ACCESSIBILITY

- Launcher is keyboard-focusable (`tabIndex={0}`, Enter starts game)
- Game canvas `role="application"` `aria-label="Space Invaders mini game"`
- ESC always exits
- `prefers-reduced-motion`: do not render launcher

---

# TESTING CHECKLIST (RUN BEFORE DONE)

- [ ] `npm run build` passes
- [ ] Desktop: launcher visible bottom-right on Rentals page
- [ ] Mobile (<768px): no launcher, no game
- [ ] Click launcher → game starts, pins still visible and drifting slowly
- [ ] Player can move and fire; invaders march and shoot
- [ ] Player bullet hits pin → bullet vanishes, pin OK
- [ ] Enemy bullet hits pin → bullet vanishes
- [ ] Shooting invader → score increases, invader dies
- [ ] Wave clears → next wave faster
- [ ] Player death → lives decrement; 0 lives → game over
- [ ] ESC / Quit → browse mode, pin clicks open rental detail again
- [ ] Reduced motion desktop → no launcher
- [ ] Dev Visual Editor still works (game inactive by default)
- [ ] No console errors during 2-minute play session

---

# IMPLEMENTATION ORDER (STRICT)

**PR 1 / Session 1:**

1. `RentalsInvadersLauncher` + `invadersActive` state in `RentalsSection`
2. `RentalsHeroInvadersGame` empty canvas + ESC quit
3. Player movement + firing on canvas (no invaders yet)
4. `npm run build`

**PR 2 / Session 2:**

5. Full invader grid + march + enemy bullets + scoring + lives
6. Wave progression + game over screen
7. `npm run build`

**PR 3 / Session 3:**

8. `pinBridge` + bullet-pin collision
9. `RentalsHeroPhysics` game mode (slow drift, no clicks)
10. `npm run build`

**PR 4 / Session 4:**

11. Audio + particles + sprites + high score
12. Final playtest + tune speeds for ~520px tall hero
13. `npm run build`

---

# WHAT NOT TO DO

- Do not make pins destructible or open rentals when shot
- Do not show launcher on mobile
- Do not add game to Listings/Sales/Owners heroes
- Do not store game state in URL/query params
- Do not use `alert()` for game over
- Do not block entire page scroll outside hero — only capture keys when game active
- Do not remove existing `rentalPinOffsetsBySrc` or dev pin mode

---

# REFERENCE: CLASSIC SPACE INVADERS BEHAVIOR

- Invaders move as a block; when any hits wall, entire formation drops ~8px and reverses direction
- Only bottom-most invader per column can shoot (classic)
- Invader explosion freezes briefly (~100ms) for satisfaction
- Player bullet travels ~2× faster than enemy bullet
- UFO spawn independent of wave clear

---

# DELIVERABLE

When complete, provide:

1. List of files created/modified
2. How to play (controls)
3. Known limitations / Phase 4 ideas
4. Confirmation `npm run build` output

Begin with **Phase 1 / Session 1** after reading all files listed in PROJECT CONTEXT. Ask no clarifying questions — design is locked (Option 1: pins = shields only).

## TASK PROMPT (copy to here ↑)
