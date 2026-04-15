# Ecclesia Lernplattform – Design-Dokument

**Datum:** 2026-04-15
**Status:** Genehmigt

---

## Überblick

Das bestehende Gewächshaus-Projekt wird zur **Ecclesia-Lernplattform** umgebaut — einem vollständigen Lernmanagementsystem (LMS) für die Kirchengemeinde. Nutzer können sich in Programme einschreiben, strukturierte Lektionen absolvieren, Abzeichen sammeln und vom Admin bestätigte Qualifikationen erwerben. Alle Inhalte werden über ein Admin-Interface in Supabase verwaltet — kein Code-Deployment für Inhaltsänderungen nötig.

Gleicher Tech-Stack wie bisher: Next.js (App Router, TypeScript, Tailwind CSS), Supabase (Auth + PostgreSQL, RLS), Vercel.

---

## Inhaltshierarchie

```
Programm          → z.B. "Worship", "Produktion"
  └── Bereich     → z.B. "Gewächshaus", "Audio", "Video"
        ├── Lektionen  → strukturierte Module mit Materialien + Test
        ├── Tutorials  → eigenständige Videos, auch in Lektionen eingebettet
        └── Ressourcen → Links, PDFs, Referenzmaterialien
```

### Programme

| Programm   | Bereiche                           |
| ---------- | ---------------------------------- |
| Worship    | Gewächshaus                        |
| Produktion | Audio, Video, Beamer, Licht, Setup |

Jeder Bereich hat drei Tabs: **Lektionen**, **Tutorials**, **Ressourcen**.
Weitere Bereiche können jederzeit über das Admin-Interface hinzugefügt werden.

### Tutorials

Tutorials sind **wiederverwendbare Video-Einheiten**. Sie erscheinen:

1. Im "Tutorials"-Tab eines Bereichs — als schnelles Nachschlagewerk
2. Eingebettet in Lektionen — als Lernmaterial

Ein Tutorial gehört zu einem Bereich, kann aber in mehreren Lektionen referenziert werden.

### Lektionen

Eine Lektion besteht aus:

- Materialien in fixer Reihenfolge (Videos via Tutorial-Referenz oder externe URL, + Texte)
- Einem Pflichttest (Multiple Choice, 80% Bestehensgrenze, 24h Sperre bei Nicht-Bestehen)
- Einem Abzeichen, das bei Bestehen vergeben wird

### Ressourcen

Reine Referenzmaterialien — Links, PDFs, Dokumente. Kein Test, kein Abzeichen.

---

## Datenbankschema

### Inhaltsverwaltung

#### `programs`

| Feld        | Typ  | Beschreibung                           |
| ----------- | ---- | -------------------------------------- |
| id          | uuid | Primary Key                            |
| name        | text | Anzeigename (z.B. "Worship")           |
| slug        | text | URL-freundlicher Name (z.B. "worship") |
| description | text | Kurzbeschreibung                       |
| order       | int  | Reihenfolge im Dashboard               |

#### `areas`

| Feld        | Typ  | Beschreibung                        |
| ----------- | ---- | ----------------------------------- |
| id          | uuid | Primary Key                         |
| program_id  | uuid | Referenz auf programs               |
| name        | text | Anzeigename (z.B. "Audio")          |
| slug        | text | URL-freundlicher Name               |
| description | text | Kurzbeschreibung                    |
| order       | int  | Reihenfolge innerhalb des Programms |

#### `tutorials`

| Feld        | Typ  | Beschreibung                         |
| ----------- | ---- | ------------------------------------ |
| id          | uuid | Primary Key                          |
| area_id     | uuid | Referenz auf areas                   |
| title       | text | Titel                                |
| video_url   | text | Einbettbare Video-URL (z.B. YouTube) |
| description | text | Kurzbeschreibung                     |
| order       | int  | Reihenfolge im Tutorials-Tab         |

#### `lektionen`

| Feld        | Typ  | Beschreibung                       |
| ----------- | ---- | ---------------------------------- |
| id          | uuid | Primary Key                        |
| area_id     | uuid | Referenz auf areas                 |
| title       | text | Titel                              |
| description | text | Kurzbeschreibung                   |
| order       | int  | Reihenfolge innerhalb des Bereichs |

#### `materials`

