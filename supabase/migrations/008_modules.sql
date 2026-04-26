-- supabase/migrations/008_modules.sql

-- 1. Tabelle modules erstellen
create table if not exists public.modules (
  id uuid default gen_random_uuid() primary key,
  area_id uuid references public.areas(id) on delete cascade not null,
  name text not null,
  description text,
  "order" integer not null default 0,
  created_at timestamptz default now()
);

alter table public.modules enable row level security;

create policy "modules: authenticated read"
  on public.modules for select
  using (auth.uid() is not null);

create policy "modules: admin all"
  on public.modules for all
  using (public.is_admin());

-- 2. module_id zu lektionen hinzufügen
alter table public.lektionen
  add column if not exists module_id uuid references public.modules(id) on delete set null;

-- 3. Drei Module für Gewächshaus anlegen
with area as (
  select id from public.areas where slug = 'gewaechshaus'
)
insert into public.modules (area_id, name, description, "order")
values
  ((select id from area), 'Identität & Haltung',  'Theologische Grundlagen und Haltung als Worship-Team-Mitglied', 1),
  ((select id from area), 'Musiktheorie',          'Musikalische Grundlagen und Vorbereitung', 2),
  ((select id from area), 'Praxis & Tools',        'Werkzeuge und praktische Vorbereitung für den Dienst', 3);

-- 4. Bestehende Lektionen den Modulen zuordnen
-- Modul 1: Identität & Haltung
update public.lektionen set module_id = (
  select m.id from public.modules m
  join public.areas a on m.area_id = a.id
  where a.slug = 'gewaechshaus' and m."order" = 1
)
where area_id = (select id from public.areas where slug = 'gewaechshaus')
  and (
    title ilike '%Einleitung%'
    or title ilike '%Identität als Anbeter%'
    or title ilike '%Stiftshütte%'
    or title ilike '%Gegenwart Gottes%'
    or title ilike '%Bühnenpräsenz%'
    or title ilike '%Dresscode%'
  );

-- Modul 2: Musiktheorie
update public.lektionen set module_id = (
  select m.id from public.modules m
  join public.areas a on m.area_id = a.id
  where a.slug = 'gewaechshaus' and m."order" = 2
)
where area_id = (select id from public.areas where slug = 'gewaechshaus')
  and (
    title ilike '%Musiktheorie%'
    or title ilike '%Einsingen%'
  );

-- Modul 3: Praxis & Tools
update public.lektionen set module_id = (
  select m.id from public.modules m
  join public.areas a on m.area_id = a.id
  where a.slug = 'gewaechshaus' and m."order" = 3
)
where area_id = (select id from public.areas where slug = 'gewaechshaus')
  and (
    title ilike '%ChurchTools%'
    or title ilike '%Google Drive%'
  );

-- 5. Nicht mehr benötigte Lektionen löschen
delete from public.lektionen
where area_id = (select id from public.areas where slug = 'gewaechshaus')
  and (
    title ilike '%In-Ear%'
    or title ilike '%Bandworkshop%'
  );
