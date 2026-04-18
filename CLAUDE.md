# Projektanweisungen

## Superpowers

Bei **jeder** Anfrage MÜSSEN relevante Superpowers-Skills geprüft und genutzt werden. Vor jeder Antwort oder Aktion ist zu prüfen, ob ein passender Skill existiert — gilt auch für Rückfragen.

## Design-Änderungen

Bei **jeder** Änderung an UI-Komponenten, Layouts, Styles oder Frontend-Interfaces MUSS der Skill `frontend-design:frontend-design` aufgerufen werden, bevor Code geschrieben wird.

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

Kleine Korrektionen (Typos, Formatierung, reine Refactors ohne Entscheidung) werden **nicht** geloggt.
