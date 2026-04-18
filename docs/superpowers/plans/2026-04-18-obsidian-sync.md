# Obsidian-Synchronisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude schreibt nach jeder signifikanten Aufgabe autonom in das Obsidian-Wiki (`Brain/`), ein Stop-Hook stellt sicher dass am Session-Ende nichts vergessen wird.

**Architecture:** Zwei unabhängige Komponenten: (1) CLAUDE.md-Regel die Claude instruiert nach jeder Aufgabe in Obsidian zu schreiben, (2) Stop-Hook in `.claude/settings.json` der prüft ob `log.md` heute aktualisiert wurde und bei fehlendem Eintrag die Session blockiert bis Claude nachschreibt.

**Tech Stack:** Claude Code Hooks (settings.json), Markdown (CLAUDE.md), Shell (grep/date), Obsidian-Wiki (Brain/)

---

### Task 1: CLAUDE.md — Obsidian-Schreibregel hinzufügen

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Obsidian-Abschnitt in CLAUDE.md einfügen**

Datei `CLAUDE.md` öffnen und nach dem bestehenden Inhalt folgenden Abschnitt anfügen:

```markdown
## Obsidian-Wiki (Brain/)

Nach jeder abgeschlossenen **signifikanten** Aufgabe (Bugfix, neues Feature, Architekturentscheidung, Konfigurationsänderung) MUSS Claude autonom in `Brain/` schreiben:

1. **Immer:** Eintrag an `Brain/log.md` anhängen:
   ```
   ## [YYYY-MM-DD] task | Kurztitel der Aufgabe
   ```
2. **Bei Architektur-/Library-Entscheidungen:** `Brain/wiki/decisions/<slug>.md` anlegen oder aktualisieren
3. **Bei Feature-/Projektänderungen:** `Brain/wiki/projects/ev-vergleich.md` aktualisieren
4. **Bei neuen Mustern/Konzepten:** `Brain/wiki/concepts/<slug>.md` anlegen oder aktualisieren
5. **Bei neuen Wiki-Seiten:** `Brain/index.md` aktualisieren

Das Seitenformat folgt exakt dem Schema aus `Brain/CLAUDE.md` (Frontmatter, Sprachregeln, Seitenformate).

Kleine Korrekturen (Typos, Formatierung, reine Refactors ohne Entscheidung) werden **nicht** geloggt.
```

- [ ] **Step 2: Prüfen dass CLAUDE.md valides Markdown ist**

```bash
cat "CLAUDE.md"
```

Erwartete Ausgabe: Datei enthält alle drei Abschnitte (Superpowers, Design-Änderungen, Obsidian-Wiki) ohne Syntaxfehler.

- [ ] **Step 3: Committen**

```bash
git add CLAUDE.md
git commit -m "feat: CLAUDE.md — Obsidian-Schreibregel nach jeder Aufgabe"
```

---

### Task 2: Stop-Hook in settings.json eintragen

**Files:**
- Modify: `.claude/settings.json`

- [ ] **Step 1: Hook-Befehl isoliert testen**

Simulieren dass `log.md` heute KEINEN Eintrag hat:

```bash
grep -q "^## \[$(date +%Y-%m-%d)\]" "Brain/log.md" \
  && echo '{"continue": true}' \
  || echo '{"continue": false, "stopReason": "Obsidian noch nicht aktualisiert — bitte Brain/log.md und relevante Wiki-Seiten schreiben, dann fertig."}'
```

Erwartete Ausgabe (wenn kein heutiger Eintrag): `{"continue": false, "stopReason": "Obsidian noch nicht aktualisiert — bitte Brain/log.md und relevante Wiki-Seiten schreiben, dann fertig."}`

Dann testen dass der Hook auch bei vorhandenem Eintrag funktioniert:

```bash
echo "## [$(date +%Y-%m-%d)] task | Test" >> Brain/log.md \
  && grep -q "^## \[$(date +%Y-%m-%d)\]" "Brain/log.md" \
  && echo '{"continue": true}' \
  || echo '{"continue": false, "stopReason": "..."}'
```

Erwartete Ausgabe: `{"continue": true}`

Test-Eintrag wieder entfernen:

```bash
# Letzten Eintrag aus log.md entfernen (nur wenn Test-Eintrag am Ende)
head -n -1 "Brain/log.md" > /tmp/log_backup.md && mv /tmp/log_backup.md "Brain/log.md"
```

- [ ] **Step 2: settings.json mit Hook aktualisieren**

`.claude/settings.json` auf folgenden Inhalt setzen (bestehende Plugins beibehalten):

```json
{
  "enabledPlugins": {
    "codex@openai-codex": true,
    "superpowers@claude-plugins-official": true
  },
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

- [ ] **Step 3: JSON-Syntax validieren**

```bash
jq '.' ".claude/settings.json"
```

Erwartete Ausgabe: valides JSON ohne Fehler, Hook unter `hooks.Stop` sichtbar.

- [ ] **Step 4: Hook-Eintrag im richtigen Pfad prüfen**

```bash
jq '.hooks.Stop[0].hooks[0].command' ".claude/settings.json"
```

Erwartete Ausgabe: Der grep-Befehl als String, Exit-Code 0.

- [ ] **Step 5: Committen**

```bash
git add .claude/settings.json
git commit -m "feat: Stop-Hook — blockiert Session-Ende wenn Obsidian nicht aktualisiert"
```

---

### Task 3: Erster manueller Smoke-Test

**Files:** keine Änderungen

- [ ] **Step 1: Prüfen dass log.md heute noch keinen Eintrag hat**

```bash
grep "^## \[$(date +%Y-%m-%d)\]" "Brain/log.md" || echo "Kein heutiger Eintrag — Hook würde blockieren"
```

- [ ] **Step 2: Test-Eintrag in log.md schreiben**

```bash
echo "" >> "Brain/log.md"
echo "## [$(date +%Y-%m-%d)] task | Smoke-Test Obsidian-Sync" >> "Brain/log.md"
```

- [ ] **Step 3: Hook-Befehl manuell ausführen und Ergebnis prüfen**

```bash
grep -q "^## \[$(date +%Y-%m-%d)\]" "Brain/log.md" \
  && echo '{"continue": true}' \
  || echo '{"continue": false, "stopReason": "Obsidian noch nicht aktualisiert..."}'
```

Erwartete Ausgabe: `{"continue": true}` — Hook würde Session passieren lassen.

- [ ] **Step 4: Test-Eintrag committen (bleibt als erster echter Log-Eintrag)**

```bash
git add "Brain/log.md"
git commit -m "feat: erster Obsidian-Log-Eintrag (Smoke-Test Sync-System)"
```
