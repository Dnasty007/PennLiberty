# NOTE — Penn Liberty Rentals Hero Space Invaders

**For:** Claude Code Opus 4.8 Max  
**Repo:** `penn-liberty-site/`  
**Paste this whole note as your task.**

---

## THE IDEA

Desktop-only Easter egg on the **Rentals hero** (the big mural card).

- Tiny Space Invaders icon — **bottom-right** of hero
- User clicks → classic Space Invaders starts **inside the hero**
- Rental pins (floating chips) = **moving shields** — block bullets, never get destroyed
- Pins are **NOT targets** — shooting them does nothing except stop the bullet
- Mobile: **no game, no launcher**
- ESC / Quit always gets you back to normal browsing

**Design locked:** Option 1 — shields only.

---

## STACK

- React 19 + Vite 7 + TypeScript + Tailwind 3
- Canvas 2D for game (no new npm packages if possible)
- Web Audio for bleeps (Phase 2+)
- `@/` imports, match existing code style

**Brand colors**

- Gold `#d6b06a` / `#f4dfb4`
- Navy `#0f1824` / `#08111f`

---

## READ FIRST

- `src/components/RentalsSection.tsx` — hero box, `heroRef`
- `src/components/RentalsHeroPhysics.tsx` — floating pins (desktop)
- `src/lib/rentalHeroPhysics.ts` — `PhysicsBody` (x, y, vx, vy, radius: 54)
- `src/hooks/useRentalsHeroPhysicsMode.ts` — desktop + reduced-motion gates
- `src/App.tsx` — add `data-pl-no-page-swipe` on hero when game is on

---

## TWO MODES

**Browse (today)**

- Pins float in zero-G
- Click pin → rental detail

**Game**

- Launcher hidden
- Canvas on top (z-30)
- Pins drift slow, no clicks
- Bullets hit pins → bullet dies, pin lives
- Game over / ESC → back to browse

---

## LAUNCHER

- Component: `RentalsInvadersLauncher.tsx`
- `absolute right-4 bottom-4 z-[25] hidden md:inline-flex`
- ~40px pixel invader, gold on dark
- Only if `usePhysicsPins` and NOT `prefers-reduced-motion`
- `aria-label="Play Space Invaders"`

---

## NEW FILES

```
src/lib/rentalsInvaders/
  constants.ts
  types.ts
  collision.ts
  entities.ts
  engine.ts
  render.ts
  audio.ts
  sprites.ts
  pinBridge.ts

src/components/
  RentalsInvadersLauncher.tsx
  RentalsHeroInvadersGame.tsx
```

---

## WIRING (RentalsSection)

- State: `invadersActive`
- Physics: `mode="browse" | "game"` on `RentalsHeroPhysics`
- Game mode: slow drift, no repulsion, no pin clicks, expose bodies to game each frame
- When game on: `data-pl-no-page-swipe` on hero

---

## GAME — PHASE 1 (ship first)

**Player**

- Cannon bottom center, move ← → or A D
- Space = fire (1 bullet on screen, classic)
- 3 lives

**Invaders**

- 5 rows × 11 columns
- March side to side, drop at walls, speed up as they die
- Bottom-row shooters only, max 3 enemy bullets
- Points: 30 / 25 / 20 / 15 / 10 by row

**Pins**

- Circle hitbox radius 54 from `PhysicsBody`
- Player + enemy bullets die on contact
- Invaders do NOT collide with pins

**HUD**

- Score top, lives bottom-left, wave top-right
- Dim mural slightly

**Controls**

- ← → / A D move
- Space fire
- P pause
- Esc quit

**End**

- Game over at 0 lives → Play Again + Quit
- `npm run build` must pass

---

## GAME — PHASE 2 (juice)

- 2× canvas, pixel sprites, no smoothing
- Sounds: shoot, step, explode, UFO, game over
- Particles on kill + pin block
- Screen shake on death
- High score → `localStorage` key `pl-rentals-invaders-hs`

---

## GAME — PHASE 3 (polish)

- "PRESS SPACE TO START"
- UFO bonus (50/100/150 pts)
- Launcher idle 2-frame bob
- Pause overlay

---

## PIN PHYSICS IN GAME

- Drift ~25% of browse (`0.004`)
- No mouse repulsion
- Pins still bounce off each other
- Max speed ~1.8

---

## Z-INDEX

- Mural 0
- Pins 20
- Launcher 25
- Canvas 30
- Quit/HUD 35

---

## RULES — DO NOT

- Break mobile rentals
- Make pins shootable
- Open rentals from game
- Add deps without reason
- Commit unless asked
- Use `alert()` for game over

---

## BUILD ORDER

1. Launcher + toggle + empty canvas + ESC quit + player move/fire → build
2. Full invaders + waves + score + lives + game over → build
3. Pin collision + physics game mode → build
4. Audio + particles + sprites + high score → build

**Kickoff line for Claude Code:**

> Execute Session 1–4 per RENTALS-INVADERS-NOTES.md. Pins = shields only. `npm run build` after each session.

---

## TEST BEFORE DONE

- [ ] Launcher bottom-right desktop only
- [ ] No launcher mobile / reduced-motion
- [ ] Bullets blocked by pins both ways
- [ ] Invaders killable, pins not
- [ ] ESC returns to browse, pins clickable again
- [ ] `npm run build` clean

---

*Full detail version also at `RENTALS-INVADERS-BUILD-SCRIPT.md`*
