-- SaltRock Schoolperience - Supabase schema
-- Run this in Supabase SQL Editor before using /api/inquiries and /api/calendar.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  organization_name text not null,
  program_interest text not null,
  preferred_date date,
  expected_students text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_inquiries_updated_at on public.inquiries;
create trigger trg_inquiries_updated_at
before update on public.inquiries
for each row
execute function public.set_updated_at();

create index if not exists idx_inquiries_created_at on public.inquiries (created_at desc);
create index if not exists idx_inquiries_status on public.inquiries (status);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  start_time text,
  end_time text,
  program_name text,
  organization_name text,
  location text,
  status text not null default 'scheduled',
  memo text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_calendar_events_updated_at on public.calendar_events;
create trigger trg_calendar_events_updated_at
before update on public.calendar_events
for each row
execute function public.set_updated_at();

create index if not exists idx_calendar_events_date on public.calendar_events (date asc);
create index if not exists idx_calendar_events_public_date on public.calendar_events (is_public, date asc);

-- RLS defaults
alter table public.inquiries enable row level security;
alter table public.calendar_events enable row level security;

-- Public schedule read policy (for future direct anon queries if needed)
drop policy if exists "Public can read public calendar events" on public.calendar_events;
create policy "Public can read public calendar events"
on public.calendar_events
for select
to anon, authenticated
using (is_public = true);

-- Admin mutations are done via service role key in server routes.
