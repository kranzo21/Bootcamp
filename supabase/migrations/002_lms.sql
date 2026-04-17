-- supabase/migrations/002_lms.sql

-- ─── Remove old schema ───────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.quiz_attempts;
drop table if exists public.material_views;
drop table if exists public.progress;
alter table public.users drop column if exists instruments;
alter table public.users drop column if exists path;

-- ─── Content tables ──────────────────────────────────────────────
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  "order" int not null default 0
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs on delete cascade not null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  "order" int not null default 0
);

create table public.tutorials (
  id uuid primary key default gen_random_uuid(),
  area_id uuid references public.areas on delete cascade not null,
  title text not null,
  video_url text not null,
  description text not null default '',
  "order" int not null default 0
);

create table public.lektionen (
  id uuid primary key default gen_random_uuid(),
  area_id uuid references public.areas on delete cascade not null,
  title text not null,
  description text not null default '',
  "order" int not null default 0
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  lektion_id uuid references public.lektionen on delete cascade not null,
  type text not null check (type in ('video', 'text')),
  title text not null,
  content text,
  video_url text,
  tutorial_id uuid references public.tutorials on delete set null,
  "order" int not null default 0
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lektion_id uuid references public.lektionen on delete cascade not null,
  question text not null,
  options jsonb not null,
  correct_index int not null check (correct_index between 0 and 3),
  "order" int not null default 0
);

create table public.ressourcen (
  id uuid primary key default gen_random_uuid(),
  area_id uuid references public.areas on delete cascade not null,
  title text not null,
  description text not null default '',
  url text not null,
  type text not null check (type in ('link', 'pdf', 'dokument')),
  "order" int not null default 0
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  lektion_id uuid references public.lektionen on delete cascade not null unique,
  name text not null,
  description text not null default '',
  icon text not null default '🏅'
);

create table public.qualifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default ''
);

create table public.qualification_badges (
  qualification_id uuid references public.qualifications on delete cascade not null,
  badge_id uuid references public.badges on delete cascade not null,
  primary key (qualification_id, badge_id)
);

-- ─── User activity tables ────────────────────────────────────────
create table public.user_programs (
  user_id uuid references public.users on delete cascade not null,
  program_id uuid references public.programs on delete cascade not null,
  enrolled_at timestamptz not null default now(),
  primary key (user_id, program_id)
);

create table public.lektion_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  lektion_id uuid references public.lektionen on delete cascade not null,
  materials_completed boolean not null default false,
  passed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, lektion_id)
);

create table public.material_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  material_id uuid references public.materials on delete cascade not null,
  viewed_at timestamptz not null default now(),
  unique (user_id, material_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  lektion_id uuid references public.lektionen on delete cascade not null,
  score float not null,
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  badge_id uuid references public.badges on delete cascade not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table public.user_qualifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  qualification_id uuid references public.qualifications on delete cascade not null,
  confirmed_by uuid references public.users on delete set null,
  confirmed_at timestamptz not null default now(),
  unique (user_id, qualification_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────
alter table public.programs enable row level security;
alter table public.areas enable row level security;
alter table public.tutorials enable row level security;
alter table public.lektionen enable row level security;
alter table public.materials enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.ressourcen enable row level security;
alter table public.badges enable row level security;
alter table public.qualifications enable row level security;
alter table public.qualification_badges enable row level security;
alter table public.user_programs enable row level security;
alter table public.lektion_progress enable row level security;
alter table public.material_views enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.user_badges enable row level security;
alter table public.user_qualifications enable row level security;

-- Content: all authenticated users can read; admins can write (via service role, bypasses RLS)
create policy "programs: authenticated read" on public.programs for select using (auth.uid() is not null);
create policy "areas: authenticated read" on public.areas for select using (auth.uid() is not null);
create policy "tutorials: authenticated read" on public.tutorials for select using (auth.uid() is not null);
create policy "lektionen: authenticated read" on public.lektionen for select using (auth.uid() is not null);
create policy "materials: authenticated read" on public.materials for select using (auth.uid() is not null);
create policy "quiz_questions: authenticated read" on public.quiz_questions for select using (auth.uid() is not null);
create policy "ressourcen: authenticated read" on public.ressourcen for select using (auth.uid() is not null);
create policy "badges: authenticated read" on public.badges for select using (auth.uid() is not null);
create policy "qualifications: authenticated read" on public.qualifications for select using (auth.uid() is not null);
create policy "qualification_badges: authenticated read" on public.qualification_badges for select using (auth.uid() is not null);

-- User activity: own rows only
create policy "user_programs: own rows" on public.user_programs for all using (auth.uid() = user_id);
create policy "lektion_progress: own rows" on public.lektion_progress for all using (auth.uid() = user_id);
create policy "material_views: own rows" on public.material_views for all using (auth.uid() = user_id);
create policy "quiz_attempts: own rows" on public.quiz_attempts for all using (auth.uid() = user_id);
create policy "user_badges: own rows" on public.user_badges for all using (auth.uid() = user_id);
create policy "user_qualifications: own rows" on public.user_qualifications for all using (auth.uid() = user_id);

-- Admins can read all user activity
create policy "user_programs: admin read" on public.user_programs for select using (public.is_admin());
create policy "lektion_progress: admin read" on public.lektion_progress for select using (public.is_admin());
create policy "material_views: admin read" on public.material_views for select using (public.is_admin());
create policy "quiz_attempts: admin read" on public.quiz_attempts for select using (public.is_admin());
create policy "user_badges: admin read" on public.user_badges for select using (public.is_admin());
create policy "user_qualifications: admin read" on public.user_qualifications for select using (public.is_admin());

-- ─── Updated trigger (no instruments/path) ───────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Unbekannt'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Seed data ───────────────────────────────────────────────────
insert into public.programs (name, slug, description, "order") values
  ('Worship', 'worship', 'Musikalische Ausbildung für Worship-Dienst', 1),
  ('Produktion', 'produktion', 'Technische Ausbildung für Produktionsteam', 2);

insert into public.areas (program_id, name, slug, description, "order")
select p.id, 'Gewächshaus', 'gewaechshaus', 'Strukturiertes Bootcamp für neue Musiker', 1
from public.programs p where p.slug = 'worship';

insert into public.areas (program_id, name, slug, description, "order")
select p.id, a.name, a.slug, a.desc, a.ord
from public.programs p
cross join (values
  ('Audio',  'audio',  'Tontechnik und Mischpult', 1),
  ('Video',  'video',  'Kameratechnik und Bildschnitt', 2),
  ('Beamer', 'beamer', 'Präsentation und Lyrik-Anzeige', 3),
  ('Licht',  'licht',  'Lichtsteuerung und -design', 4),
  ('Setup',  'setup',  'Aufbau und Abbau der Technik', 5)
) as a(name, slug, desc, ord)
where p.slug = 'produktion';
