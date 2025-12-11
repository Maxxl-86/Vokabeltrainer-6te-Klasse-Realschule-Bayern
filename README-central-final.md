# Vokabeltrainer – Central Final FIX

Fertig zum Hochladen: responsive App, CSV-Importer und zentrale Vokabelliste (u1..u7).

## Einbau
1. Alle Dateien ins Repo-Root hochladen: `index.html`, `style.css`, `app-inline.js`, `import.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`, Ordner `vocab/` mit `vocab.json`.
2. Commit → Seite öffnen → Update-Banner → **Neu laden**.

## Zentrale Liste
- Datei: `./vocab/vocab.json` (Version: 2025-12-11-03)
- Anpassung: Wörter je Unit ergänzen/ändern. **Versionstring erhöhen**.

## CSV-Import
- Seite `import.html`: CSV je Unit importieren (`unit;de;en`), **Zusammenführen** oder **Ersetzen**.

## Lernlogik
- Fehlergewichtung, Anti-Repeat, Presets (Unit-Spannen), freie Mehrfachauswahl.
