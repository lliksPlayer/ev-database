# Wiki-Agent — Schema & Anweisungen

Du bist der Wiki-Agent für diese Wissensdatenbank. Du pflegst den gesamten Inhalt in `wiki/`, `index.md` und `log.md`. Du liest `raw/`, schreibst aber **nie** darin.

---

## Eigentumsregeln

| Pfad | Eigentümer | Regel |
|------|-----------|-------|
| `raw/` | Nutzer | LLM liest nur, nie schreiben |
| `wiki/` | LLM | LLM erstellt und pflegt alle Seiten |
| `index.md` | LLM | Nach jedem Ingest aktualisieren |
| `log.md` | LLM | Nur anhängen, nie löschen |
| `CLAUDE.md` | Gemeinsam | Entwickelt sich durch Gespräche weiter |

---

## Verzeichnisstruktur

```
Brain/
├── CLAUDE.md              # Diese Datei
├── index.md               # Master-Seitenindex
├── log.md                 # Append-only Verlauf
├── raw/                   # Unveränderliche Quellen (Nutzer-Eigentum)
│   └── assets/            # Heruntergeladene Bilder
└── wiki/                  # Alle LLM-generierten Seiten
    ├── overview.md        # Gesamtsynthese
    ├── projects/          # Eine Seite pro Projekt
    ├── decisions/         # Architekturentscheidungen (ADR-Stil)
    ├── concepts/          # Technische Konzepte und Muster
    ├── entities/          # Personen, Tools, Libraries, Services
    └── sources/           # Eine Zusammenfassung pro Quelle
```

---

## Operation: Ingest

**Auslöser:** Nutzer schreibt `"ingest: <dateiname oder beschreibung>"` oder legt eine Datei in `raw/` ab.

**Schritte (in dieser Reihenfolge):**

1. Quelldatei lesen
2. 2–4 wichtige Erkenntnisse kurz mit dem Nutzer besprechen
3. `wiki/sources/<slug>.md` Zusammenfassungsseite schreiben
4. Alle berührten Seiten in `wiki/projects/`, `wiki/decisions/`, `wiki/concepts/`, `wiki/entities/` aktualisieren — fehlende Seiten neu anlegen
5. `wiki/overview.md` aktualisieren, wenn die Quelle das Gesamtbild verändert
6. `index.md` mit neuen oder geänderten Seiten aktualisieren
7. Eintrag an `log.md` anhängen: `## [YYYY-MM-DD] ingest | <titel>`

Ein einzelner Ingest berührt typischerweise 5–15 Wiki-Seiten.

---

## Operation: Query

**Auslöser:** Nutzer stellt eine Frage natürlich, oder schreibt `"frage: <frage>"`.

**Schritte:**

1. `index.md` lesen, um relevante Seiten zu finden
2. Diese Seiten lesen
3. Antwort mit expliziten Wiki-Zitaten (`[[seitenname]]`) formulieren
4. Wenn die Antwort substanziell und wiederverwendbar ist → als neue Wiki-Seite ablegen und `index.md` aktualisieren

---

## Operation: Lint

**Auslöser:** Nutzer schreibt `"lint"`.

**Prüfungen:**
- Widersprüche zwischen Seiten
- Veraltete Aussagen, die neuere Quellen überholt haben
- Waisenseiten (keine eingehenden Links)
- Konzepte erwähnt, aber ohne eigene Seite
- Fehlende Querverweise
- Datenlücken, die mit einer Websuche gefüllt werden könnten

**Ausgabe:** Kurze Aufgabenliste im Chat. Keine automatischen Änderungen — der Nutzer entscheidet, was zu tun ist.

---

## Seitenformate

### Frontmatter (alle Wiki-Seiten)

```yaml
---
type: source | decision | concept | entity | project | overview
tags: []
last_updated: YYYY-MM-DD
source_count: N        # nur bei entity/concept/project-Seiten
---
```

### Sprachregeln

- Jede Seite in der dominanten Sprache ihrer Quelle(n) schreiben
- Eine einzeilige Zusammenfassung in der jeweils anderen Sprache direkt unter dem Frontmatter hinzufügen
- Dies ermöglicht sprachübergreifende Auffindbarkeit in Obsidian

### Quellenübersicht (`wiki/sources/<slug>.md`)

```markdown
---
type: source
tags: []
last_updated: YYYY-MM-DD
---

*EN: One-line English summary*

# Titel der Quelle

**Datum:** YYYY-MM-DD  
**Originaldatei:** `raw/<dateiname>`

## Zusammenfassung

- Punkt 1
- Punkt 2
- Punkt 3

## Verweise

- [[wiki/concepts/<slug>]] — ...
- [[wiki/decisions/<slug>]] — ...
```

### Entscheidung (`wiki/decisions/<slug>.md`)

```markdown
---
type: decision
tags: []
last_updated: YYYY-MM-DD
---

*EN: One-line English summary*

# Entscheidungstitel

**Datum:** YYYY-MM-DD  
**Status:** entschieden | überholt | offen

## Kontext

Warum war diese Entscheidung notwendig?

## Entscheidung

Was wurde entschieden?

## Alternativen

- Alternative A — warum verworfen
- Alternative B — warum verworfen

## Konsequenzen

Was ändert sich dadurch?
```

### Konzept (`wiki/concepts/<slug>.md`)

```markdown
---
type: concept
tags: []
last_updated: YYYY-MM-DD
source_count: N
---

*EN: One-line English summary*

# Konzeptname

## Definition

Was ist dieses Konzept?

## Verwendung im Projekt

Wie wird es hier eingesetzt?

## Verwandte Konzepte

- [[wiki/concepts/<anderes-konzept>]]
```

### Entität (`wiki/entities/<slug>.md`)

```markdown
---
type: entity
tags: []
last_updated: YYYY-MM-DD
source_count: N
---

*EN: One-line English summary*

# Entitätsname

## Was ist das?

Kurze Beschreibung.

## Rolle im Projekt

Wie wird es verwendet?

## Relevante Links

- [[wiki/sources/<slug>]]
```

### Projekt (`wiki/projects/<slug>.md`)

```markdown
---
type: project
tags: []
last_updated: YYYY-MM-DD
source_count: N
---

*EN: One-line English summary*

# Projektname

**Status:** aktiv | pausiert | abgeschlossen

## Ziele

Was soll dieses Projekt erreichen?

## Wichtige Entscheidungen

- [[wiki/decisions/<slug>]]

## Offene Fragen

- Frage 1

## Quellen

N Quellen indexiert.
```

---

## Log-Format

```
## [YYYY-MM-DD] ingest | Titel
## [YYYY-MM-DD] query | Gestellte Frage
## [YYYY-MM-DD] lint | N Probleme gefunden
```

Letzte 5 Einträge parsen: `grep "^## \[" log.md | tail -5`

---

## Erweiterungspfad

Wenn ein zweites Projekt hinzugefügt wird:
- Neue Seite `wiki/projects/<neues-projekt>.md` anlegen
- Keine Strukturänderungen nötig — das flache `wiki/`-Layout unterstützt mehrere Projekte von Natur aus
- Bei mehr als ~200 Seiten: Such-Tool (z.B. `qmd`) als CLI einbinden
