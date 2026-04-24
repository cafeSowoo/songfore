create table if not exists public.place_saves (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (place_id, member_id)
);

create table if not exists public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_id text not null,
  time text not null,
  entry_type text not null check (entry_type in ('place', 'note')),
  place_id uuid references public.places(id) on delete cascade,
  title text,
  created_by_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (entry_type = 'place' and place_id is not null)
    or
    (entry_type = 'note' and title is not null and btrim(title) <> '')
  )
);

create index if not exists idx_place_saves_place_id on public.place_saves(place_id);
create index if not exists idx_place_saves_member_id on public.place_saves(member_id);
create index if not exists idx_schedule_entries_trip_id on public.schedule_entries(trip_id);
create index if not exists idx_schedule_entries_place_id on public.schedule_entries(place_id);

alter table public.place_saves enable row level security;
alter table public.schedule_entries enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_schedule_entries_updated_at'
      and tgrelid = 'public.schedule_entries'::regclass
  ) then
    create trigger trg_schedule_entries_updated_at
    before update on public.schedule_entries
    for each row execute function public.set_updated_at();
  end if;
end
$$;
