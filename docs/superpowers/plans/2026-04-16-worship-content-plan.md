# Worship Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Worship-Programmseite auf 3 Tabs (Gewächshaus/Tutorials/Ressourcen) umbauen, Lektionen mit Tiptap-Editor und YouTube-Video versehen, Quiz-Editor einbauen und Ressourcen mit SharePoint-Vorschau + Instrument-Filter ausstatten.

**Architecture:** Die Worship-Programm-Seite bekommt drei Client-seitige Tabs. Lektionen speichern Content als HTML in der DB und rendern ihn via Tailwind Prose. Admin bekommt dedizierte Editoren für Lektionen (Tiptap + Quiz) sowie verbesserte Formulare für Tutorials und Ressourcen.

**Tech Stack:** Next.js 16 (App Router), Supabase, Tiptap (`@tiptap/react`, `@tiptap/starter-kit`), `@tailwindcss/typography`, TypeScript, Tailwind CSS v4

---

## Dateistruktur

**Neu erstellen:**

- `lib/youtube.ts` — YouTube URL → Embed-URL Konvertierung
- `components/worship/TutorialsTab.tsx` — Client-Komponente: Tutorials mit Suche + Filter
- `components/worship/RessourcenTab.tsx` — Client-Komponente: Ressourcen mit Suche + Filter
- `components/admin/LektionEditor.tsx` — Dedizierter Admin-Editor für Lektionen
- `components/admin/QuizEditor.tsx` — Quiz-Fragen-Verwaltung innerhalb LektionEditor
- `app/api/admin/quiz-questions/route.ts` — CRUD API für Quiz-Fragen
- `lib/tests/youtube.test.ts` — Tests für YouTube-Utility

**Modifizieren:**

- `types/index.ts` — Lektion, Tutorial, Ressource Typen erweitern
- `lib/db/lektionen.ts` — getLektionById liefert neue Felder
- `app/(app)/programm/[slug]/page.tsx` — Neue Tabs für Worship
- `app/(app)/lektion/[id]/page.tsx` — Keine Materials mehr laden
- `app/(app)/lektion/[id]/LektionClient.tsx` — Content/Video rendern, canStartQuiz fixen
- `app/admin/inhalte/neu/page.tsx` — LektionEditor für type=lektion
- `app/admin/inhalte/bearbeiten/page.tsx` — LektionEditor für type=lektion
- `components/admin/ContentEditor.tsx` — Instrument-Feld + Typ-Dropdown für Tutorial/Ressource
- `app/globals.css` — Tailwind Typography Plugin

---

## Task 1: DB Migration in Supabase ausführen

**Files:**

- Kein Code — SQL direkt in Supabase Dashboard ausführen

- [ ] **Step 1: Supabase Dashboard öffnen**

Gehe zu https://supabase.com/dashboard/project/edypqdgcaiitpwtdbxgq/sql/new

- [ ] **Step 2: SQL ausführen**

```sql
-- Lektionen: Content + Video
ALTER TABLE lektionen
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_position text DEFAULT 'above'
    CHECK (video_position IN ('above', 'below'));

-- Tutorials: Instrument-Tag
ALTER TABLE tutorials
  ADD COLUMN IF NOT EXISTS instrument text;

-- Ressourcen: Instrument-Tag
ALTER TABLE ressourcen
  ADD COLUMN IF NOT EXISTS instrument text;
```

- [ ] **Step 3: Prüfen**

Gehe zu Table Editor → `lektionen` und prüfe, dass die Spalten `content`, `video_url`, `video_position` sichtbar sind. Gleiches für `tutorials.instrument` und `ressourcen.instrument`.

- [ ] **Step 4: Commit (nur Notiz)**

```bash
git commit --allow-empty -m "chore: DB migration 003 applied in Supabase (lektionen content/video, tutorials/ressourcen instrument)"
```

---

## Task 2: TypeScript-Typen aktualisieren

**Files:**

- Modify: `types/index.ts`

- [ ] **Step 1: Lektion, Tutorial, Ressource Typen erweitern**

Ersetze in `types/index.ts` die drei Interfaces:

```typescript
export interface Lektion {
  id: string;
  area_id: string;
  title: string;
  description: string;
  order: number;
  content: string | null;
  video_url: string | null;
  video_position: "above" | "below";
}

export interface Tutorial {
  id: string;
  area_id: string;
  title: string;
  video_url: string;
  description: string;
  order: number;
  instrument: string | null;
}

export interface Ressource {
  id: string;
  area_id: string;
  title: string;
  description: string;
  url: string;
  type: "pdf" | "audio" | "image" | "youtube";
  order: number;
  instrument: string | null;
}
```

