# Gewächshaus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a German-language web platform where church musicians complete a structured bootcamp ("Gewächshaus") with video, text and quiz modules across two tracks (Theologie & Theorie), with an admin dashboard to track progress.

**Architecture:** Next.js App Router with Supabase for auth and PostgreSQL database. Static JSON content files per instrument path. Protected routes via Next.js middleware. Admin access gated by `is_admin` flag in database.

**Tech Stack:** Next.js 14 (App Router, TypeScript), Supabase (Auth + PostgreSQL), Tailwind CSS, Vercel (hosting), Jest + Testing Library (unit tests)

---

## File Map

```
/
├── app/
│   ├── layout.tsx                          # Root layout
│   ├── page.tsx                            # Landing / redirect
│   ├── (auth)/
│   │   ├── login/page.tsx                  # Login form
│   │   └── registrieren/page.tsx           # Registration + instrument selection
│   ├── (app)/
│   │   ├── layout.tsx                      # Protected layout (auth check)
│   │   ├── dashboard/page.tsx              # User dashboard, track overview
│   │   └── modul/[track]/[moduleId]/
│   │       └── page.tsx                    # Module page (videos, texts, quiz)
│   └── admin/
│       ├── layout.tsx                      # Admin-only layout
│       ├── page.tsx                        # User list
│       └── [userId]/page.tsx               # User detail
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── dashboard/
│   │   ├── TrackCard.tsx
│   │   └── ProgressBar.tsx
│   ├── module/
│   │   ├── VideoPlayer.tsx
│   │   ├── TextContent.tsx
│   │   └── Quiz.tsx
│   └── admin/
│       ├── UserTable.tsx
│       └── UserDetail.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # Browser Supabase client
│   │   └── server.ts                       # Server Supabase client
│   ├── content/
│   │   └── loader.ts                       # Load + type JSON content
│   ├── path/
│   │   └── resolver.ts                     # Instrument → path logic
│   └── progress/
│       └── utils.ts                        # Score calc, cooldown check
├── content/
│   ├── instrumentalist/
│   │   ├── theologie.json
│   │   └── theorie.json
│   ├── vocals/
│   │   ├── theologie.json
│   │   └── theorie.json
│   └── drums/
│       ├── theologie.json
│       └── theorie.json
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── middleware.ts                            # Protect /dashboard, /modul, /admin
└── types/
    └── index.ts                            # Shared TypeScript types
```

---

## Task 1: Project Setup

**Files:**

- Create: `package.json` (via CLI)
- Create: `.env.local`
- Create: `types/index.ts`

- [ ] **Step 1: Bootstrap Next.js project**

```bash
cd /Users/ich/Desktop/Gewächshausprojekt
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

Expected: Next.js project scaffolded in current directory.

- [ ] **Step 2: Install Supabase dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Install test dependencies**

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest ts-jest
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.ts`:

```typescript
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEach: ["<rootDir>/jest.setup.ts"],
};

export default createJestConfig(config);
```

Create `jest.setup.ts`:

```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 5: Create `.env.local`**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF
```

(Werte werden in Task 2 aus Supabase kopiert.)

- [ ] **Step 6: Create shared types**

Create `types/index.ts`:

```typescript
export type Path = "instrumentalist" | "vocals" | "drums";
export type Track = "theologie" | "theorie";

export type Instrument =
  | "klavier"
  | "gitarre"
  | "e-gitarre"
  | "bass"
  | "geige"
  | "vocals"
  | "drums";

export interface Video {
  titel: string;
  url: string;
}

export interface Text {
  titel: string;
  inhalt: string;
}

export interface Question {
  frage: string;
  optionen: [string, string, string, string];
  richtig: 0 | 1 | 2 | 3;
}

export interface Module {
  id: string;
  titel: string;
  videos: Video[];
  texte: Text[];
  fragen: Question[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  instruments: Instrument[];
  path: Path;
  is_admin: boolean;
  created_at: string;
}

export interface Progress {
  module_id: string;
  track: Track;
  materials_completed: boolean;
  passed: boolean;
  completed_at: string | null;
}

export interface QuizAttempt {
  module_id: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Supabase and test dependencies"
```

---

## Task 2: Supabase Setup & Database Schema

**Files:**

- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create Supabase project**

