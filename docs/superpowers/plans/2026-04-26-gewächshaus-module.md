# Gewächshaus Module-Struktur — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lektionen im Gewächshaus in drei sichtbare Module gliedern (Identität & Haltung · Musiktheorie · Praxis & Tools), mit Modul-Headern auf der Bereich-Seite und Admin-Verwaltung.

**Architecture:** Neue `modules`-Tabelle in Supabase, `module_id` auf `lektionen`, die Bereich-Seite lädt Module parallel zu Lektionen und gibt beides an `LektionenTab` weiter, das die Gruppierung übernimmt.

**Tech Stack:** Next.js 15 App Router, Supabase, TypeScript, Tailwind

---

## Dateien — Überblick

| Datei                                          | Aktion                                           |
| ---------------------------------------------- | ------------------------------------------------ |
| `supabase/migrations/008_modules.sql`          | NEU — DB-Struktur, Seed-Daten, Zuweisung         |
| `types/index.ts`                               | ÄNDERN — Module-Typ, module_id auf Lektion       |
| `lib/db/cached.ts`                             | ÄNDERN — getCachedModulesByArea hinzufügen       |
| `app/api/admin/modules-list/route.ts`          | NEU — Module-Liste für Admin-Dropdowns           |
| `app/(app)/bereich/[slug]/page.tsx`            | ÄNDERN — Module laden, an LektionenTab übergeben |
| `components/worship/LektionenTab.tsx`          | ÄNDERN — Module-Props, Gruppierung + Header      |
| `app/admin/inhalte/[areaSlug]/page.tsx`        | ÄNDERN — Link "Module" hinzufügen                |
| `app/admin/inhalte/[areaSlug]/module/page.tsx` | NEU — Module verwalten                           |
| `components/admin/LektionEditor.tsx`           | ÄNDERN — Modul-Dropdown                          |

---

## Task 1: SQL-Migration schreiben

**Files:**

- Create: `supabase/migrations/008_modules.sql`

- [ ] **Schritt 1: Datei anlegen**

```sql
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
```

- [ ] **Schritt 2: Migration in Supabase ausführen**

Supabase Dashboard → SQL Editor → Inhalt der Datei einfügen → Run.

Kontrollieren: In der `modules`-Tabelle sollten 3 Einträge sein. In `lektionen` sollten die meisten Gewächshaus-Lektionen eine `module_id` haben.

- [ ] **Schritt 3: Committen**

```bash
git add supabase/migrations/008_modules.sql
git commit -m "feat: Modul-Struktur Migration für Gewächshaus"
```

---

## Task 2: TypeScript-Typen erweitern

**Files:**

- Modify: `types/index.ts`

- [ ] **Schritt 1: Module-Typ und module_id zu Lektion hinzufügen**

In `types/index.ts` nach dem `Area`-Interface einfügen:

```typescript
export interface Module {
  id: string;
  area_id: string;
  name: string;
  description: string | null;
  order: number;
}
```

Und im `Lektion`-Interface die Zeile `h5p_content_path: string | null;` ergänzen um:

```typescript
module_id: string | null;
```

Vollständiges `Lektion`-Interface danach:

```typescript
export interface Lektion {
  id: string;
  area_id: string;
  module_id: string | null;
  title: string;
  description: string;
  order: number;
  content: string | null;
  video_url: string | null;
  video_position: "above" | "below";
  h5p_content_path: string | null;
}
```

- [ ] **Schritt 2: Committen**

```bash
git add types/index.ts
git commit -m "feat: Module-Typ und module_id auf Lektion"
```

---

## Task 3: DB-Query und API-Route für Module

**Files:**

- Modify: `lib/db/cached.ts`
- Create: `app/api/admin/modules-list/route.ts`

- [ ] **Schritt 1: getCachedModulesByArea in cached.ts hinzufügen**

Am Ende von `lib/db/cached.ts` anfügen:

```typescript
export const getCachedModulesByArea = unstable_cache(
  async (areaId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("modules")
      .select("*")
      .eq("area_id", areaId)
      .order("order", { ascending: true });
    return (data ?? []) as import("@/types").Module[];
  },
  ["modules-by-area"],
  { revalidate: TTL, tags: ["modules"] },
);
```

- [ ] **Schritt 2: API-Route für Admin-Dropdown anlegen**