- [ ] **Step 2: TypeScript-Check**

```bash
cd /Users/ich/.config/superpowers/worktrees/gewaechshaus/implementation
npx tsc --noEmit 2>&1 | head -30
```

Erwartetes Ergebnis: Keine Fehler (oder nur Fehler wegen nicht-existierender Tiptap-Packages, die in Task 4 installiert werden).

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: extend Lektion/Tutorial/Ressource types with new fields"
```

---

## Task 3: YouTube-Utility (TDD)

**Files:**

- Create: `lib/youtube.ts`
- Create: `lib/tests/youtube.test.ts`

- [ ] **Step 1: Test schreiben**

Erstelle `lib/tests/youtube.test.ts`:

```typescript
import { toYouTubeEmbedUrl, getYouTubeThumbnail } from "../youtube";

describe("toYouTubeEmbedUrl", () => {
  it("konvertiert watch-URL", () => {
    expect(
      toYouTubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("konvertiert youtu.be-URL", () => {
    expect(toYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("lässt embed-URL unverändert", () => {
    expect(toYouTubeEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("gibt null zurück bei ungültiger URL", () => {
    expect(toYouTubeEmbedUrl("https://vimeo.com/123")).toBeNull();
    expect(toYouTubeEmbedUrl("")).toBeNull();
  });
});

describe("getYouTubeThumbnail", () => {
  it("gibt Thumbnail-URL zurück", () => {
    expect(
      getYouTubeThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });

  it("gibt null zurück bei ungültiger URL", () => {
    expect(getYouTubeThumbnail("https://vimeo.com/123")).toBeNull();
  });
});
```

- [ ] **Step 2: Test ausführen — muss fehlschlagen**

```bash
cd /Users/ich/.config/superpowers/worktrees/gewaechshaus/implementation
npm test -- lib/tests/youtube.test.ts 2>&1 | tail -10
```

Erwartetes Ergebnis: `Cannot find module '../youtube'`

- [ ] **Step 3: Implementierung schreiben**

Erstelle `lib/youtube.ts`:

```typescript
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
      return u.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

export function toYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
```

- [ ] **Step 4: Tests ausführen — müssen bestehen**

```bash
npm test -- lib/tests/youtube.test.ts 2>&1 | tail -10
```

Erwartetes Ergebnis: `Tests: 6 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/youtube.ts lib/tests/youtube.test.ts
git commit -m "feat: add YouTube URL utility with tests"
```

---

## Task 4: Tiptap und Typography installieren

**Files:**

- Modify: `package.json` (via npm install)
- Modify: `app/globals.css`

- [ ] **Step 1: Packages installieren**

```bash
cd /Users/ich/.config/superpowers/worktrees/gewaechshaus/implementation
npm install @tiptap/react @tiptap/starter-kit @tailwindcss/typography
```

- [ ] **Step 2: Typography-Plugin in globals.css aktivieren**

Füge in `app/globals.css` nach `@import "tailwindcss";` ein:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

- [ ] **Step 3: Build-Check**

```bash
npm run build 2>&1 | tail -15
```

Erwartetes Ergebnis: Build erfolgreich (kein Fehler durch die neuen Packages).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app/globals.css
git commit -m "feat: install Tiptap and Tailwind Typography"
```

---

## Task 5: TutorialsTab Client-Komponente

**Files:**

- Create: `components/worship/TutorialsTab.tsx`

- [ ] **Step 1: Komponente erstellen**

Erstelle `components/worship/TutorialsTab.tsx`:

```tsx
"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { Tutorial } from "@/types";
import { getYouTubeThumbnail } from "@/lib/youtube";

interface Props {
  tutorials: Tutorial[];
}

export default function TutorialsTab({ tutorials }: Props) {
  const [search, setSearch] = useState("");
  const [instrument, setInstrument] = useState("");

  const instruments = useMemo(() => {
    const set = new Set(
      tutorials.map((t) => t.instrument).filter(Boolean) as string[],
    );
    return Array.from(set).sort();
  }, [tutorials]);

  const filtered = useMemo(() => {
    return tutorials.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const matchInstrument = !instrument || t.instrument === instrument;
      return matchSearch && matchInstrument;
    });
  }, [tutorials, search, instrument]);

  return (
    <div>
      {/* Suche + Filter */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Tutorial suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 text-sm"
        />
        {instruments.length > 0 && (
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Alle Instrumente</option>
            {instruments.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-sm">Keine Tutorials gefunden.</p>
      )}

      {/* Kachelraster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((t) => {
          const thumb = getYouTubeThumbnail(t.video_url);
          return (
            <Link
              key={t.id}
              href={`/tutorial/${t.id}`}
              className="border rounded-lg overflow-hidden hover:shadow transition"
            >
              {thumb && (
                <img
                  src={thumb}
                  alt={t.title}
                  className="w-full aspect-video object-cover"
                />
              )}
              <div className="p-3">
                <h3 className="font-semibold text-sm">{t.title}</h3>
                {t.instrument && (
                  <span className="text-xs text-blue-600 mt-1 block">
                    {t.instrument}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/worship/TutorialsTab.tsx
git commit -m "feat: add TutorialsTab component with search and instrument filter"
```

---

## Task 6: RessourcenTab Client-Komponente

**Files:**

- Create: `components/worship/RessourcenTab.tsx`

- [ ] **Step 1: Komponente erstellen**

Erstelle `components/worship/RessourcenTab.tsx`:

```tsx
"use client";
import { useState, useMemo } from "react";
import type { Ressource } from "@/types";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

interface Props {
  ressourcen: Ressource[];
}

function RessourceCard({ r }: { r: Ressource }) {
  const embedUrl = r.type === "youtube" ? toYouTubeEmbedUrl(r.url) : null;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{r.title}</h3>
          {r.instrument && (
            <span className="text-xs text-blue-600">{r.instrument}</span>
          )}
        </div>
        {r.type !== "youtube" && (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
          >
            Download
          </a>
        )}
      </div>

      {r.type === "pdf" && (
        <iframe
          src={r.url}
          className="w-full h-64 rounded border"
          title={r.title}
        />
      )}

      {r.type === "audio" && (
        <audio controls className="w-full mt-2">
          <source src={r.url} />
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm"
          >
            Audio öffnen
          </a>
        </audio>
      )}

      {r.type === "image" && (
        <img
          src={r.url}
          alt={r.title}
          className="w-full rounded mt-2 max-h-64 object-contain"
        />
      )}

      {r.type === "youtube" && embedUrl && (
        <iframe
          src={embedUrl}
          className="w-full aspect-video rounded mt-2"
          allowFullScreen
          title={r.title}
        />
      )}
    </div>
  );
}

export default function RessourcenTab({ ressourcen }: Props) {
  const [search, setSearch] = useState("");
  const [instrument, setInstrument] = useState("");

  const instruments = useMemo(() => {
    const set = new Set(
      ressourcen.map((r) => r.instrument).filter(Boolean) as string[],
    );
    return Array.from(set).sort();
  }, [ressourcen]);

  const filtered = useMemo(() => {
    return ressourcen.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
      const matchInstrument = !instrument || r.instrument === instrument;
      return matchSearch && matchInstrument;
    });
  }, [ressourcen, search, instrument]);

  return (
    <div>
      {/* Suche + Filter */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Ressource suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 text-sm"
        />
        {instruments.length > 0 && (
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Alle Instrumente</option>
            {instruments.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-sm">Keine Ressourcen gefunden.</p>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((r) => (
          <RessourceCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/worship/RessourcenTab.tsx
git commit -m "feat: add RessourcenTab with PDF/audio/image/YouTube rendering and filter"
```

---

## Task 7: Worship Programm-Seite — neue Tabs

**Files:**

- Modify: `app/(app)/programm/[slug]/page.tsx`

- [ ] **Step 1: Seite komplett ersetzen**

Ersetze den gesamten Inhalt von `app/(app)/programm/[slug]/page.tsx`:

```tsx
// app/(app)/programm/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getProgramBySlug,
  getAreaBySlug,
  getLektionenByArea,
  getTutorialsByProgram,
  getRessourcenByProgram,
} from "@/lib/db/programs";
import { getLektionProgress } from "@/lib/db/progress";
import TutorialsTab from "@/components/worship/TutorialsTab";
import RessourcenTab from "@/components/worship/RessourcenTab";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab = "gewaechshaus" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const [tutorials, ressourcen, lektionProgress] = await Promise.all([
    getTutorialsByProgram(program.id),
    getRessourcenByProgram(program.id),
    getLektionProgress(user!.id),
  ]);

  // Gewächshaus-Bereich laden
  const gewaechshausArea = await getAreaBySlug("gewaechshaus");
  const lektionen = gewaechshausArea
    ? await getLektionenByArea(gewaechshausArea.id)
    : [];
  const passedIds = new Set(
    lektionProgress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  const tabs = [
    { key: "gewaechshaus", label: "Gewächshaus" },
    { key: "tutorials", label: "Tutorials" },
    { key: "ressourcen", label: "Ressourcen" },
  ];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/dashboard"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
      <p className="text-gray-600 mb-6">{program.description}</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/programm/${slug}?tab=${t.key}`}
            className={`px-4 py-2 -mb-px border-b-2 transition ${
              tab === t.key
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-500"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* GEWÄCHSHAUS */}
      {tab === "gewaechshaus" && (
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
                {l.description && (
                  <p className="text-sm text-gray-500">{l.description}</p>
                )}
              </div>
              {passedIds.has(l.id) && (
                <span className="text-green-600 text-xl">✓</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* TUTORIALS */}
      {tab === "tutorials" && <TutorialsTab tutorials={tutorials} />}

      {/* RESSOURCEN */}
      {tab === "ressourcen" && <RessourcenTab ressourcen={ressourcen} />}
    </main>
  );
}
```

**Hinweis:** `getLektionenByArea` ist in `lib/db/lektionen.ts`, nicht in `lib/db/programs.ts`. Den Import entsprechend anpassen:

```tsx
import { getLektionenByArea } from "@/lib/db/lektionen";
```

- [ ] **Step 2: TypeScript-Check**

```bash
cd /Users/ich/.config/superpowers/worktrees/gewaechshaus/implementation
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/programm/\[slug\]/page.tsx
git commit -m "feat: Worship-Programmseite auf 3 Tabs (Gewächshaus/Tutorials/Ressourcen) umgestellt"
```

---

## Task 8: Lektion-Seite — Content + Video anzeigen

**Files:**

- Modify: `app/(app)/lektion/[id]/page.tsx`
- Modify: `app/(app)/lektion/[id]/LektionClient.tsx`

- [ ] **Step 1: page.tsx — Materials nicht mehr laden**

Ersetze `app/(app)/lektion/[id]/page.tsx`:

```tsx
// app/(app)/lektion/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getLektionById,
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

  const [lektion, questions, badge, lastAttempt] = await Promise.all([
    getLektionById(id),
    getQuizQuestions(id),
    getBadgeByLektion(id),
    getLastQuizAttempt(user!.id, id),
  ]);

  if (!lektion) notFound();

  const { data: progressRow } = await supabase
    .from("lektion_progress")
    .select("passed")
    .eq("user_id", user!.id)
    .eq("lektion_id", id)
    .single();

  let lockedUntil: string | null = null;
  if (lastAttempt && !lastAttempt.passed) {
    const unlockTime =
      new Date(lastAttempt.attempted_at).getTime() + 24 * 60 * 60 * 1000;
    if (Date.now() < unlockTime) {
      lockedUntil = new Date(unlockTime).toISOString();
    }
  }

  return (
    <LektionClient
      lektion={lektion}
      questions={questions}
      badge={badge}
      passed={progressRow?.passed ?? false}
      lockedUntil={lockedUntil}
    />
  );
}
```

- [ ] **Step 2: LektionClient.tsx — neues Layout**

Ersetze `app/(app)/lektion/[id]/LektionClient.tsx`:

```tsx
// app/(app)/lektion/[id]/LektionClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lektion, QuizQuestion, Badge } from "@/types";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

interface Props {
  lektion: Lektion;
  questions: QuizQuestion[];
  badge: Badge | null;
  passed: boolean;
  lockedUntil: string | null;
}

export default function LektionClient({
  lektion,
  questions,
  badge,
  passed,
  lockedUntil,
}: Props) {
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(
    questions.map(() => null),
  );
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);

  const embedUrl = lektion.video_url
    ? toYouTubeEmbedUrl(lektion.video_url)
    : null;
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

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

  const videoBlock = embedUrl ? (
    <iframe
      src={embedUrl}
      className="w-full aspect-video rounded-lg mb-8"
      allowFullScreen
      title={lektion.title}
    />
  ) : null;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <Link
        href="javascript:history.back()"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Zurück
      </Link>
      <h1 className="text-3xl font-bold mb-2">{lektion.title}</h1>
      {lektion.description && (
        <p className="text-gray-600 mb-6">{lektion.description}</p>
      )}

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

      {/* Video oben */}
      {lektion.video_position !== "below" && videoBlock}

      {/* Text-Content */}
      {lektion.content && (
        <div
          className="prose prose-sm max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: lektion.content }}
        />
      )}

      {/* Video unten */}
      {lektion.video_position === "below" && videoBlock}

      {/* Quiz */}
      {questions.length > 0 && !passed && (
        <section className="mt-8">
          {isLocked && (
            <p className="text-orange-600 text-sm mb-4">
              Nächster Versuch möglich ab{" "}
              {new Date(lockedUntil!).toLocaleString("de-DE")}.
            </p>
          )}
          {!showQuiz ? (
            <button
              onClick={() => setShowQuiz(true)}
              disabled={Boolean(isLocked)}
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
                  className={`rounded-lg p-4 border ${quizResult.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
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

- [ ] **Step 3: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/lektion/\[id\]/page.tsx app/\(app\)/lektion/\[id\]/LektionClient.tsx
git commit -m "feat: Lektion-Seite zeigt Tiptap-Content und YouTube-Video statt Materials"
```

---

## Task 9: Admin — Quiz-API

**Files:**

- Create: `app/api/admin/quiz-questions/route.ts`

- [ ] **Step 1: Route erstellen**

Erstelle `app/api/admin/quiz-questions/route.ts`:

```typescript
// app/api/admin/quiz-questions/route.ts
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

  const { lektionId, question, options, correctIndex, order } =
    await request.json();
  const db = createAdminClient();
  const { data, error } = await db
    .from("quiz_questions")
    .insert({
      lektion_id: lektionId,
      question,
      options,
      correct_index: correctIndex,
      order,
    })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, question, options, correctIndex } = await request.json();
  const db = createAdminClient();
  const { data, error } = await db
    .from("quiz_questions")
    .update({ question, options, correct_index: correctIndex })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  const db = createAdminClient();
  const { error } = await db.from("quiz_questions").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/quiz-questions/route.ts
git commit -m "feat: add quiz-questions admin API (POST/PATCH/DELETE)"
```

---

## Task 10: Admin — QuizEditor Komponente

**Files:**

- Create: `components/admin/QuizEditor.tsx`

- [ ] **Step 1: Komponente erstellen**

Erstelle `components/admin/QuizEditor.tsx`:

```tsx
// components/admin/QuizEditor.tsx
"use client";
import { useState } from "react";
import type { QuizQuestion } from "@/types";

interface Props {
  lektionId: string;
  initialQuestions: QuizQuestion[];
}

interface DraftQuestion {
  id?: string;
  question: string;
  options: string[];
  correctIndex: number;
}

function emptyQuestion(): DraftQuestion {
  return { question: "", options: ["", ""], correctIndex: 0 };
}

export default function QuizEditor({ lektionId, initialQuestions }: Props) {
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    initialQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      options: [...q.options],
      correctIndex: q.correct_index,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateQuestion(idx: number, field: Partial<DraftQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...field } : q)),
    );
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[oIdx] = value;
        return { ...q, options };
      }),
    );
  }

  function addOption(qIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.filter((_, j) => j !== oIdx);
        const correctIndex =
          q.correctIndex >= options.length ? 0 : q.correctIndex;
        return { ...q, options, correctIndex };
      }),
    );
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");

    // Bestehende Fragen updaten, neue erstellen
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.id) {
        await fetch("/api/admin/quiz-questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: q.id,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
          }),
        });
      } else {
        const res = await fetch("/api/admin/quiz-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lektionId,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            order: i,
          }),
        });
        const data = await res.json();
        setQuestions((prev) =>
          prev.map((pq, pi) => (pi === i ? { ...pq, id: data.id } : pq)),
        );
      }
    }

    // Gelöschte Fragen (nicht mehr in questions, aber hatten eine ID) löschen
    for (const orig of initialQuestions) {
      if (!questions.find((q) => q.id === orig.id)) {
        await fetch("/api/admin/quiz-questions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: orig.id }),
        });
      }
    }

    setSaving(false);
    setMessage("Quiz gespeichert.");
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-lg font-semibold mb-4">Quiz-Fragen</h2>

      {questions.map((q, qi) => (
        <div key={qi} className="border rounded-lg p-4 mb-4 bg-gray-50">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-sm">Frage {qi + 1}</span>
            <button
              onClick={() => removeQuestion(qi)}
              className="text-red-500 text-xs hover:underline"
            >
              Löschen
            </button>
          </div>

          <input
            value={q.question}
            onChange={(e) => updateQuestion(qi, { question: e.target.value })}
            placeholder="Fragetext..."
            className="border rounded px-3 py-2 w-full text-sm mb-3"
          />

          <p className="text-xs text-gray-500 mb-2">Antworten (● = richtig)</p>
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                name={`correct-${qi}`}
                checked={q.correctIndex === oi}
                onChange={() => updateQuestion(qi, { correctIndex: oi })}
              />
              <input
                value={opt}
                onChange={(e) => updateOption(qi, oi, e.target.value)}
                placeholder={`Antwort ${oi + 1}`}
                className="border rounded px-2 py-1 text-sm flex-1"
              />
              {q.options.length > 2 && (
                <button
                  onClick={() => removeOption(qi, oi)}
                  className="text-red-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {q.options.length < 4 && (
            <button
              onClick={() => addOption(qi)}
              className="text-blue-600 text-xs hover:underline"
            >
              + Antwort hinzufügen
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
        className="text-blue-600 text-sm hover:underline mb-4 block"
      >
        + Frage hinzufügen
      </button>

      <button
        onClick={saveAll}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {saving ? "Speichern..." : "Quiz speichern"}
      </button>
      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/QuizEditor.tsx
git commit -m "feat: add QuizEditor component with add/edit/delete questions"
```

---

## Task 11: Admin — LektionEditor mit Tiptap

**Files:**

- Create: `components/admin/LektionEditor.tsx`
- Modify: `app/admin/inhalte/neu/page.tsx`
- Modify: `app/admin/inhalte/bearbeiten/page.tsx`

- [ ] **Step 1: LektionEditor erstellen**

Erstelle `components/admin/LektionEditor.tsx`:

```tsx
// components/admin/LektionEditor.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import QuizEditor from "./QuizEditor";
import type { QuizQuestion } from "@/types";

interface Props {
  lektionId?: string; // wenn gesetzt: Bearbeiten-Modus
}

export default function LektionEditor({ lektionId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(lektionId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPosition, setVideoPosition] = useState<"above" | "below">(
    "above",
  );
  const [order, setOrder] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
  });

  // Bereiche laden
  useEffect(() => {
    fetch("/api/admin/areas-list")
      .then((r) => r.json())
      .then(setAreas)
      .catch(() => {});
  }, []);

  // Bestehende Daten laden (Bearbeiten-Modus)
  useEffect(() => {
    if (!isEdit || !lektionId) return;
    fetch(`/api/admin/content-get?table=lektionen&id=${lektionId}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setAreaId(data.area_id ?? "");
        setVideoUrl(data.video_url ?? "");
        setVideoPosition(data.video_position ?? "above");
        setOrder(String(data.order ?? 0));
        if (editor && data.content) editor.commands.setContent(data.content);
      });

    // Quiz-Fragen laden
    fetch(`/api/admin/quiz-list?lektionId=${lektionId}`)
      .then((r) => r.json())
      .then(setQuizQuestions)
      .catch(() => {});
  }, [isEdit, lektionId, editor]);

  async function save() {
    setSaving(true);
    setError(null);
    const content = editor?.getHTML() ?? "";
    const body = {
      title,
      description,
      area_id: areaId,
      video_url: videoUrl || null,
      video_position: videoPosition,
      order: parseInt(order),
      content,
    };

    const res = await fetch("/api/admin/content", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "lektionen", id: lektionId, data: body }),
    });

    if (!res.ok) {
      const e = await res.json();
      setError(e.error);
      setSaving(false);
      return;
    }
    router.push("/admin/inhalte");
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "Lektion bearbeiten" : "Neue Lektion"}
      </h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Beschreibung (kurz)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bereich</label>
          {areas.length > 0 ? (
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">— Bereich wählen —</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              placeholder="area_id"
              className="border rounded px-3 py-2 w-full"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            YouTube-URL (optional)
          </label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Video-Position
          </label>
          <select
            value={videoPosition}
            onChange={(e) =>
              setVideoPosition(e.target.value as "above" | "below")
            }
            className="border rounded px-3 py-2 w-full"
          >
            <option value="above">Oben (vor Text)</option>
            <option value="below">Unten (nach Text)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reihenfolge</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="border rounded px-3 py-2 w-32"
          />
        </div>

        {/* Tiptap Editor */}
        <div>
          <label className="block text-sm font-medium mb-2">Inhalt</label>
          {/* Toolbar */}
          <div className="flex gap-1 border border-b-0 rounded-t px-2 py-1 bg-gray-50">
            {[
              {
                label: "B",
                action: () => editor?.chain().focus().toggleBold().run(),
                title: "Fett",
              },
              {
                label: "I",
                action: () => editor?.chain().focus().toggleItalic().run(),
                title: "Kursiv",
              },
              {
                label: "H2",
                action: () =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                title: "Überschrift 2",
              },
              {
                label: "H3",
                action: () =>
                  editor?.chain().focus().toggleHeading({ level: 3 }).run(),
                title: "Überschrift 3",
              },
              {
                label: "• Liste",
                action: () => editor?.chain().focus().toggleBulletList().run(),
                title: "Aufzählung",
              },
              {
                label: "1. Liste",
                action: () => editor?.chain().focus().toggleOrderedList().run(),
                title: "Nummerierte Liste",
              },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                title={btn.title}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
              >
                {btn.label}
              </button>
            ))}
          </div>
          <EditorContent
            editor={editor}
            className="border rounded-b min-h-48 px-3 py-2 prose prose-sm max-w-none focus-within:outline-none"
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Speichern..." : "Speichern"}
      </button>

      {/* Quiz-Editor (nur im Bearbeiten-Modus) */}
      {isEdit && lektionId && (
        <QuizEditor lektionId={lektionId} initialQuestions={quizQuestions} />
      )}
    </main>
  );
}
```

- [ ] **Step 2: API-Route für Bereich-Liste erstellen**

Erstelle `app/api/admin/areas-list/route.ts`:

```typescript
// app/api/admin/areas-list/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const db = createAdminClient();
  const { data } = await db.from("areas").select("id, name").order("name");
  return NextResponse.json(data ?? []);
}
```

- [ ] **Step 3: API-Route für Quiz-Liste erstellen**

Erstelle `app/api/admin/quiz-list/route.ts`:

```typescript
// app/api/admin/quiz-list/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lektionId = request.nextUrl.searchParams.get("lektionId");
  if (!lektionId) return NextResponse.json([]);
  const db = createAdminClient();
  const { data } = await db
    .from("quiz_questions")
    .select("*")
    .eq("lektion_id", lektionId)
    .order("order");
  return NextResponse.json(data ?? []);
}
```

- [ ] **Step 4: Admin-Seiten umleiten**

Ersetze `app/admin/inhalte/neu/page.tsx`:

```tsx
// app/admin/inhalte/neu/page.tsx
import { Suspense } from "react";
import LektionEditor from "@/components/admin/LektionEditor";
import ContentEditor from "@/components/admin/ContentEditor";

async function NeuPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  if (type === "lektion") return <LektionEditor />;
  return <ContentEditor />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  return (
    <Suspense>
      <NeuPage searchParams={searchParams} />
    </Suspense>
  );
}
```

Ersetze `app/admin/inhalte/bearbeiten/page.tsx`:

```tsx
// app/admin/inhalte/bearbeiten/page.tsx
import { Suspense } from "react";
import LektionEditor from "@/components/admin/LektionEditor";
import ContentEditor from "@/components/admin/ContentEditor";

async function BearbeitenPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const { type, id } = await searchParams;
  if (type === "lektion" && id) return <LektionEditor lektionId={id} />;
  return <ContentEditor />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  return (
    <Suspense>
      <BearbeitenPage searchParams={searchParams} />
    </Suspense>
  );
}
```

- [ ] **Step 5: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add components/admin/LektionEditor.tsx components/admin/QuizEditor.tsx \
  app/api/admin/areas-list/route.ts app/api/admin/quiz-list/route.ts \
  app/admin/inhalte/neu/page.tsx app/admin/inhalte/bearbeiten/page.tsx
git commit -m "feat: LektionEditor with Tiptap, video position, and QuizEditor"
```

---

## Task 12: Admin — Tutorial & Ressource Formulare verbessern

**Files:**

- Modify: `components/admin/ContentEditor.tsx`
- Modify: `app/admin/inhalte/page.tsx` (Link zu /neu?type=lektion)

- [ ] **Step 1: ContentEditor um Instrument-Feld + Ressource-Typ-Dropdown erweitern**

Öffne `components/admin/ContentEditor.tsx`. Ersetze die `fieldDefs` für `tutorial` und `ressource` und passe das Rendering an.

Ändere in der `fieldDefs`:

```typescript
const fieldDefs: Record<string, string[]> = {
  program: ["name", "slug", "description", "order"],
  area: ["name", "slug", "description", "order", "program_id"],
  lektion: ["title", "description", "order", "area_id"], // nur noch Fallback
  tutorial: [
    "title",
    "video_url",
    "description",
    "instrument",
    "order",
    "area_id",
  ],
  ressource: [
    "title",
    "type",
    "description",
    "url",
    "instrument",
    "order",
    "area_id",
  ],
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
```

Ändere das Rendering-Block (innerhalb der `.map((f) => (...))` Schleife) — ersetze die Textarea/Input-Entscheidung:

```tsx
{
  (fieldDefs[type] ?? []).map((f) => (
    <div key={f}>
      <label className="block text-sm font-medium mb-1">
        {f === "video_url"
          ? "YouTube-URL"
          : f === "instrument"
            ? "Instrument (optional)"
            : f === "area_id"
              ? "Bereich-ID"
              : f}
      </label>
      {f === "type" && type === "ressource" ? (
        <select
          value={fields[f] ?? ""}
          onChange={(e) => setFields({ ...fields, [f]: e.target.value })}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">— Typ wählen —</option>
          <option value="pdf">PDF</option>
          <option value="audio">Audio</option>
          <option value="image">Bild</option>
          <option value="youtube">YouTube</option>
        </select>
      ) : f === "content" || f === "description" ? (
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
          placeholder={
            f === "video_url"
              ? "https://www.youtube.com/watch?v=..."
              : undefined
          }
        />
      )}
    </div>
  ));
}
```

- [ ] **Step 2: Admin Inhalte-Seite — Link für neue Lektion**

Lies `app/admin/inhalte/page.tsx` und prüfe, ob dort ein "Neue Lektion"-Button existiert. Falls vorhanden, ändere den Link von `/admin/inhalte/neu?type=lektion` sicher ab, dass er auf den LektionEditor zeigt (dieser Link sollte bereits korrekt sein wenn der Button `type=lektion` nutzt).

- [ ] **Step 3: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/ContentEditor.tsx
git commit -m "feat: ContentEditor bekommt Instrument-Feld und Ressource-Typ-Dropdown"
```

---

## Task 13: Deploy + E2E-Test

**Files:**

- Kein Code

- [ ] **Step 1: Push zu GitHub (Vercel deployt automatisch)**

```bash
cd /Users/ich/.config/superpowers/worktrees/gewaechshaus/implementation
git push
```

- [ ] **Step 2: Deployment abwarten (~2 Minuten)**

```bash
npx vercel ls 2>&1 | head -5
```

Warten bis neuester Eintrag `● Ready` zeigt.

- [ ] **Step 3: Worship-Programmseite testen**

Öffne die App → Dashboard → Worship-Programm. Prüfe:

- [ ] Tab "Gewächshaus" zeigt Lektionsliste
- [ ] Tab "Tutorials" zeigt leere Liste (noch keine Tutorials mit `instrument` Feld)
- [ ] Tab "Ressourcen" zeigt leere Liste

- [ ] **Step 4: Admin Lektion anlegen**

Gehe zu `/admin/inhalte/neu?type=lektion`:

- [ ] Titel eingeben
- [ ] YouTube-URL eingeben
- [ ] Text im Tiptap-Editor tippen (fett, Liste testen)
- [ ] Speichern
- [ ] Lektion erscheint in Gewächshaus-Tab

- [ ] **Step 5: Quiz anlegen**

Gehe zu `/admin/inhalte/bearbeiten?type=lektion&id=<id>`:

- [ ] Quiz-Frage hinzufügen
- [ ] Antworten eintragen, richtige markieren
- [ ] Quiz speichern
- [ ] Lektion öffnen → Quiz erscheint und ist durchführbar

- [ ] **Step 6: Tutorial anlegen**

Gehe zu `/admin/inhalte/neu?type=tutorial`:

- [ ] YouTube-URL eintragen
- [ ] Instrument eintragen (z.B. "Gitarre")
- [ ] Speichern
- [ ] Tutorials-Tab zeigt Tutorial mit Thumbnail + Instrument-Tag
- [ ] Filter nach "Gitarre" funktioniert

- [ ] **Step 7: Ressource anlegen**

Gehe zu `/admin/inhalte/neu?type=ressource`:

- [ ] Typ "PDF" wählen
- [ ] SharePoint-Link einfügen
- [ ] Instrument eintragen
- [ ] Speichern → Ressourcen-Tab zeigt PDF-Vorschau + Download-Button
