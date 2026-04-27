---
type: project
tags: [ev, firebase, legacy, vanilla-js]
last_updated: 2026-04-24
source_count: 1
---

*EN: Legacy vanilla-JS EV comparison app retained as reference after `ev-database` became the active application.*

# ev-vergleich

**Status:** pausiert

## Rolle

Historischer Altstand der frueheren Vanilla-JS-Website. Dieser Ordner bleibt als Referenz erhalten, ist aber nicht mehr die aktive Entwicklungsbasis.

## Arbeitsregel

- Keine neue Standard-Entwicklung in `ev-vergleich/`
- Nur noch auf ausdrueckliche Anfrage aendern
- Aktive App: [[wiki/projects/ev-database]]

## Ziele

Dokumentiert den frueheren Stand des Vergleichstools und dient nur noch als Referenz fuer Altlogik, Migrationen oder Rueckvergleiche.

## Technologie-Stack

- HTML, CSS, Vanilla JavaScript
- Firebase (historische Konfigurationen)
- Kein aktiver Frontend-Stack mehr fuer neue Arbeit

## Wichtige Entscheidungen

- [[wiki/decisions/firebase-als-datenbank]] — Firebase Firestore als primäre Datenbank
- [[wiki/decisions/ev-scraper-markdown]] — Firecrawl Markdown-Parsing statt LLM-Extraktion (5× günstiger)

## Wirtschaftlichkeitsrechner (TCO-Vergleich)

- Historische TCO-/Vergleichslogik liegt im Legacy-Code
- Die aktive Weiterentwicklung des Rechners findet in [[wiki/projects/ev-database]] statt

## Fahrzeugvergleich (CarCard-Komponente)

- Historische Karten- und Listenlogik bleibt nur noch als Referenz erhalten
- Aktive Kartenlogik ist in [[wiki/projects/ev-database]] dokumentiert

## Datenimport

- Altimporte und historische Datenpflege befinden sich weiterhin im Legacy-Ordner
- Neue Import- und Scraper-Arbeit passiert in [[wiki/projects/ev-database]]

## Offene Fragen

- Soll der Ordner spaeter physisch nach `legacy/ev-vergleich/` verschoben werden?

## Quellen

1 Quelle indexiert.
