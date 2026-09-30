-- Kantine Royale: tabellen voor accounts en de ranglijst.
-- Plak dit één keer in Supabase onder SQL Editor en klik op Run.
-- Alleen de gameserver (met de geheime sleutel) kan erbij: RLS staat aan zonder regels voor anderen.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,          -- kleine letters, om op in te loggen
  display text not null,                  -- de naam zoals hij in het spel staat
  pass_hash text not null,
  pass_salt text not null,
  tokens text[] not null default '{}',    -- hashes van ingelogde apparaten
  progress jsonb not null default '{}',   -- munten, skins, battlepass, accessoires
  stats jsonb not null default '{}',
  daily jsonb not null default '{}',
  rank_points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.leaderboard (
  week text not null,
  name text not null,
  points integer not null default 0,
  wins integer not null default 0,
  games integer not null default 0,
  primary key (week, name)
);

alter table public.accounts enable row level security;
alter table public.leaderboard enable row level security;

grant all on table public.accounts to service_role;
grant all on table public.leaderboard to service_role;