Gehe zu [supabase.com](https://supabase.com), erstelle ein neues Projekt. Kopiere aus den Project Settings:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 2: Create migration file**

Create `supabase/migrations/001_initial.sql`:

```sql
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
```

- [ ] **Step 3: Run migration in Supabase**

Gehe zu Supabase → SQL Editor → paste den Inhalt von `001_initial.sql` → Run.

Expected: Keine Fehler, alle Tabellen erscheinen unter Table Editor.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema with RLS policies"
```

---

## Task 3: Supabase Clients & Middleware

**Files:**

- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Create server client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}
```

- [ ] **Step 3: Create middleware**

Create `middleware.ts` in project root:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated users can only access /login and /registrieren
  if (!user && pathname !== "/login" && pathname !== "/registrieren") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin routes: redirect non-admins
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

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 4: Commit**

```bash
git add lib/ middleware.ts
git commit -m "feat: add Supabase clients and auth middleware"
```

---

## Task 4: Path Resolver (TDD)

**Files:**

- Create: `lib/path/resolver.ts`
- Create: `lib/path/resolver.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/path/resolver.test.ts`:

```typescript
import { resolvePath } from "./resolver";
import type { Instrument, Path } from "@/types";

describe("resolvePath", () => {
  it("returns instrumentalist when klavier is selected", () => {
    expect(resolvePath(["klavier"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when gitarre is selected", () => {
    expect(resolvePath(["gitarre"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when e-gitarre is selected", () => {
    expect(resolvePath(["e-gitarre"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when bass is selected", () => {
    expect(resolvePath(["bass"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when geige is selected", () => {
    expect(resolvePath(["geige"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when tonal instrument mixed with vocals", () => {
    expect(resolvePath(["gitarre", "vocals"])).toBe<Path>("instrumentalist");
  });

  it("returns instrumentalist when tonal instrument mixed with drums", () => {
    expect(resolvePath(["klavier", "drums"])).toBe<Path>("instrumentalist");
  });

  it("returns vocals when only vocals selected", () => {
    expect(resolvePath(["vocals"])).toBe<Path>("vocals");
  });

  it("returns drums when only drums selected", () => {
    expect(resolvePath(["drums"])).toBe<Path>("drums");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/path/resolver.test.ts
```

Expected: FAIL — `Cannot find module './resolver'`

- [ ] **Step 3: Implement resolver**

Create `lib/path/resolver.ts`:

```typescript
import type { Instrument, Path } from "@/types";

const TONAL_INSTRUMENTS: Instrument[] = [
  "klavier",
  "gitarre",
  "e-gitarre",
  "bass",
  "geige",
];

export function resolvePath(instruments: Instrument[]): Path {
  if (instruments.some((i) => TONAL_INSTRUMENTS.includes(i)))
    return "instrumentalist";
  if (instruments.includes("vocals")) return "vocals";
  return "drums";
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest lib/path/resolver.test.ts
```

Expected: PASS — 9 tests passed

- [ ] **Step 5: Commit**

```bash
git add lib/path/
git commit -m "feat: add path resolver with tests"
```

---

## Task 5: Progress Utilities (TDD)

**Files:**

- Create: `lib/progress/utils.ts`
- Create: `lib/progress/utils.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/progress/utils.test.ts`:

```typescript
import { calculateScore, isPassing, isCooledDown } from "./utils";

describe("calculateScore", () => {
  it("returns 1.0 for all correct answers", () => {
    expect(calculateScore([0, 1, 2], [0, 1, 2])).toBe(1);
  });

  it("returns 0 for all wrong answers", () => {
    expect(calculateScore([0, 1, 2], [1, 0, 3])).toBe(0);
  });

  it("returns 0.5 for half correct", () => {
    expect(calculateScore([0, 1], [0, 0])).toBe(0.5);
  });
});

describe("isPassing", () => {
  it("returns true for score >= 0.8", () => {
    expect(isPassing(0.8)).toBe(true);
    expect(isPassing(1.0)).toBe(true);
  });

  it("returns false for score < 0.8", () => {
    expect(isPassing(0.79)).toBe(false);
    expect(isPassing(0)).toBe(false);
  });
});

describe("isCooledDown", () => {
  it("returns true when last attempt was more than 24h ago", () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(isCooledDown(yesterday)).toBe(true);
  });

  it("returns false when last attempt was less than 24h ago", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(isCooledDown(oneHourAgo)).toBe(false);
  });

  it("returns true when no previous attempt exists", () => {
    expect(isCooledDown(null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/progress/utils.test.ts
```

Expected: FAIL — `Cannot find module './utils'`

- [ ] **Step 3: Implement utilities**

Create `lib/progress/utils.ts`:

```typescript
const PASSING_THRESHOLD = 0.8;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function calculateScore(
  correctAnswers: number[],
  givenAnswers: number[],
): number {
  const correct = givenAnswers.filter(
    (ans, i) => ans === correctAnswers[i],
  ).length;
  return correct / correctAnswers.length;
}

export function isPassing(score: number): boolean {
  return score >= PASSING_THRESHOLD;
}

export function isCooledDown(lastAttemptAt: string | null): boolean {
  if (!lastAttemptAt) return true;
  return Date.now() - new Date(lastAttemptAt).getTime() > COOLDOWN_MS;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest lib/progress/utils.test.ts
```

Expected: PASS — 7 tests passed

- [ ] **Step 5: Commit**

```bash
git add lib/progress/
git commit -m "feat: add progress utilities (score, passing, cooldown) with tests"
```

---

## Task 6: Content Files & Loader

**Files:**

- Create: `content/instrumentalist/theologie.json`
- Create: `content/instrumentalist/theorie.json`
- Create: `content/vocals/theologie.json`
- Create: `content/vocals/theorie.json`
- Create: `content/drums/theologie.json`
- Create: `content/drums/theorie.json`
- Create: `lib/content/loader.ts`

- [ ] **Step 1: Create instrumentalist/theologie.json**

Create `content/instrumentalist/theologie.json`:

```json
[
  {
    "id": "inst-theo-1",
    "titel": "Was ist Lobpreis?",
    "videos": [
      {
        "titel": "Einführung in den Lobpreis",
        "url": "https://www.youtube.com/embed/PLACEHOLDER1"
      }
    ],
    "texte": [
      {
        "titel": "Die Bedeutung des Lobpreises",
        "inhalt": "Hier kommt der Text über die Bedeutung des Lobpreises in der Gemeinde. Dieser Platzhalter wird durch den echten Inhalt ersetzt."
      }
    ],
    "fragen": [
      {
        "frage": "Was ist das Hauptziel von Lobpreis?",
        "optionen": [
          "Unterhaltung",
          "Anbetung Gottes",
          "Konzertperformance",
          "Übung"
        ],
        "richtig": 1
      },
      {
        "frage": "Wer kann Lobpreis anbieten?",
        "optionen": [
          "Nur Profis",
          "Nur der Pastor",
          "Jeder Gläubige",
          "Nur der Chor"
        ],
        "richtig": 2
      },
      {
        "frage": "Welche Haltung ist beim Lobpreis wichtig?",
        "optionen": [
          "Perfektion",
          "Aufmerksamkeit auf die Technik",
          "Ein aufrichtiges Herz",
          "Lautstärke"
        ],
        "richtig": 2
      }
    ]
  },
  {
    "id": "inst-theo-2",
    "titel": "Dienst in der Gemeinde",
    "videos": [
      {
        "titel": "Gemeinsam dienen",
        "url": "https://www.youtube.com/embed/PLACEHOLDER2"
      }
    ],
    "texte": [
      {
        "titel": "Was bedeutet Dienst?",
        "inhalt": "Hier steht der Text zum Thema Dienst in der Gemeinde. Dieser Platzhalter wird durch den echten Inhalt ersetzt."
      }
    ],
    "fragen": [
      {
        "frage": "Wozu dient das Lobpreisteam?",
        "optionen": [
          "Selbstdarstellung",
          "Der Gemeinde zum Gottesdienst verhelfen",
          "Karriere machen",
          "Aufmerksamkeit bekommen"
        ],
        "richtig": 1
      },
      {
        "frage": "Wie sollte ein Musiker seinen Dienst betrachten?",
        "optionen": [
          "Als Job",
          "Als Berufung und Ehre",
          "Als Pflicht",
          "Als Hobby"
        ],
        "richtig": 1
      },
      {
        "frage": "Was ist wichtiger als musikalische Fähigkeit im Dienst?",
        "optionen": [
          "Ausrüstung",
          "Charakter und Herzenshaltung",
          "Erfahrung",
          "Ruhm"
        ],
        "richtig": 1
      }
    ]
  }
]
```

- [ ] **Step 2: Create instrumentalist/theorie.json**

Create `content/instrumentalist/theorie.json`:

```json
[
  {
    "id": "inst-theorie-1",
    "titel": "Grundlagen der Musiktheorie",
    "videos": [
      {
        "titel": "Noten und Rhythmus",
        "url": "https://www.youtube.com/embed/PLACEHOLDER3"
      }
    ],
    "texte": [
      {
        "titel": "Noten lesen",
        "inhalt": "Hier kommt der Text über das Notenlesen für Instrumentalisten. Dieser Platzhalter wird durch den echten Inhalt ersetzt."
      }
    ],
    "fragen": [
      {
        "frage": "Wie viele Halbtöne hat eine Oktave?",
        "optionen": ["8", "10", "12", "7"],
        "richtig": 2
      },
      {
        "frage": "Was ist ein Takt?",
        "optionen": [
          "Eine Melodie",
          "Eine rhythmische Einheit",
          "Ein Instrument",
          "Eine Tonart"
        ],
        "richtig": 1
      },
      {
        "frage": "Was bedeutet 4/4-Takt?",
        "optionen": [
          "4 Melodien pro Lied",
          "4 Viertelnoten pro Takt",
          "4 Instrumente",
          "4 Strophen"
        ],
        "richtig": 1
      }
    ]
  }
]
```

- [ ] **Step 3: Create vocals content files**

Create `content/vocals/theologie.json`:

```json
[
  {
    "id": "voc-theo-1",
    "titel": "Die Stimme als Instrument Gottes",
    "videos": [
      {
        "titel": "Singen zur Ehre Gottes",
        "url": "https://www.youtube.com/embed/PLACEHOLDER4"
      }
    ],
    "texte": [
      {
        "titel": "Die Stimme im Lobpreis",
        "inhalt": "Hier kommt der Text über die Bedeutung der Stimme im Lobpreis. Dieser Platzhalter wird durch den echten Inhalt ersetzt."
      }
    ],
    "fragen": [
      {
        "frage": "Was macht die menschliche Stimme im Lobpreis besonders?",
        "optionen": [
          "Lautstärke",
          "Direkter Ausdruck des Herzens",
          "Technische Perfektion",
          "Reichweite"
        ],
        "richtig": 1
      },
      {
        "frage": "Warum ist Textverständnis für Sänger wichtig?",
        "optionen": [
          "Für die Aussprache",
          "Um die Botschaft authentisch zu vermitteln",
          "Für die Tonhöhe",
          "Für das Timing"
        ],
        "richtig": 1
      },
      {
        "frage": "Was sollte ein Lobpreissänger vor dem Dienst tun?",
        "optionen": [
          "Viel trinken",
          "Im Gebet vorbereiten",
          "Schlafen",
          "Üben ignorieren"
        ],
        "richtig": 1
      }
    ]
  }
]
```

Create `content/vocals/theorie.json`:

```json
[
  {
    "id": "voc-theorie-1",
    "titel": "Stimmbildung und Technik",
    "videos": [
      {
        "titel": "Gesangstechnik Grundlagen",
        "url": "https://www.youtube.com/embed/PLACEHOLDER5"
      }
    ],
    "texte": [
      {
        "titel": "Atmung und Stütze",
        "inhalt": "Hier kommt der Text über Atemtechnik für Sänger. Dieser Platzhalter wird durch den echten Inhalt ersetzt."
      }
    ],
    "fragen": [
      {
        "frage": "Welcher Atemtyp ist für Sänger empfohlen?",
        "optionen": [
          "Brusatmung",
          "Zwerchfellatmung",
          "Schulterkrampf",
          "Keine Technik nötig"
        ],
        "richtig": 1
      },
      {
        "frage": "Was schützt die Stimme vor Überbelastung?",
        "optionen": [
          "Schreien",
          "Richtige Technik und Aufwärmen",
          "Ignorieren",
          "Nur leise singen"
        ],
        "richtig": 1
      },
      {
        "frage": "Was ist ein Warm-up?",
        "optionen": [
          "Eine Pause",
          "Aufwärmübungen für die Stimme",
          "Ein Lied",
          "Eine Pause"
        ],
        "richtig": 1
      }
    ]
  }
]
```

- [ ] **Step 4: Create drums content files**

Create `content/drums/theologie.json`:

```json
[
  {
    "id": "drm-theo-1",
    "titel": "Rhythmus als Gottesgeschenk",
    "videos": [
      {
        "titel": "Schlagzeug im Gottesdienst",
        "url": "https://www.youtube.com/embed/PLACEHOLDER6"
      }
    ],
    "texte": [
      {
        "titel": "Die Rolle des Schlagzeugers",
        "inhalt": "Hier kommt der Text über die Rolle des Schlagzeugers im Lobpreis. Dieser Platzhalter wird durch den echten Inhalt ersetzt."
      }
    ],
    "fragen": [
      {
        "frage": "Was ist die Hauptaufgabe des Schlagzeugers im Gottesdienst?",
        "optionen": [
          "Solos spielen",
          "Die Band rhythmisch zusammenhalten",
          "Lautstärke erzeugen",
          "Aufmerksamkeit bekommen"
        ],
        "richtig": 1
      },
      {
        "frage": "Warum ist Disziplin für Schlagzeuger besonders wichtig?",
        "optionen": [
          "Weil Drums laut sind",
          "Weil Rhythmus die Basis für alle anderen Musiker ist",
          "Wegen der Ausrüstung",
          "Wegen des Platzes"
        ],
        "richtig": 1
      },
      {
        "frage": "Was bedeutet 'im Dienst spielen'?",
        "optionen": [
          "Für sich selbst spielen",
          "Dem Team und der Gemeinde dienen",
          "Karriere machen",
          "Aufmerksamkeit gewinnen"
        ],
        "richtig": 1
      }
    ]
  }
]
```

Create `content/drums/theorie.json`:

```json
[
  {
    "id": "drm-theorie-1",
    "titel": "Grundrhythmen und Groove",
    "videos": [
      {
        "titel": "Basic Drumming Patterns",
        "url": "https://www.youtube.com/embed/PLACEHOLDER7"
      }
    ],
    "texte": [
      {
        "titel": "Der 4/4 Grundrhythmus",
        "inhalt": "Hier kommt der Text über Grundrhythmen für Schlagzeuger. Dieser Platzhalter wird durch den echten Inhalt ersetzt."
      }
    ],
    "fragen": [
      {
        "frage": "Was ist der Beat im 4/4-Takt?",
        "optionen": [
          "Schlag auf 2 und 3",
          "Schlag auf 1 und 3",
          "Schlag auf 1, 2, 3 und 4",
          "Kein fester Schlag"
        ],
        "richtig": 1
      },
      {
        "frage": "Was macht ein guter Groove aus?",
        "optionen": [
          "Lautstärke",
          "Geschwindigkeit",
          "Konstanz und Timing",
          "Komplexität"
        ],
        "richtig": 2
      },
      {
        "frage": "Was ist eine Hi-Hat?",
        "optionen": [
          "Ein Hut",
          "Ein Beckenpaar beim Schlagzeug",
          "Ein Trommelstock",
          "Ein Metronom"
        ],
        "richtig": 1
      }
    ]
  }
]
```

- [ ] **Step 5: Create content loader**

Create `lib/content/loader.ts`:

```typescript
import type { Module, Path, Track } from "@/types";
import instrumentalistTheologie from "@/content/instrumentalist/theologie.json";
import instrumentalistTheorie from "@/content/instrumentalist/theorie.json";
import vocalsTheologie from "@/content/vocals/theologie.json";
import vocalsTheorie from "@/content/vocals/theorie.json";
import drumsTheologie from "@/content/drums/theologie.json";
import drumsTheorie from "@/content/drums/theorie.json";

const CONTENT: Record<Path, Record<Track, Module[]>> = {
  instrumentalist: {
    theologie: instrumentalistTheologie as Module[],
    theorie: instrumentalistTheorie as Module[],
  },
  vocals: {
    theologie: vocalsTheologie as Module[],
    theorie: vocalsTheorie as Module[],
  },
  drums: {
    theologie: drumsTheologie as Module[],
    theorie: drumsTheorie as Module[],
  },
};

export function getModules(path: Path, track: Track): Module[] {
  return CONTENT[path][track];
}

export function getModule(
  path: Path,
  track: Track,
  moduleId: string,
): Module | undefined {
  return CONTENT[path][track].find((m) => m.id === moduleId);
}

export function getMaterialIds(module: Module): string[] {
  const videoIds = module.videos.map((_, i) => `video-${i}`);
  const textIds = module.texte.map((_, i) => `text-${i}`);
  return [...videoIds, ...textIds];
}
```

- [ ] **Step 6: Commit**

```bash
git add content/ lib/content/
git commit -m "feat: add content files and content loader"
```

---

## Task 7: Root Layout & Landing Page

**Files:**

- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gewächshaus",
  description: "Bootcamp für neue Musiker im Lobpreisteam",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Update landing page (redirect to login)**

Replace `app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");
  redirect("/login");
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: add root layout and landing redirect"
```

---

## Task 8: Auth Pages (Login & Registration)

**Files:**

- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/registrieren/page.tsx`
- Create: `components/auth/LoginForm.tsx`
- Create: `components/auth/RegisterForm.tsx`

- [ ] **Step 1: Create LoginForm component**

Create `components/auth/LoginForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email oder Passwort falsch.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-sm"
    >
      <h1 className="text-2xl font-bold text-center">Anmelden</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

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
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Lädt..." : "Anmelden"}
      </button>

      <p className="text-center text-sm">
        Noch kein Account?{" "}
        <a href="/registrieren" className="text-blue-600 hover:underline">
          Registrieren
        </a>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Create login page**

Create `app/(auth)/login/page.tsx`:

```tsx
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
```

- [ ] **Step 3: Create RegisterForm component**

Create `components/auth/RegisterForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolvePath } from "@/lib/path/resolver";
import type { Instrument } from "@/types";

const INSTRUMENTS: { id: Instrument; label: string }[] = [
  { id: "klavier", label: "Klavier" },
  { id: "gitarre", label: "Gitarre" },
  { id: "e-gitarre", label: "E-Gitarre" },
  { id: "bass", label: "Bass" },
  { id: "geige", label: "Geige" },
  { id: "vocals", label: "Gesang (Vocals)" },
  { id: "drums", label: "Schlagzeug" },
];

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<Instrument[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleInstrument(instrument: Instrument) {
    setSelectedInstruments((prev) =>
      prev.includes(instrument)
        ? prev.filter((i) => i !== instrument)
        : [...prev, instrument],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedInstruments.length === 0) {
      setError("Bitte wähle mindestens ein Instrument aus.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const path = resolvePath(selectedInstruments);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Update profile with instruments and resolved path
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("users")
        .update({ instruments: selectedInstruments, path })
        .eq("id", user.id);
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-sm"
    >
      <h1 className="text-2xl font-bold text-center">Registrieren</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

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
        <legend className="text-sm font-medium px-1">Meine Instrumente</legend>
        <div className="flex flex-col gap-2 mt-2">
          {INSTRUMENTS.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInstruments.includes(id)}
                onChange={() => toggleInstrument(id)}
                className="w-4 h-4"
              />
              {label}
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
        <a href="/login" className="text-blue-600 hover:underline">
          Anmelden
        </a>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: Create registration page**

Create `app/(auth)/registrieren/page.tsx`:

```tsx
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/ components/auth/
git commit -m "feat: add login and registration pages with instrument selection"
```

---

## Task 9: Dashboard

**Files:**

- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Create: `components/dashboard/TrackCard.tsx`
- Create: `components/dashboard/ProgressBar.tsx`

- [ ] **Step 1: Create protected app layout**

Create `app/(app)/layout.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
```

- [ ] **Step 2: Create ProgressBar component**

Create `components/dashboard/ProgressBar.tsx`:

```tsx
interface Props {
  percent: number;
  label: string;
}

export default function ProgressBar({ percent, label }: Props) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create TrackCard component**

Create `components/dashboard/TrackCard.tsx`:

```tsx
import Link from "next/link";
import ProgressBar from "./ProgressBar";
import type { Module, Progress } from "@/types";

interface Props {
  track: "theologie" | "theorie";
  modules: Module[];
  progress: Progress[];
}

export default function TrackCard({ track, modules, progress }: Props) {
  const trackLabel = track === "theologie" ? "Theologie" : "Theorie";
  const passed = progress.filter((p) => p.track === track && p.passed).length;
  const percent = modules.length > 0 ? (passed / modules.length) * 100 : 0;

  const nextModule = modules.find(
    (m) =>
      !progress.find(
        (p) => p.module_id === m.id && p.track === track && p.passed,
      ),
  );

  return (
    <div className="border rounded-lg p-5 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{trackLabel}</h2>
      <ProgressBar
        percent={percent}
        label={`${passed} / ${modules.length} Module abgeschlossen`}
      />

      {nextModule ? (
        <Link
          href={`/modul/${track}/${nextModule.id}`}
          className="bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
        >
          Weiter: {nextModule.titel}
        </Link>
      ) : (
        <p className="text-green-600 font-medium text-center">
          Track abgeschlossen!
        </p>
      )}

      <div className="flex flex-col gap-1 text-sm">
        {modules.map((m) => {
          const done = progress.find(
            (p) => p.module_id === m.id && p.track === track && p.passed,
          );
          return (
            <div key={m.id} className="flex items-center gap-2">
              <span>{done ? "✓" : "○"}</span>
              <span className={done ? "line-through text-gray-400" : ""}>
                {m.titel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create dashboard page**

Create `app/(app)/dashboard/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getModules } from "@/lib/content/loader";
import TrackCard from "@/components/dashboard/TrackCard";
import type { Path, Progress } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, path")
    .eq("id", user.id)
    .single();

  const { data: progressRows } = await supabase
    .from("progress")
    .select("module_id, track, materials_completed, passed, completed_at")
    .eq("user_id", user.id);

  const path = (profile?.path ?? "instrumentalist") as Path;
  const progress = (progressRows ?? []) as Progress[];

  const theologieModules = getModules(path, "theologie");
  const theorieModules = getModules(path, "theorie");

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Hallo, {profile?.name}!</h1>
      <p className="text-gray-600 mb-8">
        Willkommen im Gewächshaus. Hier ist dein Fortschritt:
      </p>

      <div className="flex flex-col gap-6">
        <TrackCard
          track="theologie"
          modules={theologieModules}
          progress={progress}
        />
        <TrackCard
          track="theorie"
          modules={theorieModules}
          progress={progress}
        />
      </div>

      <form action="/api/logout" method="POST" className="mt-8">
        <button type="submit" className="text-sm text-gray-500 hover:underline">
          Abmelden
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Create logout route**

