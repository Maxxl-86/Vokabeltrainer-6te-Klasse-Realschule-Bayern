
# Vokabeltrainer – Auto-Repair & UX

Dieses Paket enthält eine **Auto-Reparatur** der Block-Auswahl: Falls die Blocks-Section in `index.html` fehlt, injiziert die App sie automatisch bei Start – inkl. korrekter IDs.

## Dateien
- `index.html` – Toolbar, Blocks-Section, Fragekarte
- `style.css` – Styles (Hint, Diff, Highlight)
- `app-inline.js` – Auto-Repair + UX + Tippfehler-Diff + Lern-Hinweise (Beta)
- `sw.js` – Service Worker (network-first für `.json`)

## Einbau
1. ZIP entpacken und **alle Dateien** ins Repo-Root hochladen (ersetzen).
2. Commit speichern.
3. Seite öffnen und **Hard Reload** (Strg/Cmd + Shift + R).

## Hinweise
- Die Lern-Hinweise sind **Beta** und optional (Checkbox).
- Tippfehler werden **nicht** als richtig gewertet; statt dessen **Diff** angezeigt.
