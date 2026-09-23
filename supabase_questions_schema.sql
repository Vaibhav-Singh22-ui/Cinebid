create extension if not exists pgcrypto;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A','B','C','D')),
  hint_text text not null,
  level int not null check (level between 1 and 15),
  color text not null check (color in ('RED','BLUE','GREEN','YELLOW','PINK','VIOLET')),
  category text not null,
  difficulty text not null check (difficulty in ('EASY','MEDIUM','HARD')),
  expected_solve_seconds int not null check (expected_solve_seconds between 1 and 60),
  verification_status text not null default 'NEEDS_HUMAN_REVIEW',
  active boolean not null default false,
  source_type text,
  source_reference text,
  times_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists questions_level_color_active_idx
  on public.questions(level, color, active);

create index if not exists questions_verification_idx
  on public.questions(verification_status);

alter table public.questions enable row level security;
