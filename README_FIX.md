
# Fix‑Build 0.7.7 (Units‑Migration & Diagnose)

Dieses Build repariert die **Unit‑Zuordnung**:
- erkennt Schlüssel wie `u1`, `Unit 1` oder `1` und führt sie auf **`u1..u6`** zusammen,
- baut die **Block‑Checkliste dynamisch** aus den tatsächlich vorhandenen Daten,
- zeigt pro Block die **Wortanzahl**,
- enthält einen **Diagnose‑Button**, der Version und Block‑Counts anzeigt.

## Verwendung
1. ZIP entpacken → Dateien ins Repo‑Root kopieren.
2. Seite öffnen → Hard Reload (Strg+F5 / Cmd+Shift+R).
3. Optional: DevTools → Application → Service Workers → Unregister → Reload.

Wenn deine bisherigen Daten im Browser‑Storage liegen, übernimmt das Skript sie und migriert die Block‑Schlüssel automatisch.
