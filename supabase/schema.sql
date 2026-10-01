-- Run once in the Supabase SQL Editor for Bullet Shitter account storage.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bullets (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source text not null default '',
  output text not null default '',
  rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  report_type text not null check (report_type in ('EPB','OPB')),
  report_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bullets_user_updated on public.bullets(user_id, updated_at desc);
create index if not exists idx_reports_user_updated on public.reports(user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.bullets enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bullets_owner_all" on public.bullets;
create policy "bullets_owner_all" on public.bullets for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reports_owner_all" on public.reports;
create policy "reports_owner_all" on public.reports for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.profiles from anon;
revoke all on public.bullets from anon;
revoke all on public.reports from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.bullets to authenticated;
grant select, insert, update, delete on public.reports to authenticated;
