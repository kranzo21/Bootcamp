# Ecclesia LMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Gewächshaus app into a full database-driven LMS with programs, areas, lektionen, tutorials, ressourcen, badges, and qualifications.

**Architecture:** All content lives in Supabase (no JSON files). Regular anon client for reads/user activity (RLS). Service role client for admin writes. Next.js App Router server components for data fetching, client components only for interactive UI.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + RLS), Vercel.

---

## Task 1: Database Migration

**Files:**

- Create: `supabase/migrations/002_lms.sql`

- [ ] **Step 1: Create migration file**

```sql
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
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Gehe auf https://supabase.com → dein Projekt → SQL Editor → New query.
Füge den kompletten Inhalt von `supabase/migrations/002_lms.sql` ein und klicke **Run**.
Erwartung: `Success. No rows returned`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_lms.sql
git commit -m "feat: add LMS database schema migration"
```

---

## Task 2: TypeScript-Typen

**Files:**

- Modify: `types/index.ts`

- [ ] **Step 1: Typen komplett ersetzen**

```typescript
// types/index.ts

// ─── Content ─────────────────────────────────────────────────────
export interface Program {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface Area {
  id: string;
  program_id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface Tutorial {
  id: string;
  area_id: string;
  title: string;
  video_url: string;
  description: string;
  order: number;
}

export interface Lektion {
  id: string;
  area_id: string;
  title: string;
  description: string;
  order: number;
}

export interface Material {
  id: string;
  lektion_id: string;
  type: "video" | "text";
  title: string;
  content: string | null;
  video_url: string | null;
  tutorial_id: string | null;
  order: number;
}

export interface QuizQuestion {
  id: string;
  lektion_id: string;
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  order: number;
}

export interface Ressource {
  id: string;
  area_id: string;
  title: string;
  description: string;
  url: string;
  type: "link" | "pdf" | "dokument";
  order: number;
}

export interface Badge {
  id: string;
  lektion_id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Qualification {
  id: string;
  name: string;
  description: string;
}

export interface QualificationBadge {
  qualification_id: string;
  badge_id: string;
}

// ─── User ─────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface UserProgram {
  user_id: string;
  program_id: string;
  enrolled_at: string;
}

export interface LektionProgress {
  id: string;
  user_id: string;
  lektion_id: string;
  materials_completed: boolean;
  passed: boolean;
  completed_at: string | null;
}

export interface MaterialView {
  id: string;
  user_id: string;
  material_id: string;
  viewed_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  lektion_id: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface UserQualification {
  id: string;
  user_id: string;
  qualification_id: string;
  confirmed_by: string;
  confirmed_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: replace types with LMS schema types"
```

---

## Task 3: Supabase Admin Client

**Files:**

- Create: `lib/supabase/admin.ts`

- [ ] **Step 1: Erstelle Admin-Client (Service Role)**

```typescript
// lib/supabase/admin.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

// Bypasses RLS — only use in server-side admin routes
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

- [ ] **Step 2: SUPABASE_SERVICE_ROLE_KEY zu Vercel hinzufügen**

Gehe auf https://vercel.com → Projekt → Settings → Environment Variables → Add New:

- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: (der Service Role Key aus `.env.local`)
- Alle Environments auswählen → Save

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/admin.ts
git commit -m "feat: add service role admin client"
```

---

## Task 4: DB Query Utilities

**Files:**

- Create: `lib/db/programs.ts`
- Create: `lib/db/lektionen.ts`
- Create: `lib/db/progress.ts`

- [ ] **Step 1: Erstelle `lib/db/programs.ts`**

```typescript
// lib/db/programs.ts
import { createClient } from "@/lib/supabase/server";
import type { Program, Area, Tutorial, Ressource } from "@/types";

export async function getPrograms(): Promise<Program[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select("*").order("order");
  return data ?? [];
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getAreasByProgram(programId: string): Promise<Area[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("areas")
    .select("*")
    .eq("program_id", programId)
    .order("order");
  return data ?? [];
}

export async function getAreaBySlug(slug: string): Promise<Area | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("areas")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getTutorialsByArea(areaId: string): Promise<Tutorial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutorials")
    .select("*")
    .eq("area_id", areaId)
    .order("order");
  return data ?? [];
}

export async function getTutorialById(id: string): Promise<Tutorial | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutorials")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getRessourcenByArea(
  areaId: string,
): Promise<Ressource[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ressourcen")
    .select("*")
    .eq("area_id", areaId)
    .order("order");
  return data ?? [];
}
```

- [ ] **Step 2: Erstelle `lib/db/lektionen.ts`**

```typescript
// lib/db/lektionen.ts
import { createClient } from "@/lib/supabase/server";
import type { Lektion, Material, QuizQuestion, Badge } from "@/types";

export async function getLektionenByArea(areaId: string): Promise<Lektion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lektionen")
    .select("*")
    .eq("area_id", areaId)
    .order("order");
  return data ?? [];
}

export async function getLektionById(id: string): Promise<Lektion | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lektionen")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getMaterialsByLektion(
  lektionId: string,
): Promise<Material[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("*")
    .eq("lektion_id", lektionId)
    .order("order");
  return data ?? [];
}

export async function getQuizQuestions(
  lektionId: string,
): Promise<QuizQuestion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("lektion_id", lektionId)
    .order("order");
  return data ?? [];
}

export async function getBadgeByLektion(
  lektionId: string,
): Promise<Badge | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("badges")
    .select("*")
    .eq("lektion_id", lektionId)
    .single();
  return data;
}
```

- [ ] **Step 3: Erstelle `lib/db/progress.ts`**

