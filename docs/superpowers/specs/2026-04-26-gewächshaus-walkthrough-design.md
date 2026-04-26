# Design: Gewächshaus Walkthrough

**Datum:** 2026-04-26
**Status:** Approved

## Ziel

Das Gewächshaus wird zu einem geführten, vollbildschirmfüllenden Walkthrough-Erlebnis. Nutzer durchlaufen alle Lektionen sequenziell, jede Lektion wird durch Klick auf "Lektion abschließen" abgeschlossen. Am Ende folgt eine Abschlussprüfung auf einer eigenen Seite. Design: modern, minimalistisch, kein Navbar.

---

## Routen

```
app/(walkthrough)/gewächshaus/layout.tsx         → Vollbild-Layout ohne Navbar
app/(walkthrough)/gewächshaus/page.tsx           → Redirect zum aktuellen Schritt
app/(walkthrough)/gewächshaus/[schritt]/page.tsx → Walkthrough-Seite (Schritt 1–N)
app/(walkthrough)/gewächshaus/pruefung/page.tsx  → Abschlussprüfung
```

Eigene Route-Gruppe `(walkthrough)` — unabhängig von `(app)`, kein Navbar, kein Sidebar.

Die Bereich-Seite `/bereich/gewaechshaus` bekommt einen "Gewächshaus starten / Weitermachen"-Button der zu `/gewächshaus` führt.

---

## UI — Walkthrough-Seite

```
┌──────────────────────────────────────────────────────┐
│  ← Übersicht                      Schritt 3 von 20  │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░  15%             │
├──────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│  IDENTITÄT & HALTUNG                                 │  ← Modul, klein, grau, uppercase
│  Die Stiftshütte                                     │  ← Titel, groß, bold
│                                                      │
│  [Video / Text / H5P]                                │
│                                                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Lektion abschließen →                       │   │  ← teal = aktiv / grau = gesperrt
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

- Vollbild, `min-h-screen`, kein Navbar
- Fortschrittsbalken: `completedCount / totalLektionen`
- Modul-Name: klein, grau, uppercase über dem Titel
- Kein Zurück zur vorherigen Lektion — nur "← Übersicht" zurück zu `/bereich/gewaechshaus`
- Button: immer sichtbar, `disabled` bis Bedingung erfüllt

---

## Abschluss-Logik pro Lektion

| Zustand                               | Button               |
| ------------------------------------- | -------------------- |
| Lektion hat kein H5P                  | sofort aktiv         |
| Lektion hat H5P, noch nicht bestanden | grau, nicht klickbar |
| Alle H5P erfolgreich abgeschlossen    | teal, klickbar       |

**H5P-Erkennung:** `H5PPlayer` bekommt eine `onComplete`-Callback-Prop. Intern wird auf das xAPI-Event `result.success = true` gehört:

```typescript
window.H5P?.externalDispatcher?.on("xAPI", (event) => {
  if (event.data.statement.result?.success) onComplete();
});
```

Klick auf "Lektion abschließen":

1. `POST /api/lektion-complete` mit `{ lektionId }`
2. Setzt `lektion_progress.passed = true, completed_at = now()`
3. Client-seitiger Redirect zu `/gewächshaus/[nächster-schritt]` oder `/gewächshaus/pruefung`

---

## Abschlussprüfung (`/gewächshaus/pruefung`)

- Freigeschaltet wenn alle Gewächshaus-Lektionen abgeschlossen sind, sonst Redirect zu `/gewächshaus`
- Gleiches Vollbild-Layout wie Walkthrough
- Inhalt: ein H5P-Paket (in Lumi erstellt, nach `public/h5p-content/gewächshaus-pruefung/` kopiert)
- H5P-Pfad wird als Umgebungsvariable oder direkt im Code hinterlegt: `"/h5p-content/gewächshaus-pruefung"`
- Nach Abschluss: Erfolgsmeldung + Link zum Dashboard

---

## Reihenfolge der Schritte

Lektionen werden sortiert nach:

1. Modul `order` (aufsteigend)
2. Lektion `order` innerhalb des Moduls (aufsteigend)

Der URL-Parameter `[schritt]` ist der 1-basierte Index in dieser sortierten Liste.

`/gewächshaus` → findet die erste nicht abgeschlossene Lektion → Redirect zu `/gewächshaus/[index]`

---

## API

### Neu: `POST /api/lektion-complete`

```typescript
body: {
  lektionId: string;
}
// Setzt lektion_progress.passed = true, completed_at = now()
// Erstellt den Eintrag falls noch nicht vorhanden (upsert)
```

---

## Bereich-Seite (`/bereich/gewaechshaus`)

Bestehende Modul-Übersicht bleibt. Neu: prominenter Button ganz oben:

- Noch kein Fortschritt: **"Gewächshaus starten →"**
- Teilweise abgeschlossen: **"Weitermachen →"** + "Schritt X von Y"
- Alle abgeschlossen: **"Zur Abschlussprüfung →"**

---

## Code-Aufräumen

- `LektionClient.tsx`: Quiz-Block entfernen (wird für Gewächshaus nicht mehr genutzt, andere Bereiche nutzen `/lektion/[id]` weiterhin — aber Gewächshaus-Lektionen sind nur noch über den Walkthrough erreichbar)
- `H5PPlayer.tsx`: `onComplete`-Prop hinzufügen
- Bestehende Quiz-Fragen in Gewächshaus-Lektionen können in der DB bleiben (kein Delete nötig, werden nur nicht mehr angezeigt)

---

## Was nicht geändert wird

- `/lektion/[id]` bleibt für alle anderen Bereiche (Audio, Video, etc.)
- Das Quiz-System (`/api/quiz`, `QuizEditor`) bleibt für andere Bereiche
- Modul-Struktur und alle bisherigen Daten bleiben erhalten
