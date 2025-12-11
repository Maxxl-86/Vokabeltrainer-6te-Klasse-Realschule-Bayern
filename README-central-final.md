# Vokabeltrainer – Central Final Build

Dieses Paket ist fix & fertig: responsive App, CSV-Importer und zentrale Vokabelliste (u1..u7).

## Einbau
- Dateien ins Repo-Root hochladen (`index.html`, `style.css`, `app-inline.js`, `import.html`, `manifest.webmanifest`, `sw.js`, Icons, Ordner `vocab/`).
- Commit → Seite öffnen → Update-Banner → Neu laden.

## Zentrale Liste
- `vocab/vocab.json` enthält ca. 175 Vokabelpaare.
- Bei Änderungen **version** erhöhen (z. B. `2025-12-11-03`).

## CSV-Import
- `import.html` → CSV `unit;de;en` → Parsen → Zusammenführen/Ersetzen.
