---
type: decision
tags: [ev-vergleich, architektur, javascript, module]
last_updated: 2026-04-20
---

*EN: Refactored ev-vergleich/js/ui.js into focused modules to reduce per-task token usage and fix pre-existing import bugs.*

# ev-vergleich JS-Modul-Aufteilung

**Datum:** 2026-04-20  
**Status:** entschieden

## Kontext

`ui.js` hatte 377 Zeilen mit 4 verschiedenen Verantwortlichkeiten (Admin-Auth, Car-CRUD, Toast, Core-UI). Claude las die gesamte Datei für jede Änderung — selbst bei einfachen Admin-Fixes. Außerdem wurden 3 Bugs entdeckt: `render.js` rief `deleteCar`, `openEditModal`, `importCarToTCO` ohne Import auf.

## Entscheidung

`ui.js` wurde in fokussierte Module aufgeteilt:

| Datei | Inhalt | Zeilen |
|-------|--------|--------|
| `toast.js` | `toast()` — keine Abhängigkeiten | 12 |
| `admin.js` | Admin-Login + Admin-UI | 75 |
| `cars.js` | Car-CRUD + CSV-Import | 105 |
| `ui.js` | Core-UI: refresh, Modal, Filter, View, Sort, Incomplete-Widget | 155 |

**Bugs gefixt:**
- `render.js`: `deleteCar`, `openEditModal` nun aus `./ui.js` importiert; `importCarToTCO` aus `./tco.js`
- `tco.js` + `duplicates.js`: `toast` nun aus `./toast.js` (bricht zirkuläre Abhängigkeit `tco.js ↔ ui.js`)
- `ui.js` → `cars.js`: `parseIceCSV` nun explizit als `window.parseIceCSV()` (konsistent mit ice-Seiten-Pattern)

## Alternativen

- **Alles in ui.js lassen** — einfacher, aber 377 Zeilen für jede kleine Änderung
- **Weitere Splits** (z.B. `modal.js`, `incomplete.js`) — unnötig für aktuelle Dateigröße

## Konsequenzen

- Neue Funktionen für Admin → `admin.js`
- Neue Funktionen für Car-CRUD → `cars.js`
- `toast` immer aus `./toast.js` importieren, nie aus `./ui.js` direkt
- `ev-vergleich/js/` hat jetzt 28 Dateien statt 25
