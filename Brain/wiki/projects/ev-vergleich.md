---
type: project
tags: [ev, firebase, react]
last_updated: 2026-04-19
source_count: 1
---

*EN: EV comparison tool — a web app for comparing electric vehicles, built with React and Firebase.*

# ev-vergleich

**Status:** aktiv

## Ziele

Ein Webvergleichstool für Elektrofahrzeuge, das Nutzern ermöglicht, EV-Modelle anhand von Reichweite, Preis, Ladezeit und TCO (Total Cost of Ownership) zu vergleichen.

## Technologie-Stack

- React (Frontend)
- Firebase / Firestore (Datenbank, Hosting)
- Vercel (Deployment-Alternative)

## Wichtige Entscheidungen

- [[wiki/decisions/firebase-als-datenbank]] — Firebase Firestore als primäre Datenbank
- [[wiki/decisions/ev-scraper-markdown]] — Firecrawl Markdown-Parsing statt LLM-Extraktion (5× günstiger)

## Wirtschaftlichkeitsrechner (TCO-Vergleich)

- Hauptseite: `ev-database/src/pages/Calculator.jsx` + `Calculator.css`
- Zwei Fahrzeug-Slots (Fahrzeug A / Fahrzeug B) via `VehicleSlot`-Komponente
- Vergleichsmodus wählbar: EV vs. ICE oder EV vs. EV
- Expert-Mode-Toggle steuert sichtbare Parameter in beiden Slots
- URL-Parameter `?ev1=<id>&ev2=<id>` für Direktlink aus CarCard
- Ergebnisse werden via `ResultsPanel` angezeigt, sobald beide Slots befüllt sind
- Komponente: `ev-database/src/components/calculator/ResultsPanel.jsx`
- Drei Tabs: Monatliche Kosten (Bar-Chart), Gesamtverlauf (Line-Chart + Tabelle), Break-even (Jahr + Chart)
- Berechnung via `utils/tcoCalculation.js`: `calculateTCO`, `buildYearlySeries`, `findBreakeven`
- Diagramme via Recharts (`TotalCostChart`, `MonthlyCostChart`)
- i18n-Keys unter `calc.results.*`
- EV-Ladeparameter: separate AC/DC-Preise, AC/DC-Split-Slider (5%-Schritte), Ladeverluste AC/DC (Experten-Modus), THG-Quote (€/Jahr als Einnahmen)

## Fahrzeugvergleich (CarCard-Komponente)

- Komponente: `ev-database/src/components/cars/CarCard.jsx`
- Zeigt strukturierte Fahrzeugdaten (Marke, Modell, konfigurierbare Felder)
- Button "In Rechner laden" ermöglicht schnelle Navigation zur TCO-Berechnung
- Button-Logik: localStorage-basiert, erste Auswahl → ev1 Parameter, zweite Auswahl → ev1+ev2 Parameter
- Styling: Blauer Button (#2563eb) mit Hover-Effekt (#1d4ed8), volle Breite der Karte

## Datenimport

- Scraper: `ev-database/scripts/scrape-ev-database.js`
- Quelle: ev-database.org (Cloudflare-geschützt, via Firecrawl)
- Methode: `formats: ['markdown']` + Regex-Parser (~1 Credit/Auto)
- Felder: 34 Felder pro Fahrzeug (Basis, Reichweite, Akku, Laden, Performance, Maße, Gewicht, Kofferraum, Diverses)
- Fortsetzen ab Position N: `SCRAPER_START=N node scripts/scrape-ev-database.js`

## Offene Fragen

*(Werden beim nächsten Ingest gesammelt.)*

## Quellen

1 Quelle indexiert.
