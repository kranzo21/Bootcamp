# Gewächshaus Walkthrough — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vollbild-Walkthrough-Erlebnis für das Gewächshaus — sequenzielle Lektionen mit H5P-Abschluss-Erkennung, eigenem Layout ohne Navbar, und Abschlussprüfung am Ende.

**Architecture:** Neue Route-Gruppe `(walkthrough)` unabhängig von `(app)`. Lektionen werden nach Modul- und Lektions-Reihenfolge sortiert. H5P-Abschluss wird via xAPI-Event erkannt. Fortschritt wird mit bestehendem `lektion_progress`-System gespeichert.

**Tech Stack:** Next.js App Router, Supabase, TypeScript, Tailwind, h5p-standalone

---

## Dateien — Überblick

| Datei                                                           | Aktion                                                |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| `lib/db/cached.ts`                                              | ÄNDERN — `getCachedGewächshausWalkthrough` hinzufügen |
| `app/api/lektion-complete/route.ts`                             | NEU — Lektion als abgeschlossen markieren             |
| `components/ui/H5PPlayer.tsx`                                   | ÄNDERN — `onComplete`-Prop hinzufügen                 |
| `app/(walkthrough)/gewächshaus/layout.tsx`                      | NEU — Vollbild-Layout ohne Navbar                     |
| `app/(walkthrough)/gewächshaus/page.tsx`                        | NEU — Redirect zum aktuellen Schritt                  |
| `app/(walkthrough)/gewächshaus/[schritt]/page.tsx`              | NEU — Walkthrough-Seite                               |
| `app/(walkthrough)/gewächshaus/[schritt]/WalkthroughClient.tsx` | NEU — Client-Komponente                               |
| `app/(walkthrough)/gewächshaus/pruefung/page.tsx`               | NEU — Abschlussprüfung                                |
| `app/(app)/bereich/[slug]/page.tsx`                             | ÄNDERN — Start/Weitermachen-Button                    |

---

## Task 1: Datenbank-Query für Walkthrough

**Files:**

- Modify: `lib/db/cached.ts`

- [ ] **Schritt 1: `getCachedGewächshausWalkthrough` am Ende von `lib/db/cached.ts` hinzufügen**

Diese Funktion gibt alle Gewächshaus-Lektionen zurück, sortiert nach Modul-Reihenfolge, dann Lektions-Reihenfolge, mit dem Modul-Namen dabei:

```typescript
export const getCachedGewächshausWalkthrough = unstable_cache(
  async () => {
    const db = createAdminClient();

    const { data: area } = await db
      .from("areas")
      .select("id")
      .eq("slug", "gewaechshaus")
      .single();

    if (!area) return { lektionen: [], modules: [] };

    const [{ data: modules }, { data: lektionen }] = await Promise.all([
      db.from("modules").select("*").eq("area_id", area.id).order("order"),
      db
        .from("lektionen")
        .select("*")
        .eq("area_id", area.id)
        .eq("status", "published"),
    ]);

    const modulesData = (modules ?? []) as import("@/types").Module[];
    const lektionenData = (lektionen ?? []) as import("@/types").Lektion[];

    const moduleOrderMap = new Map(modulesData.map((m) => [m.id, m.order]));

    const sorted = lektionenData.sort((a, b) => {
      const ma = moduleOrderMap.get(a.module_id ?? "") ?? 999;
      const mb = moduleOrderMap.get(b.module_id ?? "") ?? 999;
      if (ma !== mb) return ma - mb;
      return a.order - b.order;
    });

    return { lektionen: sorted, modules: modulesData };
  },
  ["gewächshaus-walkthrough"],
  { revalidate: 60, tags: ["lektionen", "modules"] },
);
```

- [ ] **Schritt 2: Committen**

```bash
git add lib/db/cached.ts
git commit -m "feat: getCachedGewächshausWalkthrough Query"
```

---

## Task 2: API-Route — Lektion abschließen

**Files:**

- Create: `app/api/lektion-complete/route.ts`

