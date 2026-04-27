# Projektanweisungen

## Aktiver Projektstand
- Aktive Web-App fuer neue Arbeit: `ev-database/`
- `ev-vergleich/` ist Legacy/Referenz und wird nur angepasst, wenn ausdruecklich angefragt
- Vor neuen Features oder Bugfixes zuerst in `ev-database/` arbeiten
- Dokumentationsquelle fuer die aktive App: `Brain/wiki/projects/ev-database.md`

## Datenmodell
- In der React-App gilt das kanonische Fahrzeugschema aus `ev-database/src/entities/vehicle/vehicleFields.js`
- Normalisierung und Legacy-Alias-Mapping liegen in `ev-database/src/entities/vehicle/vehicleSchema.js`
- Alte Feldnamen werden dort auf das aktuelle Schema abgebildet
- Neue UI-, Admin- und Rechner-Logik soll nur noch die kanonischen Felder verwenden
- Wichtige Beispiele: `basis_preis`, `wltp_reichweite`, `batterie_netto`, `laden_10_80_min`, `max_ladeleistung`, `verbrauch_l_100km`

## Skills
- Vor jeder Antwort/Aktion passenden Superpowers-Skill prüfen und nutzen
- Vor UI/Layout/Style-Änderungen: `frontend-design:frontend-design` aufrufen

## Brain-Updates (nach jeder signifikanten Aufgabe)
Log-Eintrag an `Brain/log.md` anhängen: `## [YYYY-MM-DD] task | Titel`

Wiki-Format aus `Brain/CLAUDE.md` — Seiten unter `Brain/wiki/`:
- Architektur-/Library-Entscheid → `decisions/<slug>.md` + `index.md`
- Feature-/Projektänderung der aktiven App → `projects/ev-database.md`
- Legacy-Hinweise zur alten Vanilla-App → `projects/ev-vergleich.md`
- Neues Muster → `concepts/<slug>.md` + `index.md`

*Typos, Formatierung, reine Refactors ohne Entscheidung → nicht loggen.*
