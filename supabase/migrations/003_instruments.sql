-- supabase/migrations/003_instruments.sql

-- ─── area_type Spalte ─────────────────────────────────────────────
alter table public.areas
  add column area_type text not null default 'regular'
  check (area_type in ('regular', 'instrument'));

-- Alle bestehenden Bereiche → 'regular'
update public.areas set area_type = 'regular';

-- ─── instruments Spalte auf users ────────────────────────────────
alter table public.users
  add column instruments text[] not null default '{}';

-- ─── user_favourites Tabelle ─────────────────────────────────────
create table public.user_favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  item_type text not null check (item_type in ('tutorial', 'ressource')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

alter table public.user_favourites enable row level security;

create policy "user_favourites: own rows"
  on public.user_favourites for all using (auth.uid() = user_id);

-- ─── Instrument-Bereiche für Worship ─────────────────────────────
insert into public.areas (program_id, name, slug, description, area_type, "order")
select p.id, a.aname, a.aslug, a.adesc, 'instrument', a.aord
from public.programs p
cross join (values
  ('Gitarre', 'gitarre', 'Akustik- und E-Gitarre', 1),
  ('Bass',    'bass',    'E-Bass',                  2),
  ('Keys',    'keys',    'Keyboard und Piano',       3),
  ('Drums',   'drums',   'Schlagzeug und Percussion',4),
  ('Gesang',  'gesang',  'Vocals und Chor',          5),
  ('Geige',   'geige',   'Violine',                  6)
) as a(aname, aslug, adesc, aord)
where p.slug = 'worship';
