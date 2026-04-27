---
type: project
tags: [ev, firebase, react, active]
last_updated: 2026-04-24
source_count: 1
---

*EN: Active React/Vite EV comparison app with Firebase, calculator, admin, and normalized vehicle schema.*

# ev-database

**Status:** aktiv

## Ziele

Die aktive Web-App fuer das Vergleichstool. Sie soll die einzige Entwicklungsbasis fuer neue Features, Bugfixes, UI-Arbeit und Datenmodell-Weiterentwicklung sein.

## Rolle im Projekt

- React/Vite-App fuer das Nutzer-Frontend
- Firestore-basierte Fahrzeugdatenbank fuer EV und ICE
- Admin-Oberflaeche fuer Pflege und Import
- TCO-/Wirtschaftlichkeitsrechner fuer EV vs. ICE und EV vs. EV

## Wichtige Pfade

- `ev-database/src/pages/` — Landing, Listen, Rechner, Admin
- `ev-database/src/components/` — UI-Bausteine
- `ev-database/src/hooks/` — Daten- und Auth-Hooks
- `ev-database/src/config/fields.js` — Formularfelder und Default-Kartenfelder
- `ev-database/src/utils/vehicleSchema.js` — kanonisches Fahrzeugschema + Legacy-Aliase
- `ev-database/scripts/` — Import, Export, Scraping

## Aktuelle Architekturhinweise

- Kanonische Felder statt verteilter Einzelnamen
- Legacy-Aliase werden zentral normalisiert, damit alte Datensaetze weiter funktionieren
- `ev-vergleich/` ist nicht mehr Teil des aktiven Arbeitsflusses

## Wichtige Entscheidungen

- [[wiki/decisions/firebase-als-datenbank]] — Firebase Firestore als primäre Datenbank
- [[wiki/decisions/ev-scraper-markdown]] — Firecrawl Markdown-Parsing statt LLM-Extraktion

## Verwandte Seiten

- [[wiki/projects/ev-vergleich]] — alter Legacy-Stand der frueheren Vanilla-JS-App
- [[wiki/concepts/tco]] — zentrale Vergleichsmetrik

## Offene Fragen

- Bundle-Groesse der React-App weiter reduzieren
- Legacy-Dokumentation im Brain Schritt fuer Schritt bereinigen

## Quellen

1 Quelle indexiert.
