---
type: decision
tags: [tooling, automation, obsidian]
last_updated: 2026-04-18
---

*EN: Automatic Obsidian sync via CLAUDE.md rule and Stop hook*

# Obsidian-Synchronisation per Stop-Hook

**Datum:** 2026-04-18  
**Status:** entschieden

## Kontext

Claude-Sitzungen produzierten Wissen (Entscheidungen, Features, Konfigurationsänderungen) das nicht systematisch ins Obsidian-Wiki (Brain/) floss. Informationen gingen verloren.

## Entscheidung

Zwei-Komponenten-System:
1. CLAUDE.md-Regel: Claude schreibt nach jeder signifikanten Aufgabe autonom in Brain/ (log.md + Wiki-Seiten)
2. Stop-Hook in .claude/settings.json: prüft beim Session-Ende ob log.md heute aktualisiert wurde; blockiert mit `continue: false` wenn nicht

## Alternativen

- PostToolUse-Hook (Write/Edit): zu granular, erzeugt zu viel Rauschen in log.md
- Nur CLAUDE.md ohne Hook: Claude könnte es in langen Sessions vergessen
- Manuelle Ingests: erfordert User-Aktion, nicht zuverlässig

## Konsequenzen

- Jede signifikante Aufgabe wird in Brain/log.md dokumentiert
- Architekturentscheidungen landen in wiki/decisions/, Features in wiki/projects/
- Session-Ende ist nur möglich wenn Obsidian aktualisiert wurde
