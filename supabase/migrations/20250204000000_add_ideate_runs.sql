-- Enable UUID generation
create extension if not exists "pgcrypto";

create table if not exists public.ideate_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id text not null,
  headline text not null,
  narrative text not null,
  quick_takes jsonb not null default '[]'::jsonb,
  risks text[] not null default '{}'::text[],
  opportunities text[] not null default '{}'::text[],
  suggestions jsonb not null default '[]'::jsonb,
  experiments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideate_pillar_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ideate_runs(id) on delete cascade,
  pillar_id text not null,
  name text not null,
  score numeric not null,
  delta numeric,
  summary text,
  opportunities text[] not null default '{}'::text[],
  risks text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists ideate_runs_project_id_idx on public.ideate_runs(project_id);
create index if not exists ideate_runs_user_id_idx on public.ideate_runs(user_id);
create index if not exists ideate_pillar_snapshots_run_id_idx on public.ideate_pillar_snapshots(run_id);
