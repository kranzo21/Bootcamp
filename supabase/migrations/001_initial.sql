-- Users profile (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  instruments text[] not null default '{}',
  path text not null check (path in ('instrumentalist', 'vocals', 'drums')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Progress per module
create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  module_id text not null,
  track text not null check (track in ('theologie', 'theorie')),
  materials_completed boolean not null default false,
  passed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, module_id, track)
);

-- Individual material views
create table public.material_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  module_id text not null,
  material_id text not null,
  viewed_at timestamptz not null default now(),
  unique (user_id, module_id, material_id)
);

-- Quiz attempts
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  module_id text not null,
  score float not null,
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

-- Row Level Security
alter table public.users enable row level security;
alter table public.progress enable row level security;
alter table public.material_views enable row level security;
alter table public.quiz_attempts enable row level security;

-- Users: can read/update own row; admins can read all
create policy "users: own row" on public.users
  for all using (auth.uid() = id);

create policy "users: admin read all" on public.users
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Progress: own rows; admins can read all
create policy "progress: own rows" on public.progress
  for all using (auth.uid() = user_id);

create policy "progress: admin read all" on public.progress
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Material views: own rows; admins read all
create policy "material_views: own rows" on public.material_views
  for all using (auth.uid() = user_id);

create policy "material_views: admin read all" on public.material_views
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Quiz attempts: own rows; admins read all
create policy "quiz_attempts: own rows" on public.quiz_attempts
  for all using (auth.uid() = user_id);

create policy "quiz_attempts: admin read all" on public.quiz_attempts
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Trigger: auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, instruments, path)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    '{}',
    'instrumentalist'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
