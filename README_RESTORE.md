
# Wiederhergestellte Build (0.7.6)
- Enthält ein lauffähiges `index.html` mit allen benötigten IDs.
- Registriert den Service Worker (`sw.js`).
- Liefert `vocab/vocab.json` als zentrale Datenquelle.
- Platzhalter-Icons und `manifest.webmanifest` sind enthalten, damit die PWA-Installation/Precache nicht fehlschlägt.

## Deployment
1. ZIP-Inhalt ins Repo-Root kopieren (GitHub Pages).
2. Seite öffnen → **Hard Reload** (Strg+F5 / Cmd+Shift+R).
3. Im Fehlerfall: DevTools → Application → Service Workers → **Unregister** → Seite neu laden.