Create `app/api/logout/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
```

- [ ] **Step 6: Commit**

```bash
git add app/(app)/ components/dashboard/ app/api/
git commit -m "feat: add dashboard with track progress overview"
```

---

## Task 10: Module Page (Videos, Texts, Material Tracking)

**Files:**

- Create: `app/(app)/modul/[track]/[moduleId]/page.tsx`
- Create: `components/module/VideoPlayer.tsx`
- Create: `components/module/TextContent.tsx`

- [ ] **Step 1: Create VideoPlayer component**

Create `components/module/VideoPlayer.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import type { Video } from "@/types";

interface Props {
  video: Video;
  materialId: string;
  onViewed: (materialId: string) => void;
}

export default function VideoPlayer({ video, materialId, onViewed }: Props) {
  // Mark as viewed when component mounts (user opened it)
  useEffect(() => {
    onViewed(materialId);
  }, [materialId, onViewed]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">{video.titel}</h3>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={video.url}
          title={video.titel}
          allowFullScreen
          className="absolute inset-0 w-full h-full rounded"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TextContent component**

Create `components/module/TextContent.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import type { Text } from "@/types";

interface Props {
  text: Text;
  materialId: string;
  onViewed: (materialId: string) => void;
}

export default function TextContent({ text, materialId, onViewed }: Props) {
  useEffect(() => {
    onViewed(materialId);
  }, [materialId, onViewed]);

  return (
    <div className="border-l-4 border-blue-400 pl-4 py-2">
      <h3 className="font-medium mb-2">{text.titel}</h3>
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {text.inhalt}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create module page**

Create `app/(app)/modul/[track]/[moduleId]/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getModule, getModules, getMaterialIds } from "@/lib/content/loader";
import ModuleClient from "./ModuleClient";
import type { Path, Track } from "@/types";

interface Props {
  params: Promise<{ track: string; moduleId: string }>;
}

export default async function ModulePage({ params }: Props) {
  const { track, moduleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("path")
    .eq("id", user.id)
    .single();

  const path = (profile?.path ?? "instrumentalist") as Path;
  const trackTyped = track as Track;

  const module = getModule(path, trackTyped, moduleId);
  if (!module) notFound();

  // Check sequential access: previous module must be passed
  const modules = getModules(path, trackTyped);
  const moduleIndex = modules.findIndex((m) => m.id === moduleId);
  if (moduleIndex > 0) {
    const prevModule = modules[moduleIndex - 1];
    const { data: prevProgress } = await supabase
      .from("progress")
      .select("passed")
      .eq("user_id", user.id)
      .eq("module_id", prevModule.id)
      .eq("track", track)
      .single();
    if (!prevProgress?.passed) redirect("/dashboard");
  }

  // Load current progress and viewed materials
  const { data: progressRow } = await supabase
    .from("progress")
    .select("materials_completed, passed")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .eq("track", track)
    .single();

  const { data: viewedRows } = await supabase
    .from("material_views")
    .select("material_id")
    .eq("user_id", user.id)
    .eq("module_id", moduleId);

  const viewedIds = (viewedRows ?? []).map(
    (r: { material_id: string }) => r.material_id,
  );
  const allMaterialIds = getMaterialIds(module);
  const materialsCompleted = allMaterialIds.every((id) =>
    viewedIds.includes(id),
  );

  // Load last quiz attempt for cooldown
  const { data: lastAttempt } = await supabase
    .from("quiz_attempts")
    .select("attempted_at, passed")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <ModuleClient
      module={module}
      track={trackTyped}
      userId={user.id}
      viewedIds={viewedIds}
      materialsCompleted={
        materialsCompleted || progressRow?.materials_completed || false
      }
      alreadyPassed={progressRow?.passed ?? false}
      lastAttemptAt={lastAttempt?.attempted_at ?? null}
    />
  );
}
```

- [ ] **Step 4: Create ModuleClient component**

Create `app/(app)/modul/[track]/[moduleId]/ModuleClient.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import VideoPlayer from "@/components/module/VideoPlayer";
import TextContent from "@/components/module/TextContent";
import Quiz from "@/components/module/Quiz";
import { isCooledDown } from "@/lib/progress/utils";
import type { Module, Track } from "@/types";

interface Props {
  module: Module;
  track: Track;
  userId: string;
  viewedIds: string[];
  materialsCompleted: boolean;
  alreadyPassed: boolean;
  lastAttemptAt: string | null;
}

export default function ModuleClient({
  module,
  track,
  userId,
  viewedIds: initialViewedIds,
  materialsCompleted: initialMaterialsCompleted,
  alreadyPassed,
  lastAttemptAt,
}: Props) {
  const router = useRouter();
  const [viewedIds, setViewedIds] = useState<string[]>(initialViewedIds);
  const [materialsCompleted, setMaterialsCompleted] = useState(
    initialMaterialsCompleted,
  );
  const [showQuiz, setShowQuiz] = useState(false);

  const allMaterialIds = [
    ...module.videos.map((_, i) => `video-${i}`),
    ...module.texte.map((_, i) => `text-${i}`),
  ];

  const handleViewed = useCallback(
    async (materialId: string) => {
      if (viewedIds.includes(materialId)) return;

      const newViewed = [...viewedIds, materialId];
      setViewedIds(newViewed);

      const supabase = createClient();
      await supabase.from("material_views").upsert({
        user_id: userId,
        module_id: module.id,
        material_id: materialId,
      });

      if (
        allMaterialIds.every((id) => newViewed.includes(id)) &&
        !materialsCompleted
      ) {
        setMaterialsCompleted(true);
        await supabase.from("progress").upsert({
          user_id: userId,
          module_id: module.id,
          track,
          materials_completed: true,
          passed: false,
        });
      }
    },
    [viewedIds, materialsCompleted, module.id, track, userId, allMaterialIds],
  );

  const canStartQuiz =
    materialsCompleted && !alreadyPassed && isCooledDown(lastAttemptAt);
  const onCooldown =
    materialsCompleted && !alreadyPassed && !isCooledDown(lastAttemptAt);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <a
        href="/dashboard"
        className="text-blue-600 text-sm hover:underline mb-4 block"
      >
        ← Zurück zum Dashboard
      </a>

      <h1 className="text-2xl font-bold mb-6">{module.titel}</h1>

      {!showQuiz && (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Videos</h2>
            <div className="flex flex-col gap-6">
              {module.videos.map((video, i) => (
                <VideoPlayer
                  key={i}
                  video={video}
                  materialId={`video-${i}`}
                  onViewed={handleViewed}
                />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Texte</h2>
            <div className="flex flex-col gap-4">
              {module.texte.map((text, i) => (
                <TextContent
                  key={i}
                  text={text}
                  materialId={`text-${i}`}
                  onViewed={handleViewed}
                />
              ))}
            </div>
          </section>

          <div className="mt-8 border-t pt-6">
            {alreadyPassed && (
              <p className="text-green-600 font-medium">
                Dieses Modul ist abgeschlossen.
              </p>
            )}
            {onCooldown && (
              <p className="text-orange-600 text-sm">
                Test nicht bestanden. Bitte morgen erneut versuchen (24h
                Wartezeit).
              </p>
            )}
            {canStartQuiz && (
              <button
                onClick={() => setShowQuiz(true)}
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
              >
                Test starten
              </button>
            )}
            {!materialsCompleted && (
              <p className="text-gray-500 text-sm">
                Schaue alle Videos und lese alle Texte, um den Test
                freizuschalten.
              </p>
            )}
          </div>
        </>
      )}

      {showQuiz && (
        <Quiz
          module={module}
          track={track}
          userId={userId}
          onComplete={() => router.push("/dashboard")}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(app)/modul/ components/module/VideoPlayer.tsx components/module/TextContent.tsx
git commit -m "feat: add module page with material tracking"
```

---

## Task 11: Quiz Component

**Files:**

- Create: `components/module/Quiz.tsx`
- Create: `app/api/quiz/route.ts`

- [ ] **Step 1: Create quiz API route**

Create `app/api/quiz/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { calculateScore, isPassing } from "@/lib/progress/utils";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId, track, correctAnswers, givenAnswers } =
    await request.json();

  const score = calculateScore(correctAnswers, givenAnswers);
  const passed = isPassing(score);

  // Save attempt
  await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    module_id: moduleId,
    score,
    passed,
  });

  // If passed: mark module as complete in progress
  if (passed) {
    await supabase.from("progress").upsert({
      user_id: user.id,
      module_id: moduleId,
      track,
      materials_completed: true,
      passed: true,
      completed_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ score, passed });
}
```

- [ ] **Step 2: Create Quiz component**

Create `components/module/Quiz.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Module, Track } from "@/types";

interface Props {
  module: Module;
  track: Track;
  userId: string;
  onComplete: () => void;
}

export default function Quiz({ module, track, onComplete }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(module.fragen.length).fill(null),
  );
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  function selectAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  async function handleSubmit() {
    if (answers.some((a) => a === null)) return;
    setLoading(true);

    const correctAnswers = module.fragen.map((f) => f.richtig);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: module.id,
        track,
        correctAnswers,
        givenAnswers: answers,
      }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4 text-center py-8">
        <p className="text-5xl">{result.passed ? "🎉" : "😔"}</p>
        <p className="text-2xl font-bold">
          {Math.round(result.score * 100)}% richtig
        </p>
        {result.passed ? (
          <>
            <p className="text-green-600 font-medium">
              Bestanden! Modul abgeschlossen.
            </p>
            <button
              onClick={onComplete}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 mx-auto"
            >
              Zum Dashboard
            </button>
          </>
        ) : (
          <>
            <p className="text-red-600">
              Nicht bestanden (mind. 80% erforderlich). Bitte morgen erneut
              versuchen.
            </p>
            <button
              onClick={onComplete}
              className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 mx-auto"
            >
              Zurück zum Dashboard
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-xl font-bold">Test: {module.titel}</h2>
      <p className="text-sm text-gray-600">
        Mindestens 80% richtig zum Bestehen.
      </p>

      {module.fragen.map((frage, qi) => (
        <div key={qi} className="flex flex-col gap-3">
          <p className="font-medium">
            {qi + 1}. {frage.frage}
          </p>
          {frage.optionen.map((option, oi) => (
            <label
              key={oi}
              className={`flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                answers[qi] === oi ? "border-blue-500 bg-blue-50" : ""
              }`}
            >
              <input
                type="radio"
                name={`frage-${qi}`}
                checked={answers[qi] === oi}
                onChange={() => selectAnswer(qi, oi)}
                className="w-4 h-4"
              />
              {option}
            </label>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={answers.some((a) => a === null) || loading}
        className="bg-green-600 text-white py-3 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Auswerten..." : "Test abgeben"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/module/Quiz.tsx app/api/quiz/
git commit -m "feat: add quiz component with scoring and cooldown"
```

---

## Task 12: Admin Dashboard

**Files:**

- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/[userId]/page.tsx`
- Create: `components/admin/UserTable.tsx`
- Create: `components/admin/UserDetail.tsx`

- [ ] **Step 1: Create admin layout**

Create `app/admin/layout.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin – Gewächshaus</h1>
        <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
          Mein Dashboard
        </a>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create UserTable component**

Create `components/admin/UserTable.tsx`:

```tsx
import Link from "next/link";

interface UserRow {
  id: string;
  name: string;
  email: string;
  path: string;
  instruments: string[];
  created_at: string;
  progressPercent: number;
}

interface Props {
  users: UserRow[];
}

const PATH_LABELS: Record<string, string> = {
  instrumentalist: "Instrumentalist",
  vocals: "Gesang",
  drums: "Schlagzeug",
};

function daysSince(dateString: string): number {
  return Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default function UserTable({ users }: Props) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="py-2 pr-4">Name</th>
          <th className="py-2 pr-4">Pfad</th>
          <th className="py-2 pr-4">Start</th>
          <th className="py-2 pr-4">Tage</th>
          <th className="py-2 pr-4">Fortschritt</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b hover:bg-gray-50">
            <td className="py-2 pr-4 font-medium">{u.name}</td>
            <td className="py-2 pr-4">{PATH_LABELS[u.path] ?? u.path}</td>
            <td className="py-2 pr-4">
              {new Date(u.created_at).toLocaleDateString("de-DE")}
            </td>
            <td className="py-2 pr-4">{daysSince(u.created_at)}</td>
            <td className="py-2 pr-4">
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${u.progressPercent}%` }}
                  />
                </div>
                <span>{Math.round(u.progressPercent)}%</span>
              </div>
            </td>
            <td className="py-2">
              <Link
                href={`/admin/${u.id}`}
                className="text-blue-600 hover:underline"
              >
                Details
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: Create admin overview page**