| Feld        | Typ  | Beschreibung                                               |
| ----------- | ---- | ---------------------------------------------------------- |
| id          | uuid | Primary Key                                                |
| lektion_id  | uuid | Referenz auf lektionen                                     |
| type        | text | "video" oder "text"                                        |
| title       | text | Anzeigename                                                |
| content     | text | Text-Inhalt (bei type = "text")                            |
| video_url   | text | Externe URL (bei type = "video", falls kein Tutorial)      |
| tutorial_id | uuid | Referenz auf tutorials (optional, wenn Video aus Tutorial) |
| order       | int  | Reihenfolge innerhalb der Lektion                          |

#### `quiz_questions`

| Feld          | Typ   | Beschreibung                      |
| ------------- | ----- | --------------------------------- |
| id            | uuid  | Primary Key                       |
| lektion_id    | uuid  | Referenz auf lektionen            |
| question      | text  | Fragetext                         |
| options       | jsonb | Array mit 4 Antwortmöglichkeiten  |
| correct_index | int   | Index der richtigen Antwort (0–3) |
| order         | int   | Reihenfolge                       |

#### `ressourcen`

| Feld        | Typ  | Beschreibung              |
| ----------- | ---- | ------------------------- |
| id          | uuid | Primary Key               |
| area_id     | uuid | Referenz auf areas        |
| title       | text | Titel                     |
| description | text | Kurzbeschreibung          |
| url         | text | Link oder Datei-URL       |
| type        | text | "link", "pdf", "dokument" |
| order       | int  | Reihenfolge               |

#### `badges`

| Feld        | Typ  | Beschreibung                 |
| ----------- | ---- | ---------------------------- |
| id          | uuid | Primary Key                  |
| lektion_id  | uuid | Referenz auf lektionen (1:1) |
| name        | text | Name des Abzeichens          |
| description | text | Beschreibung                 |
| icon        | text | Emoji oder Icon-Name         |

#### `qualifications`

| Feld        | Typ  | Beschreibung           |
| ----------- | ---- | ---------------------- |
| id          | uuid | Primary Key            |
| name        | text | Name der Qualifikation |
| description | text | Beschreibung           |

#### `qualification_badges` (Junction)

| Feld             | Typ  | Beschreibung                |
| ---------------- | ---- | --------------------------- |
| qualification_id | uuid | Referenz auf qualifications |
| badge_id         | uuid | Referenz auf badges         |

### Nutzeraktivität

#### `user_programs`

| Feld        | Typ         | Beschreibung          |
| ----------- | ----------- | --------------------- |
| user_id     | uuid        | Referenz auf users    |
| program_id  | uuid        | Referenz auf programs |
| enrolled_at | timestamptz | Einschreibedatum      |

#### `lektion_progress`

| Feld                | Typ         | Beschreibung              |
| ------------------- | ----------- | ------------------------- |
| id                  | uuid        | Primary Key               |
| user_id             | uuid        | Referenz auf users        |
| lektion_id          | uuid        | Referenz auf lektionen    |
| materials_completed | boolean     | Alle Materialien geöffnet |
| passed              | boolean     | Test bestanden            |
| completed_at        | timestamptz | Zeitpunkt des Abschlusses |

#### `material_views`

| Feld        | Typ         | Beschreibung           |
| ----------- | ----------- | ---------------------- |
| id          | uuid        | Primary Key            |
| user_id     | uuid        | Referenz auf users     |
| material_id | uuid        | Referenz auf materials |
| viewed_at   | timestamptz | Erster Aufruf          |

#### `quiz_attempts`

| Feld         | Typ         | Beschreibung            |
| ------------ | ----------- | ----------------------- |
| id           | uuid        | Primary Key             |
| user_id      | uuid        | Referenz auf users      |
| lektion_id   | uuid        | Referenz auf lektionen  |
| score        | float       | Prozentwert (0.0 – 1.0) |
| passed       | boolean     | Bestanden (≥ 80%)       |
| attempted_at | timestamptz | Zeitpunkt               |

#### `user_badges`

| Feld      | Typ         | Beschreibung          |
| --------- | ----------- | --------------------- |
| id        | uuid        | Primary Key           |
| user_id   | uuid        | Referenz auf users    |
| badge_id  | uuid        | Referenz auf badges   |
| earned_at | timestamptz | Zeitpunkt des Erwerbs |

#### `user_qualifications`

| Feld             | Typ         | Beschreibung                |
| ---------------- | ----------- | --------------------------- |
| id               | uuid        | Primary Key                 |
| user_id          | uuid        | Referenz auf users          |
| qualification_id | uuid        | Referenz auf qualifications |
| confirmed_by     | uuid        | Admin-User-ID               |
| confirmed_at     | timestamptz | Zeitpunkt der Bestätigung   |

### Bestehende Tabelle (angepasst)

