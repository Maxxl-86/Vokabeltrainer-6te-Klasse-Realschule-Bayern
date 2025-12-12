
# Fix-Build 0.8.1 – Blöcke sichtbar & Lernen sofort möglich

**Was ist neu?**
- Die **Blöcke (Unit 1–6) sind statisch in `index.html`** vorhanden – sie können nicht mehr „verschwinden“.
- `app-inline.js` lädt Vokabeln aus `vocab/vocab.json` und nutzt **lokalen Fallback (VOCAB_SEED)**, falls die zentrale Datei fehlt.
- **Import** (`import.html`) kann dein altes Textformat oder echtes JSON in den lokalen Speicher übernehmen.
- Service Worker mit Cache-Version `v4` für zuverlässige Updates.

## Nutzung
1. ZIP ins Repo (Root) kopieren.
2. Seite öffnen → **Hard Reload**.
3. Optional: `import.html` öffnen und deine Alt-Daten importieren.

## Hinweise
- Lokale Daten (LS_VOCAB) werden genutzt, wenn vorhanden. Zentraler Stand (`vocab/vocab.json`) wird automatisch synchronisiert, wenn sich die Version ändert.