Create `app/admin/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { getModules } from "@/lib/content/loader";
import UserTable from "@/components/admin/UserTable";
import type { Path } from "@/types";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, path, instruments, created_at")
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  const { data: allProgress } = await supabase
    .from("progress")
    .select("user_id, module_id, track, passed");

  const usersWithProgress = (users ?? []).map((user) => {
    const path = user.path as Path;
    const totalModules =
      getModules(path, "theologie").length + getModules(path, "theorie").length;
    const passedModules = (allProgress ?? []).filter(
      (p) => p.user_id === user.id && p.passed,
    ).length;
    const progressPercent =
      totalModules > 0 ? (passedModules / totalModules) * 100 : 0;

    return { ...user, progressPercent };
  });

  return (
    <>
      <p className="text-gray-600 mb-4">
        {usersWithProgress.length} Nutzer registriert
      </p>
      <UserTable users={usersWithProgress} />
    </>
  );
}
```

- [ ] **Step 4: Create UserDetail component**

Create `components/admin/UserDetail.tsx`:

```tsx
import type { Module, Progress } from "@/types";

interface Props {
  track: "theologie" | "theorie";
  modules: Module[];
  progress: Progress[];
}

export default function UserDetail({ track, modules, progress }: Props) {
  const label = track === "theologie" ? "Theologie" : "Theorie";
  const passed = progress.filter((p) => p.track === track && p.passed).length;
  const percent = modules.length > 0 ? (passed / modules.length) * 100 : 0;

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-3">
        {label} — {Math.round(percent)}% abgeschlossen
      </h3>
      <div className="flex flex-col gap-2 text-sm">
        {modules.map((m) => {
          const done = progress.find(
            (p) => p.module_id === m.id && p.track === track && p.passed,
          );
          return (
            <div key={m.id} className="flex items-center gap-2">
              <span className={done ? "text-green-600" : "text-gray-400"}>
                {done ? "✓" : "○"}
              </span>
              <span>{m.titel}</span>
              {done && (
                <span className="text-gray-400 text-xs ml-auto">
                  {new Date(done.completed_at!).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create admin user detail page**

Create `app/admin/[userId]/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getModules } from "@/lib/content/loader";
import UserDetail from "@/components/admin/UserDetail";
import type { Path, Progress } from "@/types";

