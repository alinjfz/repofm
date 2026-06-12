create extension if not exists "pgcrypto";

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  repo_url text not null,
  repo_name text not null,
  repo_description text,
  template text not null,
  script jsonb not null,
  audio_url text,
  created_at timestamptz not null default now()
);

alter table public.episodes enable row level security;

drop policy if exists "Episodes are publicly readable" on public.episodes;
create policy "Episodes are publicly readable"
on public.episodes
for select
using (true);

drop policy if exists "Service role can insert episodes" on public.episodes;
create policy "Service role can insert episodes"
on public.episodes
for insert
with check (true);

drop policy if exists "Service role can delete episodes" on public.episodes;
create policy "Service role can delete episodes"
on public.episodes
for delete
using (true);

create index if not exists episodes_user_id_created_at_idx
on public.episodes (user_id, created_at desc);

-- Create a public Storage bucket named "episodes" in Supabase dashboard:
-- Storage -> New bucket -> name: episodes -> Public bucket: enabled.
