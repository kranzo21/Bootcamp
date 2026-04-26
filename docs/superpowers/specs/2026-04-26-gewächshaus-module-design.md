# Design: Gewächshaus — Modul-Struktur

**Datum:** 2026-04-26
**Status:** Approved

## Ziel

Das Gewächshaus (Onboarding-Programm für neue Worship-Team-Mitglieder) wird in drei sichtbare Module gegliedert. Lektionen werden diesen Modulen zugeordnet und auf der Bereich-Seite mit Modul-Headern angezeigt.

## Datenbankschema

### Neue Tabelle: `modules`

| Feld          | Typ               | Beschreibung                |
| ------------- | ----------------- | --------------------------- |
| `id`          | uuid (PK)         | Primärschlüssel             |
| `area_id`     | uuid (FK → areas) | Zugehöriger Bereich         |
| `name`        | text              | z.B. "Identität & Haltung"  |
| `description` | text nullable     | Kurzbeschreibung des Moduls |
| `order`       | integer           | Reihenfolge (1, 2, 3)       |

### Änderung an `lektionen`

Neue Spalte: `module_id uuid nullable references modules(id)`.
Lektionen ohne `module_id` bleiben funktionsfähig (andere Bereiche nicht betroffen).

## Curriculum — 3 Module, 20 Lektionen

### Modul 1: Identität & Haltung (7 Lektionen)

| #   | Titel                        | Status                 |
| --- | ---------------------------- | ---------------------- |
| 1   | Einleitung & Grundwerte      | bestehend              |
| 2   | Identität als Anbeter        | bestehend              |
| 3   | Die Stiftshütte              | bestehend              |
| 4   | In der Gegenwart Gottes      | bestehend              |
| 5   | Der Heilige Geist im Worship | **neu**                |
| 6   | Gemeinde & Einheit           | **neu**                |
| 7   | Dresscode & Bühnenpräsenz    | bestehend (verschoben) |

### Modul 2: Musiktheorie (7 Lektionen)

| #   | Titel                      | Status                     |
| --- | -------------------------- | -------------------------- |
| 1   | Grundlagen                 | umstrukturiert (aus L5/L6) |
| 2   | Harmonie                   | umstrukturiert (aus L5/L6) |
| 3   | Sound                      | **neu**                    |
| 4   | Arrangement                | **neu**                    |
| 5   | Dynamik                    | **neu**                    |
| 6   | Vorbereitung am Instrument | umstrukturiert (aus L9)    |
| 7   | Vorbereitung als Vocalist  | umstrukturiert (aus L9)    |

### Modul 3: Praxis & Tools (6 Lektionen)

| #   | Titel       | Status                                 |
| --- | ----------- | -------------------------------------- |
| 1   | ChurchTools | bestehend                              |
| 2   | Ressourcen  | bestehend/erweitert (aus Google Drive) |
| 3   | ME-1 Setup  | **neu**                                |
| 4   | Pedalboard  | **neu**                                |
| 5   | Keys-Sounds | **neu**                                |
| 6   | Drumset     | **neu**                                |

### Zu löschende Lektionen

- In-Ear-Monitoring & P16
- Bandworkshop

## UI — Bereich-Seite (Gewächshaus)

Die Seite `/bereich/gewaechshaus` zeigt Lektionen gruppiert nach Modul:

```
[Modul 1: Identität & Haltung]
  Lektion 1 — Einleitung & Grundwerte         ✓
  Lektion 2 — Identität als Anbeter
  ...

[Modul 2: Musiktheorie]
  Lektion 1 — Grundlagen
  ...

[Modul 3: Praxis & Tools]
  Lektion 1 — ChurchTools
  ...
```

- Modul-Header: Name + optionale Beschreibung, visuell abgesetzt
- Lektionen innerhalb eines Moduls: bestehender Accordion-Stil bleibt
- Fortschritts-Haken (✓) bleiben pro Lektion erhalten
- Lektionen ohne `module_id` werden ungrouped am Ende angezeigt (Fallback)

## Admin

- Neuer Bereich im Admin: **Module verwalten** (pro Bereich)
- Module anlegen/bearbeiten/löschen
- Im Lektions-Editor: Dropdown zur Modul-Zuordnung

## Migration

Eine neue SQL-Migration (`008_modules.sql`):

1. Tabelle `modules` erstellen mit RLS
2. Spalte `module_id` zu `lektionen` hinzufügen
3. Drei Module für Gewächshaus anlegen
4. Bestehende Lektionen den Modulen zuordnen
5. Zwei Lektionen (In-Ear, Bandworkshop) löschen

## Was nicht geändert wird

- Andere Bereiche (Audio, Video etc.) sind nicht betroffen
- Die Lektion-Seite (`/lektion/[id]`) bleibt unverändert
- Das Quiz- und Badge-System bleibt unverändert
- Instrument-Bereiche sind nicht betroffen