```typescript
// lib/db/progress.ts
import { createClient } from "@/lib/supabase/server";
import type {
  LektionProgress,
  UserBadge,
  UserQualification,
  UserProgram,
} from "@/types";

export async function getUserPrograms(userId: string): Promise<UserProgram[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_programs")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getLektionProgress(
  userId: string,
): Promise<LektionProgress[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lektion_progress")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getUserQualifications(
  userId: string,
): Promise<UserQualification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_qualifications")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getLastQuizAttempt(userId: string, lektionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select("passed, attempted_at")
    .eq("user_id", userId)
    .eq("lektion_id", lektionId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/
git commit -m "feat: add DB query utilities"
```

---

## Task 5: Registrierung aktualisieren

**Files:**

- Modify: `components/auth/RegisterForm.tsx`

- [ ] **Step 1: RegisterForm auf Programmauswahl umstellen**

```tsx
// components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PROGRAMS = [
  { id: "worship-id-placeholder", slug: "worship", label: "Worship" },
  { id: "produktion-id-placeholder", slug: "produktion", label: "Produktion" },
];

export default function RegisterForm({
  programs,
}: {
  programs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProgram) {
      setError("Bitte wähle ein Programm aus.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.user) {
        if (data.session) await supabase.auth.setSession(data.session);
        const { error: enrollError } = await supabase
          .from("user_programs")
          .insert({ user_id: data.user.id, program_id: selectedProgram });
        if (enrollError) {
          setError(`Einschreibung fehlgeschlagen: ${enrollError.message}`);
          return;
        }
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-sm"
    >
      <h1 className="text-2xl font-bold text-center">Registrieren</h1>
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />
      <input
        type="password"
        placeholder="Passwort (min. 6 Zeichen)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="border rounded px-3 py-2"
      />
      <fieldset className="border rounded p-3">
        <legend className="text-sm font-medium px-1">Programm wählen</legend>
        <div className="flex flex-col gap-2 mt-2">
          {programs.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="program"
                value={p.id}
                checked={selectedProgram === p.id}
                onChange={() => setSelectedProgram(p.id)}
                className="w-4 h-4"
              />
              {p.name}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Lädt..." : "Account erstellen"}
      </button>
      <p className="text-center text-sm">
        Bereits registriert?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Registrierungsseite Programme aus DB laden**

```tsx
// app/(auth)/registrieren/page.tsx
import { createClient } from "@/lib/supabase/server";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("programs")
    .select("id, name")
    .order("order");

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <RegisterForm programs={programs ?? []} />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/auth/RegisterForm.tsx app/(auth)/registrieren/page.tsx
git commit -m "feat: update registration to program selection"
```

---

## Task 6: Dashboard

**Files:**

- Modify: `app/(app)/dashboard/page.tsx`
- Create: `components/dashboard/ProgramSwitcher.tsx`
- Create: `components/dashboard/BadgeGrid.tsx`

- [ ] **Step 1: Dashboard-Seite neu schreiben**

```tsx
// app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getPrograms, getAreasByProgram } from "@/lib/db/programs";
import { getLektionenByArea } from "@/lib/db/lektionen";
import {
  getLektionProgress,
  getUserBadges,
  getUserQualifications,
  getUserPrograms,
} from "@/lib/db/progress";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user!.id)
    .single();

  const [allPrograms, userPrograms, lektionProgress, userBadgeRows, userQuals] =
    await Promise.all([
      getPrograms(),
      getUserPrograms(user!.id),
      getLektionProgress(user!.id),
      getUserBadges(user!.id),
      getUserQualifications(user!.id),
    ]);

  const enrolledProgramIds = new Set(userPrograms.map((up) => up.program_id));
  const enrolledPrograms = allPrograms.filter((p) =>
    enrolledProgramIds.has(p.id),
  );

  // Fortschritt pro Programm berechnen
  const progressByProgram: Record<string, { done: number; total: number }> = {};
  for (const program of enrolledPrograms) {
    const areas = await getAreasByProgram(program.id);
    let total = 0;
    let done = 0;
    for (const area of areas) {
      const lektionen = await getLektionenByArea(area.id);
      total += lektionen.length;
      const passedIds = new Set(
        lektionProgress.filter((p) => p.passed).map((p) => p.lektion_id),
      );
      done += lektionen.filter((l) => passedIds.has(l.id)).length;
    }
    progressByProgram[program.id] = { done, total };
  }

  // Abzeichen mit Namen
  const { data: badgeDetails } = await supabase
    .from("user_badges")
    .select("earned_at, badges(id, name, icon, description)")
    .eq("user_id", user!.id);

  // Qualifikationen mit Namen
  const { data: qualDetails } = await supabase
    .from("user_qualifications")
    .select("confirmed_at, qualifications(id, name, description)")
    .eq("user_id", user!.id);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Hallo, {profile?.name}!</h1>
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-gray-500 hover:underline"
          >
            Abmelden
          </button>
        </form>
      </div>

      {/* Programme */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Meine Programme</h2>
        {enrolledPrograms.length === 0 ? (
          <p className="text-gray-500">
            Du bist noch in keinem Programm eingeschrieben.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrolledPrograms.map((program) => {
              const { done, total } = progressByProgram[program.id] ?? {
                done: 0,
                total: 0,
              };
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link
                  key={program.id}
                  href={`/programm/${program.slug}`}
                  className="border rounded-lg p-4 hover:shadow transition"
                >
                  <h3 className="font-semibold text-lg mb-1">{program.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {program.description}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {done} / {total} Lektionen abgeschlossen
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Abzeichen */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Meine Abzeichen</h2>
        {!badgeDetails || badgeDetails.length === 0 ? (
          <p className="text-gray-500">Noch keine Abzeichen verdient.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {badgeDetails.map((row: any) => (
              <div
                key={row.badges.id}
                className="border rounded-lg p-3 flex flex-col items-center w-24 text-center"
              >
                <span className="text-3xl mb-1">{row.badges.icon}</span>
                <span className="text-xs font-medium">{row.badges.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Qualifikationen */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Meine Qualifikationen</h2>
        {!qualDetails || qualDetails.length === 0 ? (
          <p className="text-gray-500">Noch keine Qualifikationen bestätigt.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {qualDetails.map((row: any) => (
              <div
                key={row.qualifications.id}
                className="border rounded-lg p-4 flex items-center gap-3"
              >
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="font-semibold">{row.qualifications.name}</p>
                  <p className="text-xs text-gray-500">
                    Bestätigt am{" "}
                    {new Date(row.confirmed_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/dashboard/page.tsx
git commit -m "feat: rewrite dashboard with programs, badges, qualifications"
```

---

## Task 7: Programm- und Bereichsseiten

**Files:**

- Create: `app/(app)/programm/[slug]/page.tsx`
- Create: `app/(app)/bereich/[slug]/page.tsx`

- [ ] **Step 1: Programmseite erstellen**

```tsx
// app/(app)/programm/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getProgramBySlug, getAreasByProgram } from "@/lib/db/programs";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const areas = await getAreasByProgram(program.id);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/dashboard"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
      <p className="text-gray-600 mb-8">{program.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {areas.map((area) => (
          <Link
            key={area.id}
            href={`/bereich/${area.slug}`}
            className="border rounded-lg p-4 hover:shadow transition"
          >
            <h2 className="font-semibold text-lg">{area.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{area.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Bereichsseite erstellen**

```tsx
// app/(app)/bereich/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getAreaBySlug,
  getTutorialsByArea,
  getRessourcenByArea,
} from "@/lib/db/programs";
import { getLektionenByArea } from "@/lib/db/lektionen";
import { getLektionProgress } from "@/lib/db/progress";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab = "lektionen" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const area = await getAreaBySlug(slug);
  if (!area) notFound();

  const [lektionen, tutorials, ressourcen, progress] = await Promise.all([
    getLektionenByArea(area.id),
    getTutorialsByArea(area.id),
    getRessourcenByArea(area.id),
    getLektionProgress(user!.id),
  ]);

  const passedIds = new Set(
    progress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  const tabs = ["lektionen", "tutorials", "ressourcen"] as const;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="javascript:history.back()"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Zurück
      </Link>
      <h1 className="text-3xl font-bold mb-6">{area.name}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/bereich/${slug}?tab=${t}`}
            className={`px-4 py-2 capitalize -mb-px border-b-2 transition ${
              tab === t
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-500"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Link>
        ))}
      </div>

      {/* Lektionen */}
      {tab === "lektionen" && (
        <div className="flex flex-col gap-3">
          {lektionen.length === 0 && (
            <p className="text-gray-500">Noch keine Lektionen vorhanden.</p>
          )}
          {lektionen.map((l) => (
            <Link
              key={l.id}
              href={`/lektion/${l.id}`}
              className="border rounded-lg p-4 hover:shadow transition flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold">{l.title}</h3>
                <p className="text-sm text-gray-500">{l.description}</p>
              </div>
              {passedIds.has(l.id) && (
                <span className="text-green-600 text-xl">✓</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Tutorials */}
      {tab === "tutorials" && (
        <div className="flex flex-col gap-3">
          {tutorials.length === 0 && (
            <p className="text-gray-500">Noch keine Tutorials vorhanden.</p>
          )}
          {tutorials.map((t) => (
            <Link
              key={t.id}
              href={`/tutorial/${t.id}`}
              className="border rounded-lg p-4 hover:shadow transition"
            >
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-sm text-gray-500">{t.description}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Ressourcen */}
      {tab === "ressourcen" && (
        <div className="flex flex-col gap-3">
          {ressourcen.length === 0 && (
            <p className="text-gray-500">Noch keine Ressourcen vorhanden.</p>
          )}
          {ressourcen.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg p-4 hover:shadow transition flex items-center gap-3"
            >
              <span className="text-xl">
                {r.type === "pdf" ? "📄" : r.type === "dokument" ? "📝" : "🔗"}
              </span>
              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-gray-500">{r.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(app)/programm/ app/(app)/bereich/
git commit -m "feat: add program and area pages"
```

---

## Task 8: Lektionsseite

**Files:**

- Create: `app/(app)/lektion/[id]/page.tsx`
- Create: `app/(app)/lektion/[id]/LektionClient.tsx`

- [ ] **Step 1: Lektionsseite (Server Component)**

```tsx
// app/(app)/lektion/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getLektionById,
  getMaterialsByLektion,
  getQuizQuestions,
  getBadgeByLektion,
} from "@/lib/db/lektionen";
import { getLastQuizAttempt } from "@/lib/db/progress";
import LektionClient from "./LektionClient";
import { notFound } from "next/navigation";

export default async function LektionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [lektion, materials, questions, badge, lastAttempt] = await Promise.all(
    [
      getLektionById(id),
      getMaterialsByLektion(id),
      getQuizQuestions(id),
      getBadgeByLektion(id),
      getLastQuizAttempt(user!.id, id),
    ],
  );

  if (!lektion) notFound();

  // Bereits gesehene Materialien laden
  const { data: viewedRows } = await supabase
    .from("material_views")
    .select("material_id")
    .eq("user_id", user!.id);
  const viewedIds = new Set((viewedRows ?? []).map((v: any) => v.material_id));

  // Fortschritt laden
  const { data: progressRow } = await supabase
    .from("lektion_progress")
    .select("materials_completed, passed")
    .eq("user_id", user!.id)
    .eq("lektion_id", id)
    .single();

  // 24h Sperre prüfen
  let lockedUntil: string | null = null;
  if (lastAttempt && !lastAttempt.passed) {
    const attemptTime = new Date(lastAttempt.attempted_at).getTime();
    const unlockTime = attemptTime + 24 * 60 * 60 * 1000;
    if (Date.now() < unlockTime) {
      lockedUntil = new Date(unlockTime).toISOString();
    }
  }

  return (
    <LektionClient
      lektion={lektion}
      materials={materials}
      questions={questions}
      badge={badge}
      viewedMaterialIds={Array.from(viewedIds)}
      materialsCompleted={progressRow?.materials_completed ?? false}
      passed={progressRow?.passed ?? false}
      lockedUntil={lockedUntil}
    />
  );
}
```

- [ ] **Step 2: LektionClient (Client Component)**

```tsx
// app/(app)/lektion/[id]/LektionClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lektion, Material, QuizQuestion, Badge } from "@/types";

interface Props {
  lektion: Lektion;
  materials: Material[];
  questions: QuizQuestion[];
  badge: Badge | null;
  viewedMaterialIds: string[];
  materialsCompleted: boolean;
  passed: boolean;
  lockedUntil: string | null;
}

export default function LektionClient({
  lektion,
  materials,
  questions,
  badge,
  viewedMaterialIds,
  materialsCompleted,
  passed,
  lockedUntil,
}: Props) {
  const [viewed, setViewed] = useState<Set<string>>(new Set(viewedMaterialIds));
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(
    questions.map(() => null),
  );
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);

  const allViewed =
    materials.length > 0 && materials.every((m) => viewed.has(m.id));

  async function markViewed(materialId: string) {
    if (viewed.has(materialId)) return;
    const newViewed = new Set(viewed);
    newViewed.add(materialId);
    setViewed(newViewed);
    await fetch("/api/material-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId, lektionId: lektion.id }),
    });
  }

  async function submitQuiz() {
    if (quizAnswers.some((a) => a === null)) {
      alert("Bitte beantworte alle Fragen.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lektionId: lektion.id,
        correctAnswers: questions.map((q) => q.correct_index),
        givenAnswers: quizAnswers,
      }),
    });
    const result = await res.json();
    setQuizResult(result);
    setLoading(false);
  }

  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();
  const canStartQuiz =
    (materialsCompleted || allViewed) && !passed && !isLocked;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <Link
        href="javascript:history.back()"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Zurück
      </Link>
      <h1 className="text-3xl font-bold mb-2">{lektion.title}</h1>
      <p className="text-gray-600 mb-8">{lektion.description}</p>

      {passed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700 font-medium">
            ✓ Lektion abgeschlossen
            {badge
              ? ` — Abzeichen „${badge.icon} ${badge.name}" verdient!`
              : ""}
          </p>
        </div>
      )}

      {/* Materialien */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Materialien</h2>
        <div className="flex flex-col gap-4">
          {materials.map((m) => (
            <div
              key={m.id}
              className={`border rounded-lg p-4 ${viewed.has(m.id) ? "border-green-300 bg-green-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{m.title}</h3>
                {viewed.has(m.id) && (
                  <span className="text-green-600 text-sm">✓ Gesehen</span>
                )}
              </div>
              {m.type === "video" && (
                <div
                  onClick={() => markViewed(m.id)}
                  className="cursor-pointer"
                >
                  <iframe
                    src={m.video_url ?? ""}
                    className="w-full aspect-video rounded"
                    allowFullScreen
                    onLoad={() => markViewed(m.id)}
                  />
                </div>
              )}
              {m.type === "text" && (
                <div
                  className="prose text-sm text-gray-700"
                  onClick={() => markViewed(m.id)}
                  onMouseEnter={() => markViewed(m.id)}
                >
                  {m.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Quiz */}
      {questions.length > 0 && !passed && (
        <section>
          {isLocked && (
            <p className="text-orange-600 text-sm mb-4">
              Nächster Versuch möglich ab{" "}
              {new Date(lockedUntil!).toLocaleString("de-DE")}.
            </p>
          )}
          {!showQuiz ? (
            <button
              onClick={() => setShowQuiz(true)}
              disabled={!canStartQuiz}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test starten
            </button>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Test</h2>
              {questions.map((q, qi) => (
                <div key={q.id} className="mb-6">
                  <p className="font-medium mb-2">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          checked={quizAnswers[qi] === oi}
                          onChange={() => {
                            const next = [...quizAnswers];
                            next[qi] = oi;
                            setQuizAnswers(next);
                          }}
                          className="w-4 h-4"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {quizResult ? (
                <div
                  className={`rounded-lg p-4 ${quizResult.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}
                >
                  <p className="font-semibold">
                    {quizResult.passed ? "✓ Bestanden!" : "✗ Nicht bestanden."}
                  </p>
                  <p className="text-sm mt-1">
                    Ergebnis: {Math.round(quizResult.score * 100)}%
                    {!quizResult.passed && " — Nächster Versuch in 24 Stunden."}
                  </p>
                </div>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Auswerten..." : "Abgeben"}
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(app)/lektion/
git commit -m "feat: add lektion page with materials and quiz"
```

---

## Task 9: Tutorial-Seite

**Files:**

- Create: `app/(app)/tutorial/[id]/page.tsx`

- [ ] **Step 1: Tutorial-Seite erstellen**

```tsx
// app/(app)/tutorial/[id]/page.tsx
import { getTutorialById } from "@/lib/db/programs";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutorial = await getTutorialById(id);
  if (!tutorial) notFound();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="javascript:history.back()"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Zurück
      </Link>
      <h1 className="text-3xl font-bold mb-2">{tutorial.title}</h1>
      <p className="text-gray-600 mb-6">{tutorial.description}</p>
      <iframe
        src={tutorial.video_url}
        className="w-full aspect-video rounded-lg"
        allowFullScreen
      />
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(app)/tutorial/
git commit -m "feat: add tutorial page"
```

---

## Task 10: Quiz API + Material View API

**Files:**

- Modify: `app/api/quiz/route.ts`
- Create: `app/api/material-view/route.ts`

- [ ] **Step 1: Quiz API neu schreiben (mit Badge-Vergabe)**

```typescript
// app/api/quiz/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function calculateScore(correct: number[], given: (number | null)[]): number {
  const hits = correct.filter((c, i) => c === given[i]).length;
  return hits / correct.length;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lektionId, correctAnswers, givenAnswers } = await request.json();

  if (
    !lektionId ||
    !Array.isArray(correctAnswers) ||
    !Array.isArray(givenAnswers) ||
    correctAnswers.length === 0 ||
    correctAnswers.length !== givenAnswers.length
  ) {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const score = calculateScore(correctAnswers, givenAnswers);
  const passed = score >= 0.8;

  await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    lektion_id: lektionId,
    score,
    passed,
  });

  if (passed) {
    await supabase.from("lektion_progress").upsert({
      user_id: user.id,
      lektion_id: lektionId,
      materials_completed: true,
      passed: true,
      completed_at: new Date().toISOString(),
    });

    // Abzeichen vergeben
    const { data: badge } = await supabase
      .from("badges")
      .select("id")
      .eq("lektion_id", lektionId)
      .single();

    if (badge) {
      await supabase.from("user_badges").upsert({
        user_id: user.id,
        badge_id: badge.id,
        earned_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ score, passed });
}
```

- [ ] **Step 2: Material View API erstellen**

```typescript
// app/api/material-view/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { materialId, lektionId } = await request.json();
  if (!materialId || !lektionId) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  await supabase.from("material_views").upsert({
    user_id: user.id,
    material_id: materialId,
    viewed_at: new Date().toISOString(),
  });

  // Prüfen ob alle Materialien gesehen
  const { data: allMaterials } = await supabase
    .from("materials")
    .select("id")
    .eq("lektion_id", lektionId);

  const { data: views } = await supabase
    .from("material_views")
    .select("material_id")
    .eq("user_id", user.id)
    .in(
      "material_id",
      (allMaterials ?? []).map((m: any) => m.id),
    );

  if (allMaterials && views && views.length >= allMaterials.length) {
    await supabase.from("lektion_progress").upsert(
      {
        user_id: user.id,
        lektion_id: lektionId,
        materials_completed: true,
      },
      { onConflict: "user_id,lektion_id", ignoreDuplicates: false },
    );
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/quiz/route.ts app/api/material-view/route.ts
git commit -m "feat: rewrite quiz API with badge awarding, add material view API"
```

---

## Task 11: Admin – Inhalte verwalten

**Files:**

- Create: `app/api/admin/content/route.ts`
- Create: `app/admin/inhalte/page.tsx`
- Create: `components/admin/ContentForm.tsx`

- [ ] **Step 1: Admin Content API erstellen**

```typescript
// app/api/admin/content/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return data?.is_admin ? user : null;
}

export async function POST(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table, data } = await request.json();
  const allowed = [
    "programs",
    "areas",
    "tutorials",
    "lektionen",
    "materials",
    "quiz_questions",
    "ressourcen",
    "badges",
    "qualifications",
    "qualification_badges",
  ];
  if (!allowed.includes(table))
    return NextResponse.json({ error: "Ungültige Tabelle" }, { status: 400 });

  const db = createAdminClient();
  const { data: result, error } = await db
    .from(table)
    .insert(data)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table, id, data } = await request.json();
  const allowed = [
    "programs",
    "areas",
    "tutorials",
    "lektionen",
    "materials",
    "quiz_questions",
    "ressourcen",
    "badges",
    "qualifications",
  ];
  if (!allowed.includes(table))
    return NextResponse.json({ error: "Ungültige Tabelle" }, { status: 400 });

  const db = createAdminClient();
  const { data: result, error } = await db
    .from(table)
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table, id } = await request.json();
  const allowed = [
    "programs",
    "areas",
    "tutorials",
    "lektionen",
    "materials",
    "quiz_questions",
    "ressourcen",
    "badges",
    "qualifications",
    "qualification_badges",
  ];
  if (!allowed.includes(table))
    return NextResponse.json({ error: "Ungültige Tabelle" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from(table).delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Admin Inhalte-Übersicht erstellen**

```tsx
// app/admin/inhalte/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminInhaltePage() {
  const db = createAdminClient();
  const [
    { data: programs },
    { data: areas },
    { data: lektionen },
    { data: tutorials },
    { data: ressourcen },
  ] = await Promise.all([
    db.from("programs").select("id, name").order("order"),
    db.from("areas").select("id, name, programs(name)").order("order"),
    db.from("lektionen").select("id, title, areas(name)").order("order"),
    db.from("tutorials").select("id, title, areas(name)").order("order"),
    db.from("ressourcen").select("id, title, areas(name)").order("order"),
  ]);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Link
        href="/admin"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Admin
      </Link>
      <h1 className="text-3xl font-bold mb-8">Inhalte verwalten</h1>

      {/* Programme */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Programme</h2>
          <Link
            href="/admin/inhalte/neu?type=program"
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Neu
          </Link>
        </div>
        <div className="border rounded-lg divide-y">
          {(programs ?? []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3">
              <span>{p.name}</span>
              <Link
                href={`/admin/inhalte/bearbeiten?type=program&id=${p.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Bereiche */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Bereiche</h2>
          <Link
            href="/admin/inhalte/neu?type=area"
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Neu
          </Link>
        </div>
        <div className="border rounded-lg divide-y">
          {(areas ?? []).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3">
              <span>
                {(a.programs as any)?.name} → {a.name}
              </span>
              <Link
                href={`/admin/inhalte/bearbeiten?type=area&id=${a.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Lektionen */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Lektionen</h2>
          <Link
            href="/admin/inhalte/neu?type=lektion"
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Neu
          </Link>
        </div>
        <div className="border rounded-lg divide-y">
          {(lektionen ?? []).map((l: any) => (
            <div key={l.id} className="flex items-center justify-between p-3">
              <span>
                {(l.areas as any)?.name} → {l.title}
              </span>
              <Link
                href={`/admin/inhalte/bearbeiten?type=lektion&id=${l.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Tutorials */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Tutorials</h2>
          <Link
            href="/admin/inhalte/neu?type=tutorial"
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Neu
          </Link>
        </div>
        <div className="border rounded-lg divide-y">
          {(tutorials ?? []).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-3">
              <span>
                {(t.areas as any)?.name} → {t.title}
              </span>
              <Link
                href={`/admin/inhalte/bearbeiten?type=tutorial&id=${t.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Admin Inhalte Neu/Bearbeiten-Seite (Client)**

```tsx
// app/admin/inhalte/neu/page.tsx
export { default } from "@/components/admin/ContentEditor";
```

```tsx
// app/admin/inhalte/bearbeiten/page.tsx
export { default } from "@/components/admin/ContentEditor";
```

```tsx
// components/admin/ContentEditor.tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function ContentEditorInner() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type") ?? "";
  const id = params.get("id");
  const isEdit = Boolean(id);

  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldDefs: Record<string, string[]> = {
    program: ["name", "slug", "description", "order"],
    area: ["name", "slug", "description", "order", "program_id"],
    lektion: ["title", "description", "order", "area_id"],
    tutorial: ["title", "video_url", "description", "order", "area_id"],
    ressource: ["title", "description", "url", "type", "order", "area_id"],
    material: [
      "title",
      "type",
      "content",
      "video_url",
      "order",
      "lektion_id",
      "tutorial_id",
    ],
    quiz_question: [
      "question",
      "options",
      "correct_index",
      "order",
      "lektion_id",
    ],
    badge: ["name", "icon", "description", "lektion_id"],
    qualification: ["name", "description"],
  };

  const tableMap: Record<string, string> = {
    program: "programs",
    area: "areas",
    lektion: "lektionen",
    tutorial: "tutorials",
    ressource: "ressourcen",
    material: "materials",
    quiz_question: "quiz_questions",
    badge: "badges",
    qualification: "qualifications",
  };

  useEffect(() => {
    if (isEdit && id) {
      fetch(`/api/admin/content-get?table=${tableMap[type]}&id=${id}`)
        .then((r) => r.json())
        .then((data) => {
          const mapped: Record<string, string> = {};
          for (const f of fieldDefs[type] ?? []) {
            mapped[f] =
              data[f] !== null && data[f] !== undefined ? String(data[f]) : "";
          }
          setFields(mapped);
        });
    }
  }, [id, type]);

  async function save() {
    setSaving(true);
    setError(null);
    const data: Record<string, any> = { ...fields };
    if (type === "quiz_question") {
      try {
        data.options = JSON.parse(fields.options ?? "[]");
      } catch {
        setError("options muss ein JSON-Array sein");
        setSaving(false);
        return;
      }
      data.correct_index = parseInt(fields.correct_index);
    }
    if (fields.order !== undefined) data.order = parseInt(fields.order);

    const res = await fetch("/api/admin/content", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: tableMap[type], id, data }),
    });
    if (!res.ok) {
      const e = await res.json();
      setError(e.error);
      setSaving(false);
      return;
    }
    router.push("/admin/inhalte");
  }

  async function deleteItem() {
    if (!confirm("Wirklich löschen?")) return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: tableMap[type], id }),
    });
    router.push("/admin/inhalte");
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "Bearbeiten" : "Neu"}: {type}
      </h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="flex flex-col gap-4">
        {(fieldDefs[type] ?? []).map((f) => (
          <div key={f}>
            <label className="block text-sm font-medium mb-1">{f}</label>
            {f === "content" || f === "description" ? (
              <textarea
                value={fields[f] ?? ""}
                onChange={(e) => setFields({ ...fields, [f]: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                rows={4}
              />
            ) : (
              <input
                value={fields[f] ?? ""}
                onChange={(e) => setFields({ ...fields, [f]: e.target.value })}
                className="border rounded px-3 py-2 w-full"
              />
            )}
          </div>
        ))}
        <div className="flex gap-3 mt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
          {isEdit && (
            <button
              onClick={deleteItem}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
            >
              Löschen
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ContentEditor() {
  return (
    <Suspense>
      <ContentEditorInner />
    </Suspense>
  );
}
```

- [ ] **Step 4: Content GET API (für Bearbeiten-Seite)**

```typescript
// app/api/admin/content-get/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");
  if (!table || !id)
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db
    .from(table)
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/ app/admin/inhalte/ components/admin/ContentEditor.tsx
git commit -m "feat: add admin content management UI and API"
```

---

## Task 12: Admin – Nutzerverwaltung

**Files:**

- Modify: `app/admin/page.tsx`
- Create: `app/admin/nutzer/page.tsx`
- Modify: `app/admin/[userId]/page.tsx` → umbenennen zu `app/admin/nutzer/[id]/page.tsx`

- [ ] **Step 1: Admin-Übersicht aktualisieren**

```tsx
// app/admin/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminPage() {
  const db = createAdminClient();
  const { count: userCount } = await db
    .from("users")
    .select("*", { count: "exact", head: true });
  const { count: lektionenCount } = await db
    .from("lektionen")
    .select("*", { count: "exact", head: true });
  const { count: badgeCount } = await db
    .from("user_badges")
    .select("*", { count: "exact", head: true });

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{userCount ?? 0}</p>
          <p className="text-gray-500 text-sm">Nutzer</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{lektionenCount ?? 0}</p>
          <p className="text-gray-500 text-sm">Lektionen</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{badgeCount ?? 0}</p>
          <p className="text-gray-500 text-sm">Abzeichen vergeben</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/nutzer"
          className="border rounded-lg p-4 hover:shadow transition font-medium"
        >
          👥 Nutzerverwaltung
        </Link>
        <Link
          href="/admin/inhalte"
          className="border rounded-lg p-4 hover:shadow transition font-medium"
        >
          📚 Inhaltsverwaltung
        </Link>
        <Link
          href="/admin/qualifikationen"
          className="border rounded-lg p-4 hover:shadow transition font-medium"
        >
          🎓 Qualifikationen
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Nutzerliste erstellen**

```tsx
// app/admin/nutzer/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminNutzerPage() {
  const db = createAdminClient();
  const { data: users } = await db
    .from("users")
    .select("id, name, email, is_admin, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Link
        href="/admin"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Admin
      </Link>
      <h1 className="text-3xl font-bold mb-6">Nutzer</h1>
      <div className="border rounded-lg divide-y">
        {(users ?? []).map((u: any) => (
          <Link
            key={u.id}
            href={`/admin/nutzer/${u.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
          >
            <div>
              <p className="font-medium">
                {u.name}{" "}
                {u.is_admin && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded ml-1">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">{u.email}</p>
            </div>
            <span className="text-gray-400 text-sm">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Nutzerdetail-Seite erstellen**

Erstelle `app/admin/nutzer/[id]/page.tsx`. Die alte Datei `app/admin/[userId]/page.tsx` wird danach gelöscht.

```tsx
// app/admin/nutzer/[id]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import AdminUserDetail from "@/components/admin/AdminUserDetail";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createAdminClient();

  const [
    { data: user },
    { data: programs },
    { data: badges },
    { data: qualifications },
    { data: userPrograms },
    { data: userBadges },
    { data: userQuals },
    { data: progress },
  ] = await Promise.all([
    db.from("users").select("id, name, email, is_admin").eq("id", id).single(),
    db.from("programs").select("id, name"),
    db.from("badges").select("id, name, icon, lektionen(title)"),
    db.from("qualifications").select("id, name"),
    db.from("user_programs").select("program_id").eq("user_id", id),
    db.from("user_badges").select("badge_id, earned_at").eq("user_id", id),
    db
      .from("user_qualifications")
      .select("qualification_id, confirmed_at")
      .eq("user_id", id),
    db
      .from("lektion_progress")
      .select("lektion_id, passed, completed_at")
      .eq("user_id", id),
  ]);

  if (!user) notFound();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/admin/nutzer"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Nutzer
      </Link>
      <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
      <p className="text-gray-500 text-sm mb-6">{user.email}</p>
      <AdminUserDetail
        userId={id}
        programs={programs ?? []}
        badges={badges ?? []}
        qualifications={qualifications ?? []}
        userPrograms={(userPrograms ?? []).map((up: any) => up.program_id)}
        userBadges={userBadges ?? []}
        userQuals={userQuals ?? []}
        progress={progress ?? []}
      />
    </main>
  );
}
```

- [ ] **Step 4: AdminUserDetail Client Component erstellen**

```tsx
// components/admin/AdminUserDetail.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  programs: { id: string; name: string }[];
  badges: any[];
  qualifications: any[];
  userPrograms: string[];
  userBadges: any[];
  userQuals: any[];
  progress: any[];
}

export default function AdminUserDetail({
  userId,
  programs,
  badges,
  qualifications,
  userPrograms,
  userBadges,
  userQuals,
  progress,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const enrolledSet = new Set(userPrograms);
  const badgeSet = new Set(userBadges.map((b: any) => b.badge_id));
  const qualSet = new Set(userQuals.map((q: any) => q.qualification_id));
  const passedSet = new Set(
    progress.filter((p: any) => p.passed).map((p: any) => p.lektion_id),
  );

  async function post(url: string, body: object) {
    setSaving(true);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    router.refresh();
  }

  async function del(url: string, body: object) {
    setSaving(true);
    await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Programme */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Programme</h2>
        <div className="flex flex-col gap-2">
          {programs.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <span>{p.name}</span>
              {enrolledSet.has(p.id) ? (
                <button
                  disabled={saving}
                  onClick={() =>
                    del("/api/admin/user-programs", { userId, programId: p.id })
                  }
                  className="text-sm text-red-600 hover:underline"
                >
                  Entfernen
                </button>
              ) : (
                <button
                  disabled={saving}
                  onClick={() =>
                    post("/api/admin/user-programs", {
                      userId,
                      programId: p.id,
                    })
                  }
                  className="text-sm text-blue-600 hover:underline"
                >
                  Hinzufügen
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Abzeichen */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Abzeichen</h2>
        <div className="flex flex-col gap-2">
          {badges.map((b: any) => (
            <div
              key={b.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <span>
                {b.icon} {b.name}
              </span>
              {badgeSet.has(b.id) ? (
                <button
                  disabled={saving}
                  onClick={() =>
                    del("/api/admin/user-badges", { userId, badgeId: b.id })
                  }
                  className="text-sm text-red-600 hover:underline"
                >
                  Entziehen
                </button>
              ) : (
                <button
                  disabled={saving}
                  onClick={() =>
                    post("/api/admin/user-badges", { userId, badgeId: b.id })
                  }
                  className="text-sm text-blue-600 hover:underline"
                >
                  Vergeben
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Qualifikationen */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Qualifikationen</h2>
        <div className="flex flex-col gap-2">
          {qualifications.map((q: any) => (
            <div
              key={q.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <span>🎓 {q.name}</span>
              {qualSet.has(q.id) ? (
                <span className="text-sm text-green-600">✓ Bestätigt</span>
              ) : (
                <button
                  disabled={saving}
                  onClick={() =>
                    post("/api/admin/user-qualifications", {
                      userId,
                      qualificationId: q.id,
                    })
                  }
                  className="text-sm text-blue-600 hover:underline"
                >
                  Bestätigen
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Admin User API-Routen erstellen**

```typescript
// app/api/admin/user-programs/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return data?.is_admin ?? false;
}

export async function POST(request: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, programId } = await request.json();
  const db = createAdminClient();
  const { error } = await db
    .from("user_programs")
    .insert({ user_id: userId, program_id: programId });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, programId } = await request.json();
  const db = createAdminClient();
  await db
    .from("user_programs")
    .delete()
    .eq("user_id", userId)
    .eq("program_id", programId);
  return NextResponse.json({ ok: true });
}
```

```typescript
// app/api/admin/user-badges/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return data?.is_admin ?? false;
}

export async function POST(request: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, badgeId } = await request.json();
  const db = createAdminClient();
  const { error } = await db
    .from("user_badges")
    .upsert({
      user_id: userId,
      badge_id: badgeId,
      earned_at: new Date().toISOString(),
    });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, badgeId } = await request.json();
  const db = createAdminClient();
  await db
    .from("user_badges")
    .delete()
    .eq("user_id", userId)
    .eq("badge_id", badgeId);
  return NextResponse.json({ ok: true });
}
```

```typescript
// app/api/admin/user-qualifications/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return data?.is_admin ?? false;
}

export async function POST(request: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, qualificationId } = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const db = createAdminClient();
  const { error } = await db.from("user_qualifications").upsert({
    user_id: userId,
    qualification_id: qualificationId,
    confirmed_by: user!.id,
    confirmed_at: new Date().toISOString(),
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Alte Nutzerseite löschen**

```bash
rm app/admin/\[userId\]/page.tsx
```

- [ ] **Step 7: Commit**

```bash
git add app/admin/ components/admin/ app/api/admin/
git commit -m "feat: add admin user management with program/badge/qualification controls"
```

---

## Task 13: Admin – Qualifikationen

**Files:**

- Create: `app/admin/qualifikationen/page.tsx`

- [ ] **Step 1: Qualifikationsverwaltung erstellen**

```tsx
// app/admin/qualifikationen/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminQualifikationenPage() {
  const db = createAdminClient();
  const { data: qualifications } = await db
    .from("qualifications")
    .select(
      "id, name, description, qualification_badges(badge_id, badges(name, icon))",
    );

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/admin"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Admin
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Qualifikationen</h1>
        <Link
          href="/admin/inhalte/neu?type=qualification"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          + Neue Qualifikation
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {(qualifications ?? []).map((q: any) => (
          <div key={q.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg">🎓 {q.name}</h2>
              <Link
                href={`/admin/inhalte/bearbeiten?type=qualification&id=${q.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
            <p className="text-sm text-gray-500 mb-3">{q.description}</p>
            <div className="flex flex-wrap gap-2">
              {(q.qualification_badges ?? []).map((qb: any) => (
                <span
                  key={qb.badge_id}
                  className="bg-gray-100 rounded px-2 py-1 text-sm"
                >
                  {qb.badges?.icon} {qb.badges?.name}
                </span>
              ))}
            </div>
            {(q.qualification_badges ?? []).length === 0 && (
              <p className="text-xs text-gray-400">
                Noch keine Abzeichen zugeordnet. Füge
                „qualification_badges"-Einträge hinzu.
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/qualifikationen/
git commit -m "feat: add qualifications admin page"
```

---

## Task 14: Middleware aktualisieren

**Files:**

- Modify: `middleware.ts`

- [ ] **Step 1: Admin-Route-Prüfung anpassen**

Die Middleware prüft bisher `/admin`. Die neue Struktur hat `/admin/nutzer`, `/admin/inhalte`, `/admin/qualifikationen`. Die bestehende Prüfung `pathname.startsWith("/admin")` deckt das bereits ab — nur den Nutzer-Query-Pfad anpassen:

```typescript
// middleware.ts — nur die Admin-Sektion ersetzen:
if (pathname.startsWith("/admin") && user) {
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
```

Kein Code-Change nötig — Middleware ist bereits korrekt. Nur verifizieren dass `pathname.startsWith("/admin")` vorhanden ist.

- [ ] **Step 2: Alte Routen entfernen**

```bash
rm -rf app/\(app\)/modul
rm -rf lib/content
rm -rf lib/path
rm -rf content
```

- [ ] **Step 3: Alte Komponenten entfernen**

```bash
rm -rf components/dashboard
rm -rf components/module
```

- [ ] **Step 4: Alte Tests und Utilities entfernen**

```bash
rm lib/progress/utils.ts lib/progress/utils.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: remove old Gewächshaus code, clean up for LMS"
```

---

## Task 15: Vercel Redeploy + E2E-Test

- [ ] **Step 1: Redeploy auf Vercel triggern**

Push auf `feature/implementation` triggert Vercel automatisch. Falls nicht:
Gehe auf https://vercel.com → Deployments → Redeploy.

- [ ] **Step 2: E2E Checkliste durchgehen**

- [ ] Registrierung → Programm wählen → Dashboard erscheint
- [ ] Dashboard zeigt Programme, Abzeichen, Qualifikationen
- [ ] Login / Logout funktioniert
- [ ] Programm-Seite zeigt Bereiche
- [ ] Bereich-Seite zeigt Lektionen / Tutorials / Ressourcen Tabs
- [ ] Lektion öffnen → Materialien sehen → Test starten → bestehen → Abzeichen
- [ ] Tutorial öffnen → Video sichtbar
- [ ] Admin `/admin` → Übersicht
- [ ] Admin Inhalte → Lektion anlegen → in Bereich erscheint
- [ ] Admin Nutzer → Abzeichen vergeben → im Dashboard sichtbar
- [ ] Admin Qualifikationen → bestätigen → im Dashboard sichtbar
