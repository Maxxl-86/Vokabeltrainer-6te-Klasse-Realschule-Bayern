\
# Versionierung für GitHub Pages (v0.7.4)
- Badge unten rechts zeigt Version an.
- Service Worker meldet Update und lädt einmalig neu.
- Für Tests: `?debug=1` an URL anhängen -> ausführliche Logs.

## Wichtige Schritte nach Upload
1. Seite aufrufen und **Hard Reload** (Windows: Strg+F5, macOS: Cmd+Shift+R).
2. Falls weiterhin alte Dateien: DevTools → Application → Service Workers → **Unregister** → Seite neu laden.
3. Neue Version? Badge zeigt `v0.7.4`.
