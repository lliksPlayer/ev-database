---
type: decision
tags: [tooling, claude-code, token-optimierung]
last_updated: 2026-04-20
---

*EN: Project structure cleanup to reduce Claude Code token usage — .claudeignore, worktree removal, old plan deletion.*

# Projekt-Cleanup: Token-Optimierung

**Datum:** 2026-04-20  
**Status:** entschieden

## Kontext

Claude benötigte ~30k Token für einfache Änderungen. Ursache: Das Projekt hatte mehrere große Rauschen-Quellen akkumuliert, die bei jeder Kontext-Analyse mitgelesen wurden.

Diagnose der Hauptursachen (nach Schwere):
1. `docs/superpowers/plans/` + `specs/` — 10.041 Zeilen abgeschlossene Implementierungspläne
2. `.worktrees/` — vollständige Projektkopien (ev-enrichment, wirtschaftlichkeitsrechner, ice-database)
3. `ev-vergleich/.claude/skills/` — veraltete lokale Skills (ersetzt durch globales Superpowers-Plugin)
4. `Brain/wiki/`, `Brain/raw/` — wird beim Traversieren mitgelesen, aber selten benötigt

## Entscheidung

**Zweistufige Strategie:**

### Stufe 1: `.claudeignore` (nicht-destruktiv)
Datei angelegt, die folgende Verzeichnisse aus Claude's Kontext ausblendet:
- `.worktrees/`, `docs/superpowers/`, `Brain/wiki/`, `Brain/raw/`
- `node_modules/`, `dist/`, `.vite/`
- Große Datendateien (`.json`, `.csv`)

### Stufe 2: Physisches Löschen
- `.worktrees/` komplett entfernt (`git worktree remove --force` + Verzeichnis)
- `docs/superpowers/` komplett gelöscht (alte Pläne, kein Verlust — Inhalte in Brain/log.md zusammengefasst)
- Build-Artefakte: `dist/`, `.vite/`, `.firebase/hosting..cache`
- Temp-Daten: `ev_cars_scraped.json`, `ev_cars_export.csv`
- Alte lokale Skills: `ev-vergleich/.claude/skills/`

### Stufe 3: `.vscode/settings.json`
`files.exclude` + `search.exclude` + `files.watcherExclude` konfiguriert, damit VS Code Explorer sauber bleibt und der File-Watcher nicht auf `node_modules` etc. reagiert.

## Alternativen

- **Nur `.claudeignore`** — Dateien bleiben, werden aber ignoriert. Weniger effektiv da VS Code Explorer weiterhin unübersichtlich.
- **Alles behalten** — Kein Mehrwert, da die gelöschten Daten entweder aus git wiederherstellbar (Pläne) oder reproduzierbar (Build-Artefakte) sind.

## Konsequenzen

- Neue `docs/superpowers/`-Pläne werden nach Abschluss einer Feature-Entwicklung gelöscht
- Worktrees werden nach PR-Merge sofort entfernt (`git worktree remove`)
- Die Website-Funktionalität ist unverändert; beide Deployments (Firebase + Vercel) aktiv
- `ev-vergleich/` (letzter Commit: 2026-04-13) dauerhaft in `.claudeignore` + `.vscode/settings.json` ausgeblendet — wird von Claude nicht mehr gelesen
