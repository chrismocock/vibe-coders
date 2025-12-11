-- Create table to store AI idea refinements
create table if not exists public.idea_improvements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  pillar_improved text not null,
  before_text text,
  after_text text,
  score_delta int,
  created_at timestamptz not null default now(),
  constraint fk_project foreign key (project_id) references public.projects (id) on delete cascade
);

create index if not exists idx_idea_improvements_project on public.idea_improvements(project_id);

