# Ecclesia LMS — App-Struktur

```mermaid
mindmap
  root((Ecclesia LMS))
    Auth
      /login
        LoginForm
      /registrieren
        RegisterForm
          Programmauswahl
          Instrument-Checkboxen optional
    App
      /dashboard
        Programme Karten
        Abzeichen
        Qualifikationen
      /programm/[slug]
        Tab: Allgemein
          Reguläre Bereiche
            Fortschrittsbalken
            Link zu /bereich/[slug]
          Instrumente-Grid
            Link zu /instrument/[slug]
        Tab: Mein Bereich
          Meine Favoriten
            Favorisierte Tutorials
            Favorisierte Ressourcen
          Meine Instrumente
            Link zu /einstellungen
      /bereich/[slug]
        Lektionen-Liste
          Fortschritt-Haken ✓
          Link zu /lektion/[id]
      /instrument/[slug]
        Tab: Tutorials
          Video-Karten
          Stern ★ Favorit-Button
          Link zu /tutorial/[id]
        Tab: Ressourcen
          Link/PDF/Dokument Karten
          Stern ★ Favorit-Button
      /lektion/[id]
        Materialien
          Video-Player
          Text-Inhalt
          Tutorial-Embed
        Quiz
          4 Antwortoptionen
          Bestehen → Abzeichen
      /tutorial/[id]
        Video-Player
        Beschreibung
      /einstellungen
        Name & E-Mail
        Instrument-Auswahl
        Speichern
    Admin
      /admin
        Übersicht
      /admin/nutzer
        Nutzerliste
        /admin/nutzer/[id]
          Programme vergeben
          Abzeichen vergeben
          Qualifikationen bestätigen
      /admin/inhalte
        Inhaltsliste
        /admin/inhalte/neu
          Lektion anlegen
          Material anlegen
          Quiz-Frage anlegen
          Tutorial anlegen
          Ressource anlegen
        /admin/inhalte/bearbeiten
          Inhalt bearbeiten
      /admin/qualifikationen
        Qualifikationen-Übersicht
    API
      /api/favourites
        POST: Favorit hinzufügen
        DELETE: Favorit entfernen
      /api/user-instruments
        PATCH: Instrumente speichern
      /api/quiz
        POST: Quiz einreichen
        Bestanden → Abzeichen
      /api/material-view
        POST: Ansicht tracken
      /api/logout
        POST: Ausloggen
      /api/admin
        content: Inhalt verwalten
        user-badges: Abzeichen
        user-programs: Programme
        user-qualifications: Qualifikationen
    Datenbank
      Programme
        worship
        produktion
      Bereiche
        regular: gewaechshaus, audio, video, beamer, licht, setup
        instrument: gitarre, bass, keys, drums, gesang, ...
      Lektionen → Materialien → Quiz
      Tutorials
      Ressourcen
      Badges → Qualifications
      User-Tabellen
        user_programs
        lektion_progress
        material_views
        quiz_attempts
        user_badges
        user_qualifications
        user_favourites
```

## Tech Stack

| Schicht   | Technologie                        |
| --------- | ---------------------------------- |
| Frontend  | Next.js 16, App Router, TypeScript |
| Styling   | Tailwind CSS                       |
| Auth + DB | Supabase (PostgreSQL + RLS)        |
| Hosting   | Vercel                             |
| Branch    | `feature/implementation`           |
| GitHub    | kranzo21/Bootcamp                  |

## Routen-Übersicht

| Route                    | Beschreibung                                    |
| ------------------------ | ----------------------------------------------- |
| `/login`                 | Login-Seite                                     |
| `/registrieren`          | Registrierung mit Programm- & Instrumentwahl    |
| `/dashboard`             | Übersicht: Programme, Abzeichen, Quals          |
| `/programm/[slug]`       | Programm-Seite mit 2 Tabs                       |
| `/bereich/[slug]`        | Bereich mit Lektionen-Liste                     |
| `/instrument/[slug]`     | Instrument: Tutorials & Ressourcen favorisieren |
| `/lektion/[id]`          | Lektion: Materialien + Quiz                     |
| `/tutorial/[id]`         | Tutorial: Video                                 |
| `/einstellungen`         | Account & Instrument-Einstellungen              |
| `/admin`                 | Admin-Bereich (nur Admins)                      |
| `/admin/nutzer`          | Nutzerverwaltung                                |
| `/admin/inhalte`         | Inhaltsverwaltung                               |
| `/admin/qualifikationen` | Qualifikationen verwalten                       |
