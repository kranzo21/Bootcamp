# Worship Content Design

**Datum:** 2026-04-16
**Projekt:** Ecclesia LMS — Worship-Programm

---

## Überblick

Dieses Spec beschreibt die Neugestaltung der Worship-Programmseite mit drei Tabs (Gewächshaus, Tutorials, Ressourcen), einem modernen Lektion-Editor mit Tiptap, einem benutzerfreundlichen Quiz-Editor sowie Tutorials und Ressourcen mit Suche und Instrument-Filter.

---

## 1. Worship-Programmseite (`/programm/worship`)

Die bestehende Programmseite wird auf ein Tab-System umgestellt mit drei gleichwertigen Reitern:

### Tabs

- **Gewächshaus** — zeigt die Liste aller Lektionen mit individuellem Fortschrittsbalken pro Lektion
- **Tutorials** — zeigt alle Tutorials des Worship-Programms mit Suche und Instrument-Filter
- **Ressourcen** — zeigt alle Ressourcen des Worship-Programms mit Suche und Instrument-Filter

### Datenbankänderungen

- Keine strukturellen Änderungen an `programs` oder `areas`
- Tutorials und Ressourcen werden programm-weit abgerufen (über `getTutorialsByProgram` / `getRessourcenByProgram`)

---

## 2. Gewächshaus-Tab: Lektionen

### Darstellung (Nutzer)

- Liste aller Lektionen mit Titel, kurzer Beschreibung, Fortschrittsindikator (bestanden / nicht bestanden)
- Klick öffnet die Lektions-Seite

### Lektions-Seite (`/lektion/[id]`)

Aufbau:

1. Titel
2. Video (YouTube, eingebettet — optional, Position oben oder unten konfigurierbar)
3. Formatierter Text (Tiptap-HTML)
4. Quiz (Multiple Choice)

### Datenbankänderungen (`lektionen`-Tabelle)

Neue Spalten via Migration:

```sql
ALTER TABLE lektionen
  ADD COLUMN content text,
  ADD COLUMN video_url text,
  ADD COLUMN video_position text DEFAULT 'above' CHECK (video_position IN ('above', 'below'));
```

Die bestehende `materials`-Tabelle wird für Lektionen nicht mehr verwendet. Bestehende `material`-Einträge bleiben erhalten, werden aber auf der Lektionsseite nicht mehr angezeigt.

---

## 3. Tiptap Rich-Text-Editor

### Verwendung

- In der Admin-Oberfläche beim Erstellen/Bearbeiten einer Lektion
- Paket: `@tiptap/react`, `@tiptap/starter-kit`

### Unterstützte Formatierungen

- Fett, Kursiv, Unterstrichen
- Überschriften (H2, H3)
- Aufzählungslisten (geordnet + ungeordnet)
- Absätze

### Speicherformat

- HTML-String, gespeichert in `lektionen.content`
- Rendering auf der Nutzerseite via `dangerouslySetInnerHTML` mit Tailwind-Prose-Klassen (`@tailwindcss/typography`)

---

## 4. Quiz-Editor (Admin)

### Benutzeroberfläche

- Eigener Abschnitt auf der Lektion-Bearbeitungsseite
- Button „+ Frage hinzufügen"
- Pro Frage:
  - Textfeld für die Frage
  - 2–4 Antwortfelder (dynamisch hinzufügbar/entfernbar)
  - Radiobutton zur Markierung der richtigen Antwort
  - Button „Frage löschen"
- Speichern erfolgt zusammen mit dem Rest der Lektion

### Datenbank

- Bestehende `quiz_questions`-Tabelle (`question`, `options` JSON-Array, `correct_index`, `order`, `lektion_id`) bleibt unverändert
- Admin-UI schreibt/liest über eine dedizierte API-Route

### API-Routen

- `POST /api/admin/quiz-questions` — Frage erstellen
- `PATCH /api/admin/quiz-questions` — Frage bearbeiten
- `DELETE /api/admin/quiz-questions` — Frage löschen

---

## 5. Tutorials-Tab

### Darstellung (Nutzer)

- Kachelraster mit YouTube-Thumbnail (automatisch aus Video-URL extrahiert), Titel, Instrument-Tag
- Oben: Suchfeld (live, nach Titel) + Dropdown „Instrument" (filtert nach `instrument`-Feld)
- Klick öffnet Tutorial-Seite mit eingebettetem YouTube-Player

### YouTube-Embedding

- Admin gibt reguläre YouTube-URL ein (`youtube.com/watch?v=...` oder `youtu.be/...`)
- App konvertiert automatisch zu Embed-URL (`youtube.com/embed/VIDEO_ID`)
- Video spielt direkt in der App, kein Redirect zu YouTube

### Datenbankänderungen (`tutorials`-Tabelle)

```sql
ALTER TABLE tutorials ADD COLUMN instrument text;
```

### Admin-UI

- Felder: Titel, YouTube-URL, Beschreibung (optional), Instrument (optional, Freitext)

---

## 6. Ressourcen-Tab

### Darstellung (Nutzer)

- Liste mit Titel, Typ-Icon und Vorschau je nach Typ:

| Typ       | Darstellung                               |
| --------- | ----------------------------------------- |
| `pdf`     | SharePoint-Embed-Iframe + Download-Button |
| `audio`   | HTML5 `<audio>`-Player + Download-Button  |
| `image`   | `<img>`-Tag + Download-Button             |
| `youtube` | Eingebetteter YouTube-Player              |

- Oben: Suchfeld + Dropdown „Instrument"
- SharePoint-Links funktionieren nur zuverlässig, wenn die Dateien als „Jeder mit dem Link" geteilt sind

### Datenbankänderungen (`ressourcen`-Tabelle)

```sql
ALTER TABLE ressourcen ADD COLUMN instrument text;
```

Das bestehende `type`-Feld (`text`) wird für den Typ verwendet: Werte `pdf`, `audio`, `image`, `youtube`.
Das bestehende `url`-Feld speichert den SharePoint- oder YouTube-Link.

### Admin-UI

- Felder: Titel, Typ (Dropdown: PDF / Audio / Bild / YouTube), URL, Instrument (optional), Beschreibung (optional)

---

## 7. Admin-UI Zusammenfassung

### Neue/geänderte Admin-Seiten

| Seite                | Änderung                                                 |
| -------------------- | -------------------------------------------------------- |
| Lektion bearbeiten   | Tiptap-Editor + Video-URL + Video-Position + Quiz-Editor |
| Tutorial bearbeiten  | YouTube-URL (mit Hinweis auf Format) + Instrument-Feld   |
| Ressource bearbeiten | Typ-Dropdown + URL + Instrument-Feld                     |

Der bestehende generische `ContentEditor` wird für Lektionen durch eine dedizierte `LektionEditor`-Komponente ersetzt. Tutorials und Ressourcen erhalten ebenfalls dedizierte Formulare (oder der ContentEditor wird entsprechend erweitert).

---

## 8. Nicht im Scope

- Produktion-Programm (später separates Spec)
- Datei-Upload direkt in die App (SharePoint-Links werden als externe URLs gespeichert)
- Drag & Drop Reihenfolge für Quiz-Fragen (Reihenfolge über `order`-Feld, manuell eingebbar)
- Benutzer-seitiger Instrument-Filter für Lektionen (nur Tutorials + Ressourcen)