- [ ] **Schritt 1: Ordner und Datei anlegen**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lektionId } = await req.json();
  if (!lektionId)
    return NextResponse.json({ error: "Missing lektionId" }, { status: 400 });

  const { error } = await supabase.from("lektion_progress").upsert(
    {
      user_id: user.id,
      lektion_id: lektionId,
      passed: true,
      materials_completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lektion_id" },
  );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Schritt 2: Committen**

```bash
git add app/api/lektion-complete/route.ts
git commit -m "feat: POST /api/lektion-complete"
```

---

## Task 3: H5PPlayer mit onComplete-Callback

**Files:**

- Modify: `components/ui/H5PPlayer.tsx`

- [ ] **Schritt 1: Datei vollständig ersetzen**

```typescript
"use client";
import { useEffect, useRef } from "react";

interface Props {
  contentPath: string;
  onComplete?: () => void;
}

export default function H5PPlayer({ contentPath, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const id = `h5p-${Math.random().toString(36).slice(2)}`;
    containerRef.current.id = id;

    import("h5p-standalone").then(({ default: H5P }) => {
      new H5P(`#${id}`, {
        h5pJsonPath: contentPath,
        frameJs: "/h5p-assets/frame.bundle.js",
        frameCss: "/h5p-assets/styles/h5p.css",
      });

      if (onComplete) {
        const H5PGlobal = (window as any).H5P;
        if (H5PGlobal?.externalDispatcher) {
          H5PGlobal.externalDispatcher.on("xAPI", (event: any) => {
            if (event?.data?.statement?.result?.success === true) {
              onComplete();
            }
          });
        }
      }
    });
  }, [contentPath, onComplete]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
```

- [ ] **Schritt 2: Committen**

```bash
git add components/ui/H5PPlayer.tsx
git commit -m "feat: H5PPlayer onComplete-Callback via xAPI"
```

---

## Task 4: Walkthrough-Layout (kein Navbar)

**Files:**

- Create: `app/(walkthrough)/gewächshaus/layout.tsx`

- [ ] **Schritt 1: Ordner-Struktur anlegen und Layout erstellen**

```bash
mkdir -p "app/(walkthrough)/gewächshaus"
```

```typescript
// app/(walkthrough)/gewächshaus/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function WalkthroughLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <div className="min-h-screen bg-cream">{children}</div>;
}
```

- [ ] **Schritt 2: Committen**

```bash
git add "app/(walkthrough)/gewächshaus/layout.tsx"
git commit -m "feat: Walkthrough Layout ohne Navbar"
```

---

## Task 5: /gewächshaus — Redirect zur aktuellen Position

**Files:**

- Create: `app/(walkthrough)/gewächshaus/page.tsx`

- [ ] **Schritt 1: Datei anlegen**

```typescript
// app/(walkthrough)/gewächshaus/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCachedGewächshausWalkthrough } from "@/lib/db/cached";
import { getLektionProgress } from "@/lib/db/progress";

export default async function GewächshausPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ lektionen }, progress] = await Promise.all([
    getCachedGewächshausWalkthrough(),
    getLektionProgress(user!.id),
  ]);

  const passedIds = new Set(
    progress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  const firstIncomplete = lektionen.findIndex((l) => !passedIds.has(l.id));

  if (firstIncomplete === -1) redirect("/gewächshaus/pruefung");
  redirect(`/gewächshaus/${firstIncomplete + 1}`);
}
```

- [ ] **Schritt 2: Committen**

```bash
git add "app/(walkthrough)/gewächshaus/page.tsx"
git commit -m "feat: /gewächshaus Redirect zur aktuellen Position"
```

---

## Task 6: WalkthroughClient — Client-Komponente

**Files:**

- Create: `app/(walkthrough)/gewächshaus/[schritt]/WalkthroughClient.tsx`

- [ ] **Schritt 1: Ordner anlegen**

```bash
mkdir -p "app/(walkthrough)/gewächshaus/[schritt]"
```

- [ ] **Schritt 2: WalkthroughClient.tsx anlegen**

```typescript
// app/(walkthrough)/gewächshaus/[schritt]/WalkthroughClient.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import H5PPlayer from "@/components/ui/H5PPlayer";
import type { Lektion } from "@/types";

