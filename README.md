
# Vokabeltrainer – Auto-Repair & gezielte Lern-Hinweise (Beta)

## Neu
- **Auto-Repair**: Falls die Blocks-Section fehlt, wird sie automatisch injiziert.
- **Lern-Hinweise (Beta)**: Werden jetzt aus **`vocab/hints.json`** geladen.
  - Wenn für ein Wort **kein Eintrag** vorhanden ist, **wird kein generischer Hinweis angezeigt**.
  - Du kannst `hints.json` selbst erweitern.

## Dateien
- index.html, style.css, app-inline.js, sw.js
- **vocab/hints.json** (editierbar)

## Einbau
1. ZIP entpacken, alles ins Repo-Root hochladen. Ordner **`vocab/`** mit `hints.json` übernehmen.
2. Commit speichern.
3. Seite öffnen und **Hard Reload** (Strg/Cmd + Shift + R).

## `hints.json` Format
```json
{
  "media": {
    "collocations": ["social media", "mass media"],
    "examples": ["Social media can spread news very fast."],
    "note": "Usually plural collective: 'The media are ...'"
  }
}
```
```
