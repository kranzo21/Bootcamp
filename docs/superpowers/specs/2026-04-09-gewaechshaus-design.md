# Gewächshaus – Design-Dokument

**Datum:** 2026-04-09  
**Status:** Genehmigt

---

## Überblick

Interaktive Web-Plattform für neue Musiker in der Gemeinde. Nutzer durchlaufen ein strukturiertes Bootcamp ("Gewächshaus"), das aus zwei parallelen Tracks besteht: Theologie und Theorie. Jeder Nutzer wird anhand seiner Instrumentenwahl einem von drei Pfaden zugewiesen. Admins können den Fortschritt aller Nutzer einsehen.

---

## Technologie-Stack

| Komponente         | Technologie                            |
| ------------------ | -------------------------------------- |
| Frontend & Routing | Next.js (App Router)                   |
| Auth & Datenbank   | Supabase (PostgreSQL)                  |
| Hosting            | Vercel (kostenlos)                     |
| Inhalte            | Statische JSON-Dateien im Code         |
| Videos             | Externe URLs (z.B. YouTube-Einbettung) |

---

## Pfad-Zuweisung

Nutzer wählen bei der Registrierung ihre Instrumente aus:

**Verfügbare Instrumente:** Klavier, Gitarre, E-Gitarre, Bass, Geige, Vocals, Drums

**Zuweisung:**

- Mindestens ein Toninstrument (Klavier, Gitarre, E-Gitarre, Bass, Geige) → **Instrumentalist**
- Nur Vocals → **Vocals**
- Nur Drums → **Drums**

---

## Datenbankschema

### `users`

| Feld        | Typ       | Beschreibung                                         |
| ----------- | --------- | ---------------------------------------------------- |
| id          | uuid      | Supabase Auth ID                                     |
| name        | text      | Anzeigename                                          |
| email       | text      | Email-Adresse                                        |
| instruments | text[]    | Gewählte Instrumente                                 |
| path        | text      | Zugewiesener Pfad (instrumentalist / vocals / drums) |
| is_admin    | boolean   | Admin-Flag                                           |
| created_at  | timestamp | Startdatum im Gewächshaus                            |

### `progress`

| Feld                | Typ       | Beschreibung                  |
| ------------------- | --------- | ----------------------------- |
| id                  | uuid      |                               |
| user_id             | uuid      | Referenz auf users            |
| module_id           | text      | ID des Moduls (z.B. "theo-1") |
| track               | text      | theologie / theorie           |
| materials_completed | boolean   | Alle Materialien geöffnet     |
| passed              | boolean   | Test bestanden                |
| completed_at        | timestamp | Zeitpunkt des Abschlusses     |

### `quiz_attempts`

| Feld         | Typ       | Beschreibung                 |
| ------------ | --------- | ---------------------------- |
| id           | uuid      |                              |
| user_id      | uuid      | Referenz auf users           |
| module_id    | text      | ID des Moduls                |
| score        | float     | Erreichter Prozentsatz (0–1) |
| passed       | boolean   | >= 0.8                       |
| attempted_at | timestamp | Zeitpunkt des Versuchs       |

---

## Benutzerfluss

### Registrierung

1. Name, Email, Passwort eingeben
2. Instrumente auswählen (Checkboxes)
3. Pfad wird automatisch berechnet und gespeichert
4. Weiterleitung zum Dashboard

### Dashboard

- Übersicht beider Tracks: Theologie & Theorie
- Fortschrittsbalken pro Track (% abgeschlossener Module)
- Nächste offene Einheit direkt klickbar
- Tracks können in beliebiger Reihenfolge bearbeitet werden
- Innerhalb eines Tracks: strikt sequenziell (Modul n+1 erst nach Abschluss von n)

### Modul-Ansicht

1. Videos anschauen und Texte lesen (freie Reihenfolge innerhalb des Moduls)
2. Sobald alle Materialien geöffnet wurden: Button "Test starten" erscheint
3. Multiple-Choice-Test absolvieren
4. **Bestanden (≥80%):** Modul abgeschlossen, nächstes freigeschaltet
5. **Nicht bestanden (<80%):** 24h Sperre, danach erneuter Versuch möglich

---

## Admin-Dashboard

Geschützte Route `/admin`, nur für Nutzer mit `is_admin = true` zugänglich.  
Admin-Accounts werden direkt in Supabase angelegt — kein öffentliches Registrierungsformular.

### Nutzer-Übersicht

- Name, Email
- Instrumentenwahl & zugewiesener Pfad
- Startdatum & Tage seit Start
- Gesamtfortschritt (%)

### Nutzer-Detailansicht

- Theologie-Track: % abgeschlossen, welche Module fertig / offen
- Theorie-Track: % abgeschlossen, welche Module fertig / offen
- Letzte Aktivität

---

## Inhaltsstruktur

Inhalte sind als JSON-Dateien im Code hinterlegt. Jeder Pfad hat eigene Dateien pro Track:

```
content/
├── instrumentalist/
│   ├── theologie.json
│   └── theorie.json
├── vocals/
│   ├── theologie.json
│   └── theorie.json
└── drums/
    ├── theologie.json
    └── theorie.json
```

### Modul-Format (JSON)

```json
{
  "id": "theo-1",
  "titel": "Was ist Lobpreis?",
  "videos": [{ "titel": "Einführung", "url": "https://youtube.com/..." }],
  "texte": [{ "titel": "Hintergrund", "inhalt": "Fließtext..." }],
  "fragen": [
    {
      "frage": "Was bedeutet Lobpreis?",
      "optionen": ["Option A", "Option B", "Option C", "Option D"],
      "richtig": 0
    }
  ]
}
```

---

## Sprache

Deutsch (Englisch als spätere Erweiterung vorgesehen, aber nicht im ersten Release).

---

## Nicht im Scope (erster Release)

- Mehrsprachigkeit
- Email-Benachrichtigungen
- Kommentarfunktion / Community-Features
- Zertifikate oder Abzeichen
