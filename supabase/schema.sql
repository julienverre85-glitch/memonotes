-- ============================================
-- MÉMO — Schéma Supabase
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================

-- 1. Table des notes
create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  content       text,
  importance    integer not null default 1 check (importance between 1 and 4),
  cats          jsonb default '[]',
  reminder_at   timestamptz,
  email_notify  boolean default true,
  push_notify   boolean default true,
  reminder_sent boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists notes_reminder_idx
  on public.notes (reminder_at, reminder_sent)
  where reminder_at is not null and reminder_sent = false;

alter table public.notes enable row level security;

drop policy if exists "notes_user_policy" on public.notes;
create policy "notes_user_policy" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Table des abonnements push
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  auth       text not null,
  p256dh     text not null,
  created_at timestamptz default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_user_policy" on public.push_subscriptions;
create policy "push_user_policy" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Table des paramètres utilisateur (catégories personnalisées)
create table if not exists public.user_settings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade unique,
  categories  jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "settings_user_policy" on public.user_settings;
create policy "settings_user_policy" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. Trigger updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

drop trigger if exists settings_updated_at on public.user_settings;
create trigger settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();
