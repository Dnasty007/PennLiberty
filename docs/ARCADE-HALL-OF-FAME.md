# Penn Liberty Arcade — Hall of Fame setup

Global high scores so anyone who finds the Time Cabinet can challenge the city.

## What players get

- **Local HI-SCORE** — still saves per browser (instant, private best)
- **Hall of Fame** — public top scores with **3-letter initials**
- Hub tab **HALL OF FAME** (or press **H**)
- Game over → **SUBMIT SCORE** → initials → live board

## One-time setup (~5 minutes, free)

### 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) → New project  
2. Pick a password, region close to you (e.g. US East)  
3. Wait for the project to finish provisioning  

### 2. Create the scores table

1. In Supabase: **SQL Editor** → New query  
2. Paste everything from `supabase/arcade_scores.sql`  
3. Run it  

### 3. Copy keys into the site

1. Supabase → **Project Settings** → **API**  
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

**Local (`.env.local`):**

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

**Production (Vercel / build machine):** same two vars, then rebuild & deploy.

> These are **public** browser keys. Safety comes from **Row Level Security** in the SQL file (read + insert only; no edit/delete).

### 4. Restart dev server & test

```bash
npm run dev
```

1. Open `/rentals` (desktop) → INSERT COIN  
2. Tab should say **HALL OF FAME · LIVE**  
3. Play any game → game over → enter initials → **SUBMIT SCORE**  
4. Open Hall of Fame → your name on the board  

## Without Supabase

Everything still works. Hall of Fame tab shows a “setup” note. Local high scores keep saving on each machine.

## Privacy

Only **3 initials + score + game + timestamp** are stored. No email, no name, no IP in the table.

## Ops tips

- Watch the table in Supabase → **Table Editor** → `arcade_scores`  
- Delete spam rows manually if needed  
- Soft score caps live in `src/lib/arcade/hallOfFame.ts` (`SCORE_CAP`)
