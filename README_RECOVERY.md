\
# Recovery-Pack v0.7.5

**Ziel:** App wieder lauffähig machen, auch wenn keine Daten vorhanden sind oder der alte Service Worker stört.

## Dateien
- `index.html` – einfache Oberfläche mit Units-Liste + Buttons
- `app.js` – Version-Badge, Auto-Repair, Demo-Daten, Reset, Diagnose
- `style.css` – schlichtes Styling
- `sw.js` – GitHub-Pages-kompatibler Service Worker (Version `0.7.5-recovery`)
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png`

## Nutzung
1. **Alle Dateien** ins Projekt (Root des Web-Verzeichnisses) kopieren / vorhandene testweise ersetzen.
2. **Deployen**.
3. Seite aufrufen → rechts unten **v0.7.5-recovery** sollte angezeigt werden.
4. Klick **„Demo‑Daten laden“** → erzeugt Test‑Units & Karten.
5. **„Alles zurücksetzen“** löscht SW‑Caches, unregistert SW, leert Storage und lädt neu.
6. **„Diagnose“** gibt aktuellen Zustand in die Konsole aus.

## Hinweis
Das Paket arbeitet ausschließlich mit `localStorage` (Schlüssel: `vt_units`, `vt_cards`). Später können wir es auf IndexedDB umstellen.