Ordner `app/api/admin/modules-list/` erstellen, darin `route.ts`:

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const areaId = searchParams.get("areaId");
  if (!areaId) return NextResponse.json([]);

  const db = createAdminClient();
  const { data } = await db
    .from("modules")
    .select("id, name")
    .eq("area_id", areaId)
    .order("order");

  return NextResponse.json(data ?? []);
}
```

- [ ] **Schritt 3: Committen**

```bash
git add lib/db/cached.ts app/api/admin/modules-list/route.ts
git commit -m "feat: getCachedModulesByArea und modules-list API"
```

---

## Task 4: Bereich-Seite — Module laden

**Files:**

- Modify: `app/(app)/bereich/[slug]/page.tsx`

- [ ] **Schritt 1: Import ergänzen und Module laden**

Die Datei `app/(app)/bereich/[slug]/page.tsx` vollständig ersetzen:

```typescript
import { createClient } from "@/lib/supabase/server";
import {
  getCachedAreaBySlug,
  getCachedProgramById,
  getCachedLektionenByArea,
  getCachedModulesByArea,
} from "@/lib/db/cached";
import { getLektionProgress } from "@/lib/db/progress";
import Link from "next/link";
import { notFound } from "next/navigation";
import LektionenTab from "@/components/worship/LektionenTab";

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const area = await getCachedAreaBySlug(slug);
  if (!area) notFound();

  const [lektionen, progress, program, profileResult, modules] =
    await Promise.all([
      getCachedLektionenByArea(area.id),
      getLektionProgress(user!.id),
      getCachedProgramById(area.program_id),
      supabase.from("users").select("is_admin").eq("id", user!.id).single(),
      getCachedModulesByArea(area.id),
    ]);

  const passedIds = progress.filter((p) => p.passed).map((p) => p.lektion_id);
  const isAdmin = profileResult.data?.is_admin ?? false;

  return (
    <div>
      <Link
        href={`/programm/${program?.slug ?? ""}`}
        className="text-sm text-teal hover:underline mb-4 block"
      >
        ← {program?.name ?? "Zurück"}
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {area.name}
        </h1>
        {isAdmin && (
          <Link
            href={`/admin/inhalte/${slug}/lektionen`}
            title="Bereich bearbeiten"
            className="text-gray-mid hover:text-teal transition-colors"
          >
            ✏️
          </Link>
        )}
      </div>

      <LektionenTab
        lektionen={lektionen}
        modules={modules}
        passedIds={passedIds}
        isAdmin={isAdmin}
        areaId={area.id}
      />
    </div>
  );
}
```

- [ ] **Schritt 2: Committen**

```bash
git add "app/(app)/bereich/[slug]/page.tsx"
git commit -m "feat: Module in Bereich-Seite laden"
```

---

## Task 5: LektionenTab — Modul-Gruppierung

**Files:**

- Modify: `components/worship/LektionenTab.tsx`

- [ ] **Schritt 1: Komponente vollständig ersetzen**

```typescript
"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lektion, Module } from "@/types";

interface Props {
  lektionen: Lektion[];
  modules: Module[];
  passedIds: string[];
  isAdmin: boolean;
  areaId: string;
}

