create extension if not exists pgcrypto;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  invite_code_hash text,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (trip_id, nickname)
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null check (category in ('restaurant', 'cafe', 'shopping', 'tour', 'stay', 'etc')),
  name text not null,
  address text not null,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  image_url text,
  description text,
  created_by_member_id uuid not null references public.members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.place_comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete restrict,
  content text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

create index idx_members_trip_id on public.members(trip_id);
create index idx_places_trip_id on public.places(trip_id);
create index idx_places_category on public.places(category);
create index idx_place_comments_place_id on public.place_comments(place_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_places_updated_at
before update on public.places
for each row execute function public.set_updated_at();
