# Design: Verbrenner-Datenbank (ICE) in ev-database

**Datum:** 2026-04-18  
**Status:** Approved

## Ziel

Integration einer Verbrenner-Fahrzeugdatenbank in die bestehende `ev-database`-App. Nutzer können öffentlich zwischen E-Fahrzeugen und Verbrennern wechseln. Hinzufügen/Bearbeiten/Löschen bleibt dem Admin vorbehalten.

---

## Datenmodell

**Neue Firestore-Collection:** `ice_cars`

| Feld | Typ | Beschreibung |
|---|---|---|
| `marke` | string | Hersteller |
| `modell` | string | Modellname |
| `ps` | number | Leistung in PS |
| `null_hundert` | number | 0–100 km/h in Sekunden |
| `top_speed` | number | Höchstgeschwindigkeit km/h |
| `basis_preis` | number | Basispreis in € |
| `hoechster_preis` | number | Höchster Preis in € |
| `anhaengelast` | number | Anhängelast in kg |
| `markteinfuehrung` | string | Jahr/Quartal der Markteinführung |
| `hubraum_ccm` | number | Hubraum in ccm |
| `kraftstoff` | string | Benzin / Diesel / Hybrid / LPG |
| `verbrauch_l100km` | number | Verbrauch in l/100km |
| `co2_g_km` | number | CO₂-Ausstoß in g/km |
| `getriebe` | string | Manuell / Automatik |
| `zylinder` | number | Anzahl Zylinder |

---

## Architektur

### Neue Dateien

- `src/config/fields.js` — exportiert `EV_FIELDS` und `ICE_FIELDS` als Arrays
- `src/firebase/ice-cars.js` — analog zu `cars.js`, Collection `ice_cars`
- `src/pages/IceHomePage.jsx` — öffentliche Übersicht für Verbrenner

### Geänderte Dateien

- `src/firebase/cars.js` — unverändert
- `src/hooks/useCars.js` → `useCarsCollection(collectionName)` — generalisiert
- `src/components/admin/CarForm.jsx` — `FIELDS` aus Props statt hardcodiert
- `src/components/admin/CarImport.jsx` — `fields` als Prop
- `src/components/admin/AdminPanel.jsx` — bekommt `fields` + Firebase-Funktionen als Props
- `src/pages/AdminPage.jsx` — Tab-Switcher EV / Verbrenner
- `src/pages/HomePage.jsx` — nutzt `EV_FIELDS` aus `fields.js`
- `src/components/layout/TopNav.jsx` — zwei neue Links: "E-Fahrzeuge" / "Verbrenner"
- `src/App.jsx` — neue Route `/verbrenner` → `IceHomePage`

---

## Routing

| Route | Zugriffsschutz | Komponente |
|---|---|---|
| `/` | öffentlich | `HomePage` (EVs) |
| `/verbrenner` | öffentlich | `IceHomePage` (ICE) |
| `/admin/login` | öffentlich | `LoginPage` |
| `/admin` | `ProtectedRoute` | `AdminPage` (Tab: EV / ICE) |

---

## Komponenten-Refactoring

`useCars` wird zu `useCarsCollection(collectionName)` — nimmt den Collection-Namen als Parameter und gibt `{ cars, loading }` zurück. `HomePage` ruft ihn mit `'ev_cars'` auf, `IceHomePage` mit `'ice_cars'`.

`CarForm`, `AdminPanel`, `CarImport` erhalten `fields` als Prop — kein internes Hardcoding mehr. Die ICE-Admin-Ansicht übergibt `ICE_FIELDS` und die entsprechenden Firebase-Funktionen aus `ice-cars.js`.

---

## Out of Scope

- Kein Vergleich zwischen EV und ICE (das ist Aufgabe von `ev-vergleich`)
- Keine berechneten Felder bei ICE (keine Ladegeschwindigkeit o.ä.)
- Keine i18n-Erweiterung für neue Felder in diesem Schritt
