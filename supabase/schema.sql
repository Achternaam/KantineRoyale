-- Kantine Royale: tabellen voor accounts, ranglijst en meldingen.
-- Plak dit in Supabase onder SQL Editor en klik op Run. Je kunt het veilig vaker draaien:
-- bestaande gegevens blijven staan en ontbrekende kolommen worden toegevoegd.
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
alter table public.accounts add column if not exists recovery_hash text;          -- herstelcode voor een vergeten wachtwoord
alter table public.accounts add column if not exists friends text[] not null default '{}';
alter table public.accounts add column if not exists banned boolean not null default false;

create table if not exists public.leaderboard (
  week text not null,
  name text not null,
  points integer not null default 0,
  wins integer not null default 0,
  games integer not null default 0,
  primary key (week, name)
);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter text not null,
  target text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
alter table public.leaderboard enable row level security;
alter table public.reports enable row level security;

grant all on table public.accounts to service_role;
grant all on table public.leaderboard to service_role;
grant all on table public.reports to service_role;
grant usage, select on all sequences in schema public to service_role;
