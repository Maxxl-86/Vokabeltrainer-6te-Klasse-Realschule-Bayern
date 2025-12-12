\
# Patch: Auto-Repair & Versionsanzeige

Dieser Patch behebt das Problem **verschwundener Units** und zeigt eine **Versionsnummer** im UI an.

## Was ist drin?
- Auto-Repair der Units aus vorhandenen Karten (Tags)
- Merge von Units mit neuen Tags
- Fallback auf neutrale Defaults (6. Klasse)
- Versionsbadge (unten rechts) mit `APP_VERSION`
- Service Worker Update-Toast und Cache-Versioning
- Sicherer Import mit Backup & Rollback (optional in `import.html` nutzen)

## Installation
1. Ersetze `app-inline.js` und `sw.js` in deinem Projekt durch die Dateien aus diesem Patch.
2. Optional: Ergänze `importer.js` und nutze `window.VTImporter.safeImport([...])` in `import.html`.
3. Deploy – nach dem Laden siehst du `Vokabeltrainer v0.7.3`.
\
