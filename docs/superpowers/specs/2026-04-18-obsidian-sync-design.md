# Design: Automatische Obsidian-Synchronisation

**Datum:** 2026-04-18  
**Status:** genehmigt

---

## Überblick

Claude schreibt nach jeder signifikanten Aufgabe autonom in das Obsidian-Wiki (`Brain/`). Ein Stop-Hook stellt sicher, dass am Session-Ende nichts vergessen wird.

---

## Architektur

```
[Claude beendet Aufgabe]
        ↓
[CLAUDE.md-Regel greift]
        ↓
Claude schreibt autonom:
  • log.md (Append-Eintrag)
  • wiki/decisions/ | wiki/projects/ | wiki/concepts/ (je nach Inhalt)
  • index.md (falls neue Seite angelegt)

[Session endet → Stop-Hook feuert]
        ↓
Hook prüft: Hat log.md heute einen Eintrag?
  • JA → Session endet normal
  • NEIN → continue: false → Claude schreibt nach → Session endet
```

Die beiden Teile sind unabhängig: CLAUDE.md ist der Hauptweg, der Stop-Hook ist das Sicherheitsnetz. Der Hook schreibt selbst nichts.

---

## Komponente 1: CLAUDE.md-Regel

Nach jeder abgeschlossenen **signifikanten** Aufgabe (Bugfix, neues Feature, Architekturentscheidung, Konfigurationsänderung) schreibt Claude autonom:

| Was | Wohin | Bedingung |
|-----|-------|-----------|
| `## [YYYY-MM-DD] task \| Titel` | `Brain/log.md` | Immer |
| Entscheidungsseite | `Brain/wiki/decisions/<slug>.md` | Bei Architektur-/Library-Entscheidungen |
| Projektseite aktualisieren | `Brain/wiki/projects/ev-vergleich.md` | Bei Feature-/Projektänderungen |
| Konzeptseite | `Brain/wiki/concepts/<slug>.md` | Bei neuen Mustern/Konzepten |
| Index aktualisieren | `Brain/index.md` | Wenn neue Seite angelegt |

Kleine Korrekturen (Typos, Formatierung) werden nicht geloggt.

Das Seitenformat folgt exakt dem Schema aus `Brain/CLAUDE.md` (Frontmatter, Sprachregeln, Seitenformate).

---

## Komponente 2: Stop-Hook

Eintrag in `.claude/settings.json` unter `hooks.Stop`:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "grep -q \"^## \\[$(date +%Y-%m-%d)\\]\" \"Brain/log.md\" && echo '{\"continue\": true}' || echo '{\"continue\": false, \"stopReason\": \"Obsidian noch nicht aktualisiert — bitte Brain/log.md und relevante Wiki-Seiten schreiben, dann fertig.\"}'",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**Verhalten:**
- Hook findet heutigen Eintrag in `log.md` → `continue: true` → Session endet normal
- Kein heutiger Eintrag → `continue: false` → Claude schreibt nach, Session endet danach

---

## Was nicht automatisiert wird

- `raw/`-Dateien: weiterhin Nutzer-Eigentum (kein automatisches Schreiben)
- Lint-Operation: weiterhin manuell ausgelöst
- Kleine Korrekturen (Typos, Formatting-Fixes)
