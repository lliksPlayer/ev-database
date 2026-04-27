# EV Database

Aktive React/Vite-App fuer das Vergleichstool. Diese App ist die Arbeitsbasis fuer neue Features, Bugfixes und UI-Aenderungen.

## Status

- Aktive App: `ev-database/`
- Legacy-Stand: `../ev-vergleich/`
- Deployment: Vercel
- Datenquelle: Firebase / Firestore

## Entwicklung

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Projektstruktur

- `src/pages/` Seiten wie Landing, Fahrzeuglisten, Rechner und Admin
- `src/components/` wiederverwendbare UI-Bausteine
- `src/hooks/` Firestore- und Auth-Hooks
- `src/entities/vehicle/` kanonisches Fahrzeugschema, Alias-Normalisierung, Card-Felder und Fahrzeug-Helfer
- `src/features/comparison/model/` Rechner- und TCO-Fachlogik
- `src/firebase/` Firebase-Zugriff
- `scripts/` Import-, Export- und Scraper-Skripte

## Datenmodell

Die React-App arbeitet mit einem kanonischen Feldschema. Historische Daten mit aelteren Namen werden in `src/entities/vehicle/vehicleSchema.js` auf die aktuellen Felder abgebildet.

Die fachliche Source of Truth fuer das Schema liegt in:

- `src/entities/vehicle/vehicleFields.js`
- `docs/canonical-vehicle-schema.md`

Wichtige kanonische Felder:

- EV: `basis_preis`, `wltp_reichweite`, `batterie_netto`, `laden_10_80_min`, `max_ladeleistung`
- ICE: `basis_preis`, `verbrauch_l_100km`, `kraftstoff`, `null_hundert`, `top_speed`

Beispiele fuer Legacy-Aliase:

- `preis_de` -> `basis_preis`
- `reichweite_wltp` -> `wltp_reichweite`
- `akku_kapazitaet_kwh` -> `batterie_netto`
- `verbrauch_l100km` -> `verbrauch_l_100km`

## Hinweise

- `serviceAccountKey.json` ist lokal und darf nicht committed werden.
- Wenn Kartenfelder in Firestore noch nicht angelegt sind, nutzt die App eingebaute Default-Felder aus `src/entities/vehicle/fields.js`.
- Detailansicht, Rechner und Admin laufen auf kanonischen Feldern; Legacy-Daten werden beim Laden normalisiert.