#### `users`

Bleibt erhalten. Die Felder `instruments`, `path` entfallen — werden durch `user_programs` ersetzt.

| Feld       | Typ         | Beschreibung        |
| ---------- | ----------- | ------------------- |
| id         | uuid        | Supabase Auth ID    |
| name       | text        | Anzeigename         |
| email      | text        | E-Mail-Adresse      |
| is_admin   | boolean     | Admin-Flag          |
| created_at | timestamptz | Registrierungsdatum |

---

## Seitenstruktur

```
/                           → Landing / Login-Weiterleitung
/login                      → Login
/registrieren               → Registrierung + Programm wählen
/dashboard                  → Fortschritt, Abzeichen, Qualifikationen, Programme
/programm/[slug]            → Bereichsübersicht eines Programms
/bereich/[slug]             → Tabs: Lektionen / Tutorials / Ressourcen
/lektion/[id]               → Materialien + Test
/tutorial/[id]              → Einzelnes Video
/profil                     → Eigene Abzeichen & Qualifikationen
/admin                      → Admin-Übersicht
/admin/inhalte              → Inhaltsverwaltung (Programme, Bereiche, Lektionen, Tutorials, Ressourcen)
/admin/inhalte/[type]/[id]  → Einzelnen Inhalt bearbeiten
/admin/nutzer               → Alle Nutzer mit Fortschritt
/admin/nutzer/[id]          → Nutzer bearbeiten: Fortschritt, Abzeichen, Qualifikationen
/admin/qualifikationen      → Qualifikationen definieren + Nutzer bestätigen
```

---

## Dashboard

Das Dashboard ist die Hauptseite nach dem Login und zeigt:

1. **Programm-Switcher** — Worship / Produktion (oben, prominent)
2. **Fortschritt** — Für jedes eingeschriebene Programm: wie viele Lektionen abgeschlossen vs. gesamt, pro Bereich aufgeschlüsselt
3. **Abzeichen** — Alle bisher verdienten Abzeichen als Icon-Grid mit Namen
4. **Qualifikationen** — Bestätigte Qualifikationen mit Status (ausstehend / bestätigt)

---

## Abzeichen & Qualifikationen

**Abzeichen:**

- Werden automatisch vergeben, wenn der Test einer Lektion bestanden wird (≥ 80%)
- Können vom Admin manuell vergeben oder entzogen werden

**Qualifikationen:**

- Ein Admin definiert, welche Abzeichen für eine Qualifikation benötigt werden
- Wenn ein Nutzer alle nötigen Abzeichen hat, wird die Qualifikation als "ausstehend" markiert
- Ein Admin bestätigt die Qualifikation manuell (z.B. nach persönlicher Überprüfung)
- Bestätigte Qualifikationen erscheinen im Profil und Dashboard des Nutzers

---

## Admin-Bereich

### Inhaltsverwaltung

- Programme anlegen / bearbeiten / löschen
- Bereiche anlegen / bearbeiten / löschen
- Lektionen anlegen mit Materialien (Videos + Texte) und Test-Fragen
- Tutorials anlegen (Video-URL, Titel, Bereich)
- Ressourcen anlegen
- Abzeichen für Lektionen definieren
- Qualifikationen definieren + benötigte Abzeichen zuweisen

### Nutzerverwaltung

- Alle Nutzer anzeigen mit Fortschritt, Abzeichen, Qualifikationen
- Fortschritt manuell setzen oder zurücksetzen
- Abzeichen manuell vergeben oder entziehen
- Qualifikation für Nutzer bestätigen

---

## Row Level Security

- Nutzer lesen/schreiben nur eigene Aktivitätsdaten (`lektion_progress`, `material_views`, `quiz_attempts`, `user_badges`, `user_programs`)
- Inhaltsdaten (`programs`, `areas`, `lektionen`, `materials`, `tutorials`, `ressourcen`, `badges`, `qualifications`) sind für alle eingeloggten Nutzer lesbar, nur Admins dürfen schreiben
- Admin-Zugriff über `is_admin()`-Hilfsfunktion (security definer, bereits in DB vorhanden)

---

## Migration

Das bestehende Projekt wird umgebaut, kein Neustart:

1. Altes Schema (`progress`, `material_views`, `quiz_attempts`, `users.instruments`, `users.path`) wird durch neues Schema ersetzt
2. Bestehende Auth-Nutzer bleiben erhalten
3. Inhalte waren Platzhalter — werden neu als DB-Einträge angelegt
4. Bestehende JSON-Inhaltsdateien entfallen
