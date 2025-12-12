\
# Versionierung & Update-Hinweise (v0.7.3)

Diese Patch-Dateien fügen eine **Versionsanzeige** (Badge) und einen **robusten Update-Mechanismus** über den Service Worker hinzu.

## Dateien
- `app-inline.js` – Auto-Repair für Units, Versions-Badge, SW-Registrierung
- `sw.js` – dynamischer Precache mit **CACHE_VERSION = 0.7.3**
- `importer.js` – sicherer Import mit Backup & Rollback

## Verwendung
1. **Dateien ersetzen/kopieren** in dein Projekt (gleiches Verzeichnis wie bisherige `app-inline.js` und `sw.js`).
2. **Deployen** (GitHub Pages / Hosting). 
3. Seite laden: Rechts unten erscheint `Vokabeltrainer v0.7.3`. Bei neuem SW-Cache gibt es einen Toast: „App aktualisiert (Cache v0.7.3)“.

## Release-Checkliste
- Erhöhe in **`app-inline.js`**: `APP_VERSION = 'x.y.z'`
- Erhöhe in **`sw.js`**: `CACHE_VERSION = 'x.y.z'`
- Veröffentliche und lade die Seite neu.

## GitHub Pages / Unterpfad
Der Service Worker ermittelt den **Basis-Pfad** automatisch (über `self.registration.scope`). Precache-URLs werden relativ zum Scope erzeugt. Bei Deployment unter einem Repo-Pfad (`/Vokabeltrainer-6te-Klasse-Realschule-Bayern/`) ist kein manueller Eingriff nötig.

## Troubleshooting
- **Versionsbadge fehlt?** Stelle sicher, dass `app-inline.js` geladen wird. Der Patch erzeugt Badge/Toast dynamisch, ohne Änderungen an `index.html`.
- **Units wieder leer?** Beim Start repariert die App die Units aus bestehenden Karten-Tags. Sind keine Karten vorhanden, werden neutrale **Defaults** gesetzt.
\