interface Props {
  lektion: Lektion;
  moduleName: string;
  schritt: number;
  totalSchritte: number;
  nextHref: string;
  alreadyCompleted: boolean;
}

export default function WalkthroughClient({
  lektion,
  moduleName,
  schritt,
  totalSchritte,
  nextHref,
  alreadyCompleted,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [h5pDone, setH5pDone] = useState(alreadyCompleted);

  const hasH5P = Boolean(lektion.h5p_content_path);
  const canComplete = !hasH5P || h5pDone || alreadyCompleted;
  const progress = Math.round(((schritt - 1) / totalSchritte) * 100);
  const embedUrl = lektion.video_url ? toYouTubeEmbedUrl(lektion.video_url) : null;

  async function complete() {
    if (!canComplete || isPending) return;
    if (!alreadyCompleted) {
      await fetch("/api/lektion-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lektionId: lektion.id }),
      });
    }
    startTransition(() => router.push(nextHref));
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm px-5 pt-5 pb-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/bereich/gewaechshaus"
              className="text-[10px] uppercase tracking-[2px] text-gray-mid hover:text-teal transition-colors"
            >
              ← Übersicht
            </Link>
            <span className="text-[10px] uppercase tracking-[2px] text-gray-mid">
              Schritt {schritt} von {totalSchritte}
            </span>
          </div>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-1 bg-teal rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-5 py-8">
        <p className="text-[10px] uppercase tracking-[3px] text-gray-mid mb-2">
          {moduleName}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">
          {lektion.title}
        </h1>

        {/* Video oben */}
        {lektion.video_position !== "below" && embedUrl && (
          <iframe
            src={embedUrl}
            className="w-full aspect-video rounded-2xl mb-8"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={lektion.title}
          />
        )}

        {/* Text */}
        {lektion.content && (
          <div
            className="prose prose-sm max-w-none text-ink/80 mb-8"
            dangerouslySetInnerHTML={{ __html: lektion.content }}
          />
        )}

        {/* Video unten */}
        {lektion.video_position === "below" && embedUrl && (
          <iframe
            src={embedUrl}
            className="w-full aspect-video rounded-2xl mb-8"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={lektion.title}
          />
        )}

        {/* H5P */}
        {lektion.h5p_content_path && (
          <div className="mb-8">
            <H5PPlayer
              contentPath={lektion.h5p_content_path}
              onComplete={() => setH5pDone(true)}
            />
            {!h5pDone && !alreadyCompleted && (
              <p className="text-xs text-gray-mid text-center mt-3">
                Schließe die interaktive Aufgabe ab um weiterzumachen.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer — Button */}
      <div className="sticky bottom-0 bg-cream/95 backdrop-blur-sm border-t border-border px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={complete}
            disabled={!canComplete || isPending}
            className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-[2px] transition-all duration-300 ${
              canComplete
                ? "bg-teal text-white hover:bg-teal/90"
                : "bg-border text-gray-mid cursor-not-allowed"
            }`}
          >
            {isPending ? "Weiter…" : "Lektion abschließen →"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 3: Committen**

```bash
git add "app/(walkthrough)/gewächshaus/[schritt]/WalkthroughClient.tsx"
git commit -m "feat: WalkthroughClient mit H5P-Abschluss und Button-Logik"
```

---

## Task 7: /gewächshaus/[schritt] — Server-Seite

**Files:**

- Create: `app/(walkthrough)/gewächshaus/[schritt]/page.tsx`

- [ ] **Schritt 1: Datei anlegen**

```typescript
// app/(walkthrough)/gewächshaus/[schritt]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getCachedGewächshausWalkthrough } from "@/lib/db/cached";
import { getLektionProgress } from "@/lib/db/progress";
import WalkthroughClient from "./WalkthroughClient";

export default async function WalkthroughSchrittPage({
  params,
}: {
  params: Promise<{ schritt: string }>;
}) {
  const { schritt: schrittStr } = await params;
  const schritt = parseInt(schrittStr, 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ lektionen, modules }, progress] = await Promise.all([
    getCachedGewächshausWalkthrough(),
    getLektionProgress(user!.id),
  ]);

  if (!lektionen.length || schritt < 1 || schritt > lektionen.length) notFound();

  const lektion = lektionen[schritt - 1];
  const passedIds = new Set(
    progress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  // Gesperrt: vorherige Lektion noch nicht abgeschlossen
  if (schritt > 1 && !passedIds.has(lektionen[schritt - 2].id)) {
    redirect("/gewächshaus");
  }

  const modul = modules.find((m) => m.id === lektion.module_id);
  const isLast = schritt === lektionen.length;
  const nextHref = isLast ? "/gewächshaus/pruefung" : `/gewächshaus/${schritt + 1}`;

  return (
    <WalkthroughClient
      lektion={lektion}
      moduleName={modul?.name ?? ""}
      schritt={schritt}
      totalSchritte={lektionen.length}
      nextHref={nextHref}
      alreadyCompleted={passedIds.has(lektion.id)}
    />
  );
}
```

- [ ] **Schritt 2: Committen**

```bash
git add "app/(walkthrough)/gewächshaus/[schritt]/page.tsx"
git commit -m "feat: Walkthrough Schritt-Seite"
```

---

## Task 8: /gewächshaus/pruefung — Abschlussprüfung

**Files:**

- Create: `app/(walkthrough)/gewächshaus/pruefung/page.tsx`

- [ ] **Schritt 1: Ordner anlegen und Datei erstellen**

```bash
mkdir -p "app/(walkthrough)/gewächshaus/pruefung"
```

```typescript
// app/(walkthrough)/gewächshaus/pruefung/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCachedGewächshausWalkthrough } from "@/lib/db/cached";
import { getLektionProgress } from "@/lib/db/progress";
import Link from "next/link";
import PruefungClient from "./PruefungClient";

export default async function PruefungPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ lektionen }, progress] = await Promise.all([
    getCachedGewächshausWalkthrough(),
    getLektionProgress(user!.id),
  ]);

  const passedIds = new Set(
    progress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  const allDone = lektionen.every((l) => passedIds.has(l.id));
  if (!allDone) redirect("/gewächshaus");

  return <PruefungClient />;
}
```

- [ ] **Schritt 2: PruefungClient.tsx anlegen**

```typescript
// app/(walkthrough)/gewächshaus/pruefung/PruefungClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import H5PPlayer from "@/components/ui/H5PPlayer";

const H5P_EXAM_PATH = "/h5p-content/gewächshaus-pruefung";

export default function PruefungClient() {
  const [done, setDone] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm px-5 pt-5 pb-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/bereich/gewaechshaus"
              className="text-[10px] uppercase tracking-[2px] text-gray-mid hover:text-teal transition-colors"
            >
              ← Übersicht
            </Link>
            <span className="text-[10px] uppercase tracking-[2px] text-gray-mid">
              Abschlussprüfung
            </span>
          </div>
          <div className="h-1 bg-teal rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-5 py-8">
        {done ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6">
            <div className="text-6xl">🎉</div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Gewächshaus abgeschlossen!
            </h1>
            <p className="text-gray-mid text-sm max-w-sm">
              Du hast alle Lektionen und die Abschlussprüfung erfolgreich
              abgeschlossen. Willkommen im Worship Team.
            </p>
            <Link
              href="/dashboard"
              className="bg-teal text-white font-bold text-xs uppercase tracking-[2px] px-8 py-4 rounded-2xl hover:bg-teal/90 transition-colors"
            >
              Zum Dashboard →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-[3px] text-gray-mid mb-2">
              Gewächshaus
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">
              Abschlussprüfung
            </h1>
            <H5PPlayer
              contentPath={H5P_EXAM_PATH}
              onComplete={() => setDone(true)}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Schritt 3: Committen**

```bash
git add "app/(walkthrough)/gewächshaus/pruefung/"
git commit -m "feat: Abschlussprüfung Seite"
```

---

## Task 9: Bereich-Seite — Start/Weitermachen-Button

**Files:**

- Modify: `app/(app)/bereich/[slug]/page.tsx`

- [ ] **Schritt 1: Für Gewächshaus Button oben hinzufügen**

Die Datei `app/(app)/bereich/[slug]/page.tsx` vollständig ersetzen:

```typescript
// app/(app)/bereich/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getCachedAreaBySlug,
  getCachedProgramById,
  getCachedLektionenByArea,
  getCachedModulesByArea,
  getCachedGewächshausWalkthrough,
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

  const isGewächshaus = slug === "gewaechshaus";

  const [lektionen, progress, program, profileResult, modules] =
    await Promise.all([
      getCachedLektionenByArea(area.id),
      getLektionProgress(user!.id),
      getCachedProgramById(area.program_id),
      supabase.from("users").select("is_admin").eq("id", user!.id).single(),
      getCachedModulesByArea(area.id),
    ]);

  const passedIds = progress.filter((p) => p.passed).map((p) => p.lektion_id);
  const passedSet = new Set(passedIds);
  const isAdmin = profileResult.data?.is_admin ?? false;

  let walkthroughButton = null;
  if (isGewächshaus) {
    const { lektionen: ordered } = await getCachedGewächshausWalkthrough();
    const completedCount = ordered.filter((l) => passedSet.has(l.id)).length;
    const total = ordered.length;
    const allDone = completedCount === total && total > 0;
    const firstIncomplete = ordered.findIndex((l) => !passedSet.has(l.id));
    const nextSchritt = firstIncomplete + 1;

    walkthroughButton = allDone ? (
      <Link
        href="/gewächshaus/pruefung"
        className="w-full flex items-center justify-between bg-teal text-white px-5 py-4 rounded-2xl mb-8 hover:bg-teal/90 transition-colors"
      >
        <div>
          <p className="text-xs uppercase tracking-[2px] opacity-70 mb-0.5">Gewächshaus</p>
          <p className="font-bold text-sm">Zur Abschlussprüfung →</p>
        </div>
        <span className="text-xs opacity-70">{total}/{total} ✓</span>
      </Link>
    ) : (
      <Link
        href={completedCount === 0 ? "/gewächshaus/1" : `/gewächshaus/${nextSchritt}`}
        className="w-full flex items-center justify-between bg-teal text-white px-5 py-4 rounded-2xl mb-8 hover:bg-teal/90 transition-colors"
      >
        <div>
          <p className="text-xs uppercase tracking-[2px] opacity-70 mb-0.5">Gewächshaus</p>
          <p className="font-bold text-sm">
            {completedCount === 0 ? "Starten →" : "Weitermachen →"}
          </p>
        </div>
        <span className="text-xs opacity-70">{completedCount}/{total}</span>
      </Link>
    );
  }

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

      {walkthroughButton}

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
git commit -m "feat: Start/Weitermachen-Button auf Gewächshaus-Seite"
```

---

## Task 10: Pushen und Verifizieren

- [ ] **Schritt 1: Pushen**

```bash
git push
```

- [ ] **Schritt 2: Verifizieren**

1. `/bereich/gewaechshaus` → teal Button "Starten →" sichtbar
2. Button klicken → landet auf `/gewächshaus/1` (Schritt 1 von N, Fortschrittsbalken bei 0%)
3. "Lektion abschließen" klicken → geht zu Schritt 2
4. Schritt 2 direkt aufrufen ohne Schritt 1 abzuschließen → Redirect zu `/gewächshaus`
5. Nach allen Lektionen → Button auf Bereich-Seite zeigt "Zur Abschlussprüfung →"