function LektionCard({
  l,
  passed,
  isAdmin,
}: {
  l: Lektion;
  passed: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {passed && (
            <span className="text-teal text-base flex-shrink-0">✓</span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-ink text-sm">{l.title}</p>
            {l.description && (
              <p className="text-xs text-gray-mid truncate">{l.description}</p>
            )}
          </div>
        </div>
        <span
          className={`text-gray-mid transition-transform duration-200 flex-shrink-0 ml-3 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-5 pt-4">
          {l.content && (
            <div
              className="prose prose-sm max-w-none text-ink/80 mb-5"
              dangerouslySetInnerHTML={{ __html: l.content }}
            />
          )}
          <div className="flex items-center gap-3">
            <Link
              href={`/lektion/${l.id}`}
              className="bg-teal text-white text-xs font-bold uppercase tracking-[1.5px] px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              {passed ? "Erneut ansehen" : "Prüfung absolvieren"}
            </Link>
            {isAdmin && (
              <Link
                href={`/admin/inhalte/bearbeiten?type=lektion&id=${l.id}`}
                className="text-xs text-gray-mid hover:text-teal transition-colors"
              >
                ✏️ Bearbeiten
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModulSection({
  modul,
  lektionen,
  passedIds,
  isAdmin,
}: {
  modul: Module;
  lektionen: Lektion[];
  passedIds: Set<string>;
  isAdmin: boolean;
}) {
  const passedCount = lektionen.filter((l) => passedIds.has(l.id)).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">{modul.name}</h2>
          {modul.description && (
            <p className="text-xs text-gray-mid mt-0.5">{modul.description}</p>
          )}
        </div>
        <span className="text-xs text-gray-mid flex-shrink-0 ml-4">
          {passedCount}/{lektionen.length}
        </span>
      </div>
      {lektionen.map((l) => (
        <LektionCard
          key={l.id}
          l={l}
          passed={passedIds.has(l.id)}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

export default function LektionenTab({
  lektionen,
  modules,
  passedIds,
  isAdmin,
  areaId,
}: Props) {
  const passedSet = new Set(passedIds);
  const hasModules = modules.length > 0;

  const grouped = hasModules
    ? modules.map((m) => ({
        modul: m,
        lektionen: lektionen.filter((l) => l.module_id === m.id),
      }))
    : [];

  const ungrouped = lektionen.filter(
    (l) => !hasModules || l.module_id === null,
  );

  return (
    <div className="flex flex-col gap-10">
      {grouped.map(({ modul, lektionen: ml }) => (
        <ModulSection
          key={modul.id}
          modul={modul}
          lektionen={ml}
          passedIds={passedSet}
          isAdmin={isAdmin}
        />
      ))}

      {ungrouped.length > 0 && (
        <div className="flex flex-col gap-3">
          {ungrouped.map((l) => (
            <LektionCard
              key={l.id}
              l={l}
              passed={passedSet.has(l.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {isAdmin && (
        <Link
          href={`/admin/inhalte/neu?type=lektion&areaId=${areaId}`}
          className="border border-dashed border-border rounded-xl p-4 text-center text-sm text-gray-mid hover:text-teal hover:border-teal transition-colors"
        >
          + Neue Lektion
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Schritt 2: Committen**

```bash
git add components/worship/LektionenTab.tsx
git commit -m "feat: LektionenTab gruppiert Lektionen nach Modul"
```

---

## Task 6: Admin — Module-Link auf Bereich-Übersicht

**Files:**

- Modify: `app/admin/inhalte/[areaSlug]/page.tsx`

- [ ] **Schritt 1: "Module" als Link hinzufügen**

Im `types`-Array für reguläre Bereiche (nicht-Instrument) den Eintrag "Module" anfügen:

```typescript
const types = isInstrument
  ? [
      { label: "Tutorials", href: `/admin/inhalte/${areaSlug}/tutorials` },
      { label: "Ressourcen", href: `/admin/inhalte/${areaSlug}/ressourcen` },
    ]
  : [
      { label: "Lektionen", href: `/admin/inhalte/${areaSlug}/lektionen` },
      { label: "Module", href: `/admin/inhalte/${areaSlug}/module` },
      { label: "Tutorials", href: `/admin/inhalte/${areaSlug}/tutorials` },
      { label: "Ressourcen", href: `/admin/inhalte/${areaSlug}/ressourcen` },
    ];
```

- [ ] **Schritt 2: Committen**

```bash
git add "app/admin/inhalte/[areaSlug]/page.tsx"
git commit -m "feat: Module-Link in Admin Bereich-Übersicht"
```

---

## Task 7: Admin — Module-Verwaltungsseite

**Files:**

- Create: `app/admin/inhalte/[areaSlug]/module/page.tsx`

- [ ] **Schritt 1: Seite anlegen**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import ModuleAdminClient from "./ModuleAdminClient";

export default async function AdminModulePage({
  params,
}: {
  params: Promise<{ areaSlug: string }>;
}) {
  const { areaSlug } = await params;
  const db = createAdminClient();

  const { data: area } = await db
    .from("areas")
    .select("id, name")
    .eq("slug", areaSlug)
    .single();

  if (!area) notFound();

  const { data: modules } = await db
    .from("modules")
    .select("*")
    .eq("area_id", area.id)
    .order("order");

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href={`/admin/inhalte/${areaSlug}`}
        className="text-sm text-teal hover:underline mb-4 block"
      >
        ← {area.name}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-8">
        Module
      </h1>
      <ModuleAdminClient areaId={area.id} initialModules={modules ?? []} />
    </main>
  );
}
```

- [ ] **Schritt 2: Client-Komponente anlegen**

`app/admin/inhalte/[areaSlug]/module/ModuleAdminClient.tsx`:

```typescript
"use client";
import { useState } from "react";

interface Modul {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

interface Props {
  areaId: string;
  initialModules: Modul[];
}

export default function ModuleAdminClient({ areaId, initialModules }: Props) {
  const [modules, setModules] = useState<Modul[]>(initialModules);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!newName.trim()) return;
    setSaving(true);
    const nextOrder = modules.length > 0 ? Math.max(...modules.map((m) => m.order)) + 1 : 1;
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "modules",
        data: { area_id: areaId, name: newName.trim(), description: newDesc.trim() || null, order: nextOrder },
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setModules((prev) => [...prev, created]);
      setNewName("");
      setNewDesc("");
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Modul löschen? Lektionen behalten ihre Inhalte, verlieren aber die Modul-Zuordnung.")) return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "modules", id }),
    });
    setModules((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {modules.length === 0 && (
          <p className="text-gray-mid text-sm">Noch keine Module.</p>
        )}
        {modules.map((m) => (
          <div
            key={m.id}
            className="bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-ink">{m.name}</p>
              {m.description && (
                <p className="text-xs text-gray-mid">{m.description}</p>
              )}
            </div>
            <button
              onClick={() => remove(m.id)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors ml-4"
            >
              Löschen
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-ink mb-3">Neues Modul</h2>
        <div className="flex flex-col gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="border rounded px-3 py-2 w-full text-sm"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Beschreibung (optional)"
            className="border rounded px-3 py-2 w-full text-sm"
          />
          <button
            onClick={create}
            disabled={saving || !newName.trim()}
            className="bg-teal text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 self-start"
          >
            {saving ? "Speichern…" : "Modul anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 3: Committen**

```bash
git add "app/admin/inhalte/[areaSlug]/module/"
git commit -m "feat: Admin Module-Verwaltungsseite"
```

---

## Task 8: LektionEditor — Modul-Dropdown

**Files:**

- Modify: `components/admin/LektionEditor.tsx`

- [ ] **Schritt 1: State und Ladelogik hinzufügen**

In `LektionEditor.tsx` nach dem `areas`-State die Zeile einfügen:

```typescript
const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
const [moduleId, setModuleId] = useState("");
```

Nach dem `useEffect` der die Areas lädt, einen weiteren `useEffect` anfügen:

```typescript
useEffect(() => {
  if (!areaId) return;
  fetch(`/api/admin/modules-list?areaId=${areaId}`)
    .then((r) => r.json())
    .then(setModules)
    .catch(() => {});
}, [areaId]);
```

Im Edit-`useEffect` (der die Lektion lädt) hinzufügen:

```typescript
setModuleId(data.module_id ?? "");
```

Im `body`-Objekt der `save`-Funktion hinzufügen:

```typescript
      module_id: moduleId || null,
```

- [ ] **Schritt 2: Dropdown im Formular einbauen**

Im JSX nach dem Bereich-Dropdown ein neues Feld einfügen:

```tsx
{
  modules.length > 0 && (
    <div>
      <label className="block text-sm font-medium mb-1">Modul</label>
      <select
        value={moduleId}
        onChange={(e) => setModuleId(e.target.value)}
        className="border rounded px-3 py-2 w-full"
      >
        <option value="">— Kein Modul —</option>
        {modules.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

Einfügeposition: direkt nach dem `</div>` des Bereich-Dropdowns (nach der `areas`-Select/Input-Logik), vor dem YouTube-URL-Feld.

- [ ] **Schritt 3: Committen**

```bash
git add components/admin/LektionEditor.tsx
git commit -m "feat: Modul-Dropdown im Lektions-Editor"
```

---

## Task 9: Pushen & Verifizieren

- [ ] **Schritt 1: Alles pushen**

```bash
git push
```

- [ ] **Schritt 2: Live verifizieren**

1. `/bereich/gewaechshaus` aufrufen — drei Modul-Abschnitte sollen sichtbar sein mit Lektionen darunter
2. Fortschritt-Haken (✓) sollen weiterhin funktionieren
3. Admin → Gewächshaus → "Module" → drei Module sollen gelistet sein
4. Admin → Lektion bearbeiten → Modul-Dropdown soll erscheinen

- [ ] **Schritt 3: Neue Lektionen anlegen**

Über Admin → Neue Lektion folgende neue Lektionen anlegen und dem richtigen Modul zuordnen:

**Modul 1:**

- Der Heilige Geist im Worship
- Gemeinde & Einheit

**Modul 2 (Musiktheorie neu strukturieren):**

- Grundlagen / Harmonie / Sound / Arrangement / Dynamik
- Vorbereitung am Instrument
- Vorbereitung als Vocalist
  _(bestehende Lektionen umbenennen oder neu anlegen)_

**Modul 3:**

- Ressourcen
- ME-1 Setup
- Pedalboard
- Keys-Sounds
- Drumset
