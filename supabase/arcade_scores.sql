-- Penn Liberty Arcade — Hall of Fame
-- Run this in Supabase → SQL Editor (free project is fine)

create table if not exists public.arcade_scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  initials text not null check (char_length(initials) = 3),
  score integer not null check (score > 0 and score < 100000000),
  created_at timestamptz not null default now()
);

create index if not exists arcade_scores_game_score_idx
  on public.arcade_scores (game_id, score desc);

create index if not exists arcade_scores_created_idx
  on public.arcade_scores (created_at desc);

alter table public.arcade_scores enable row level security;

-- Anyone can read the board
drop policy if exists "Arcade scores are public read" on public.arcade_scores;
create policy "Arcade scores are public read"
  on public.arcade_scores for select
  using (true);

-- Anyone can post a score (client uses anon key)
drop policy if exists "Arcade scores insert open" on public.arcade_scores;
create policy "Arcade scores insert open"
  on public.arcade_scores for insert
  with check (
    char_length(initials) = 3
    and score > 0
    and score < 100000000
  );

-- No update/delete from public anon (keep the cabinet honest)
