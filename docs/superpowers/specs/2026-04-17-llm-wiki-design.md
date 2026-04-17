# LLM Wiki — Design Spec

**Date:** 2026-04-17  
**Status:** Approved  

## Overview

A persistent, LLM-maintained personal knowledge base living in the existing Obsidian vault at `Brain/`. Focused on software development work, starting with the `ev-vergleich` project and designed to expand to additional projects. Sources can be in German or English. The LLM does all writing and maintenance; the user curates sources and asks questions.

## Directory Structure

```
Brain/
├── CLAUDE.md              # Wiki schema & LLM instructions (this file governs all wiki behavior)
├── index.md               # Master page index — LLM updates on every ingest
├── log.md                 # Append-only operation history
├── raw/                   # Immutable source documents — user owns, LLM reads only
│   └── assets/            # Downloaded images referenced in sources
└── wiki/                  # All LLM-generated pages — LLM owns entirely
    ├── overview.md        # High-level synthesis of the entire wiki
    ├── projects/          # One page per project (e.g. ev-vergleich.md)
    ├── decisions/         # Architecture & technical decisions (ADR-style)
    ├── concepts/          # Technical concepts, patterns, recurring themes
    ├── entities/          # People, tools, libraries, services
    └── sources/           # One summary page per raw source
```

**Ownership rules:**
- `raw/` — user-owned, LLM never modifies
- `wiki/`, `index.md`, `log.md` — LLM-owned, LLM writes and maintains
- `CLAUDE.md` — co-owned, evolves through conversation

## Core Operations

### Ingest
**Trigger:** User says `"ingest: <filename or description>"` or drops a file in `raw/`.

**LLM steps (in order):**
1. Read the source file
2. Briefly discuss key takeaways with user (2–4 bullet points)
3. Write `wiki/sources/<slug>.md` summary page
4. Update all touched `wiki/projects/`, `wiki/decisions/`, `wiki/concepts/`, `wiki/entities/` pages — create pages that don't exist yet
5. Update `wiki/overview.md` if the source changes the big picture
6. Update `index.md` with any new or changed pages
7. Append entry to `log.md`: `## [YYYY-MM-DD] ingest | <title>`

A single ingest typically touches 5–15 wiki pages.

### Query
**Trigger:** User asks a question naturally, or uses `"frage: <question>"`.

**LLM steps:**
1. Read `index.md` to identify relevant pages
2. Read those pages
3. Synthesize answer with explicit wiki citations (`[[page-name]]`)
4. If the answer is substantial and reusable, file it as a new wiki page and update `index.md`

### Lint
**Trigger:** User says `"lint"`.

**LLM checks:**
- Contradictions between pages
- Stale claims superseded by newer sources
- Orphan pages (no inbound links)
- Concepts mentioned but lacking their own page
- Missing cross-references
- Data gaps worth filling

**Output:** Short punch list in chat. No automatic changes — user decides what to act on.

## Page Conventions

### Frontmatter (all wiki pages)
```yaml
---
type: source | decision | concept | entity | project | overview
tags: []
last_updated: YYYY-MM-DD
source_count: N        # only on entity/concept/project pages
---
```

### Language rules
- Write each page in the dominant language of its source(s)
- Add a one-line summary in the other language at the top of the page under the frontmatter
- This enables cross-language discoverability in Obsidian

### Page types

**Source summary** (`wiki/sources/<slug>.md`)
- Title, date, original filename
- 3–5 bullet summary
- Key decisions, concepts, or entities mentioned → links to their pages
- Raw file link

**Decision** (`wiki/decisions/<slug>.md`)  
- Context, decision made, alternatives considered, consequences
- ADR-style (Architecture Decision Record)

**Concept** (`wiki/concepts/<slug>.md`)
- Definition, how it's used in this project, related concepts

**Entity** (`wiki/entities/<slug>.md`)
- What it is, role in the project, relevant links

**Project** (`wiki/projects/<slug>.md`)
- Status, goals, key decisions, open questions, source count

## Log Format

Each entry starts with a consistent prefix for grep-parseability:

```
## [YYYY-MM-DD] ingest | Title
## [YYYY-MM-DD] query | Question asked
## [YYYY-MM-DD] lint | N issues found
```

Parse last 5 entries: `grep "^## \[" log.md | tail -5`

## CLAUDE.md Content

The `Brain/CLAUDE.md` will contain:
1. Identity statement and ownership rules
2. Directory map
3. All three operation workflows (ingest, query, lint) as step-by-step checklists
4. Page type formats and frontmatter schema
5. Language rules
6. Log format
7. Expansion note: when adding a second project, prefix pages with `projects/<name>/` namespace

## Expansion Path

When a second project is added:
- Add `wiki/projects/<new-project>.md`
- No structural changes needed — the flat `wiki/` layout accommodates multiple projects naturally
- If the wiki grows beyond ~200 pages, add a search tool (e.g. `qmd`) as a CLI the LLM can call

## Success Criteria

- A new source can be ingested in one conversation turn
- Any question about past decisions or project context can be answered with wiki citations
- After 10+ ingests, the wiki is coherent, cross-linked, and browsable in Obsidian's graph view
- The LLM behaves consistently across sessions without needing re-explanation of conventions