interface Props {
  params: Promise<{ userId: string }>;
}

function daysSince(dateString: string): number {
  return Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default async function AdminUserPage({ params }: Props) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("name, email, path, instruments, created_at")
    .eq("id", userId)
    .single();

  if (!user) notFound();

  const { data: progressRows } = await supabase
    .from("progress")
    .select("module_id, track, materials_completed, passed, completed_at")
    .eq("user_id", userId);

  const path = user.path as Path;
  const progress = (progressRows ?? []) as Progress[];

  const PATH_LABELS: Record<string, string> = {
    instrumentalist: "Instrumentalist",
    vocals: "Gesang",
    drums: "Schlagzeug",
  };

  return (
    <>
      <a
        href="/admin"
        className="text-blue-600 text-sm hover:underline mb-4 block"
      >
        ← Alle Nutzer
      </a>

      <div className="mb-6">
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-gray-600 text-sm">{user.email}</p>
        <p className="text-sm mt-1">
          Pfad: <strong>{PATH_LABELS[path]}</strong> · Im Gewächshaus seit{" "}
          {daysSince(user.created_at)} Tagen · Start:{" "}
          {new Date(user.created_at).toLocaleDateString("de-DE")}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Instrumente: {user.instruments.join(", ")}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <UserDetail
          track="theologie"
          modules={getModules(path, "theologie")}
          progress={progress}
        />
        <UserDetail
          track="theorie"
          modules={getModules(path, "theorie")}
          progress={progress}
        />
      </div>
    </>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/admin/ components/admin/
git commit -m "feat: add admin dashboard with user progress overview and detail view"
```

---

## Task 13: Deployment

**Files:**

- Create: `vercel.json` (optional)

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/DEIN-USERNAME/gewaechshaus.git
git push -u origin main
```

- [ ] **Step 2: Deploy auf Vercel**

1. Gehe zu [vercel.com](https://vercel.com) → "New Project"
2. GitHub-Repo importieren
3. Environment Variables hinzufügen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy klicken

Expected: Deployment erfolgreich, Website unter `*.vercel.app` erreichbar.

- [ ] **Step 3: Admin-Account erstellen**

In Supabase → SQL Editor:

```sql
-- Erst den Nutzer normal über die Website registrieren,
-- dann mit dessen ID den Admin-Flag setzen:
update public.users
set is_admin = true
where email = 'deine-email@beispiel.de';
```

- [ ] **Step 4: End-to-end Test**

Manuell prüfen:

- [ ] Registrierung mit Instrumentenauswahl → richtiger Pfad zugewiesen
- [ ] Login / Logout funktioniert
- [ ] Dashboard zeigt beide Tracks
- [ ] Modul-Seite: Videos & Texte öffnen → "Test starten" erscheint
- [ ] Test bestehen (≥80%) → Modul abgeschlossen, nächstes freigeschaltet
- [ ] Test nicht bestehen → Sperre 24h sichtbar
- [ ] Zweites Modul ohne erstes bestanden → Redirect auf Dashboard
- [ ] Admin-Dashboard: alle Nutzer mit Fortschritt sichtbar
- [ ] Admin-Detailseite zeigt Track-Details

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: finalize deployment configuration"
```

---

## Zusammenfassung

| Task | Inhalt                          |
| ---- | ------------------------------- |
| 1    | Next.js + Dependencies + Types  |
| 2    | Supabase Schema + RLS           |
| 3    | Supabase Clients + Middleware   |
| 4    | Path Resolver (TDD)             |
| 5    | Progress Utilities (TDD)        |
| 6    | Content JSON + Loader           |
| 7    | Root Layout + Landing           |
| 8    | Login + Registrierung           |
| 9    | Dashboard                       |
| 10   | Modul-Seite + Material Tracking |
| 11   | Quiz + API Route                |
| 12   | Admin Dashboard                 |
| 13   | Deployment                      |
