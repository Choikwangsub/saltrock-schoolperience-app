-- SaltRock Schoolperience - Gallery / Inquiry / Calendar / Notion sync schema
-- Execute manually in Supabase SQL Editor.

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

-- 1) gallery_albums
create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  program_slug text not null,
  event_date date,
  location text,
  description text,
  cover_image_url text,
  is_public boolean not null default false,
  notion_page_id text,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'failed')),
  sync_error text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.gallery_albums
  add column if not exists sync_status text default 'pending';
alter table if exists public.gallery_albums
  add column if not exists sync_error text;
alter table if exists public.gallery_albums
  add column if not exists synced_at timestamptz;

drop trigger if exists trg_gallery_albums_updated_at on public.gallery_albums;
create trigger trg_gallery_albums_updated_at
before update on public.gallery_albums
for each row
execute function public.set_updated_at();

create index if not exists idx_gallery_albums_program_slug on public.gallery_albums (program_slug);
create index if not exists idx_gallery_albums_event_date on public.gallery_albums (event_date desc);
create index if not exists idx_gallery_albums_is_public on public.gallery_albums (is_public);
create index if not exists idx_gallery_albums_sync_status on public.gallery_albums (sync_status);

-- 2) gallery_photos
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums(id) on delete cascade,
  program_slug text not null,
  image_url text not null,
  title text,
  description text,
  taken_at date,
  sort_order integer not null default 0,
  is_public boolean not null default false,
  notion_page_id text,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'failed')),
  sync_error text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.gallery_photos
  add column if not exists sync_status text default 'pending';
alter table if exists public.gallery_photos
  add column if not exists sync_error text;
alter table if exists public.gallery_photos
  add column if not exists synced_at timestamptz;

drop trigger if exists trg_gallery_photos_updated_at on public.gallery_photos;
create trigger trg_gallery_photos_updated_at
before update on public.gallery_photos
for each row
execute function public.set_updated_at();

create index if not exists idx_gallery_photos_album_id on public.gallery_photos (album_id);
create index if not exists idx_gallery_photos_program_slug on public.gallery_photos (program_slug);
create index if not exists idx_gallery_photos_is_public on public.gallery_photos (is_public);
create index if not exists idx_gallery_photos_sort_order on public.gallery_photos (sort_order asc);
create index if not exists idx_gallery_photos_sync_status on public.gallery_photos (sync_status);

-- 3) inquiries
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  program_slug text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
  notion_page_id text,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'failed')),
  sync_error text,
  synced_at timestamptz,
  -- compatibility fields for current contact/hub UI
  organization_name text,
  program_interest text,
  preferred_date date,
  expected_students text,
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.inquiries
  add column if not exists sync_status text default 'pending';
alter table if exists public.inquiries
  add column if not exists sync_error text;
alter table if exists public.inquiries
  add column if not exists synced_at timestamptz;

drop trigger if exists trg_inquiries_updated_at on public.inquiries;
create trigger trg_inquiries_updated_at
before update on public.inquiries
for each row
execute function public.set_updated_at();

create index if not exists idx_inquiries_created_at on public.inquiries (created_at desc);
create index if not exists idx_inquiries_status on public.inquiries (status);
create index if not exists idx_inquiries_program_slug on public.inquiries (program_slug);
create index if not exists idx_inquiries_sync_status on public.inquiries (sync_status);

-- 4) calendar_events
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  program_slug text,
  event_date date not null,
  start_time text,
  end_time text,
  location text,
  description text,
  is_public boolean not null default false,
  status text not null default 'scheduled',
  notion_page_id text,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'failed')),
  sync_error text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.calendar_events
  add column if not exists sync_status text default 'pending';
alter table if exists public.calendar_events
  add column if not exists sync_error text;
alter table if exists public.calendar_events
  add column if not exists synced_at timestamptz;

drop trigger if exists trg_calendar_events_updated_at on public.calendar_events;
create trigger trg_calendar_events_updated_at
before update on public.calendar_events
for each row
execute function public.set_updated_at();

create index if not exists idx_calendar_events_event_date on public.calendar_events (event_date asc);
create index if not exists idx_calendar_events_is_public on public.calendar_events (is_public);
create index if not exists idx_calendar_events_program_slug on public.calendar_events (program_slug);
create index if not exists idx_calendar_events_sync_status on public.calendar_events (sync_status);

-- 5) notion_database_map
create table if not exists public.notion_database_map (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  notion_database_id text not null,
  name text,
  sync_status text default 'synced',
  sync_error text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.notion_database_map
  add column if not exists sync_status text default 'synced';
alter table if exists public.notion_database_map
  add column if not exists sync_error text;
alter table if exists public.notion_database_map
  add column if not exists synced_at timestamptz;

drop trigger if exists trg_notion_database_map_updated_at on public.notion_database_map;
create trigger trg_notion_database_map_updated_at
before update on public.notion_database_map
for each row
execute function public.set_updated_at();

-- RLS
alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.inquiries enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notion_database_map enable row level security;

-- Public read policies (website visitors)
drop policy if exists "Public can read public gallery albums" on public.gallery_albums;
create policy "Public can read public gallery albums"
on public.gallery_albums
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "Public can read public gallery photos" on public.gallery_photos;
create policy "Public can read public gallery photos"
on public.gallery_photos
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "Public can read public calendar events" on public.calendar_events;
create policy "Public can read public calendar events"
on public.calendar_events
for select
to anon, authenticated
using (is_public = true);

-- Storage bucket: gallery
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = excluded.public;

-- Public read for gallery bucket objects
drop policy if exists "Public can read gallery objects" on storage.objects;
create policy "Public can read gallery objects"
on storage.objects
for select
to public
using (bucket_id = 'gallery');

-- Optional service_role explicit policy (service key generally bypasses RLS)
drop policy if exists "Service role full access to gallery objects" on storage.objects;
create policy "Service role full access to gallery objects"
on storage.objects
as permissive
for all
to service_role
using (bucket_id = 'gallery')
with check (bucket_id = 'gallery');
