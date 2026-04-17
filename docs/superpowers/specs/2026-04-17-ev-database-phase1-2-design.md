# EV-Datenbank — Design Spec (Phase 1+2)

**Datum:** 2026-04-17  
**Status:** Genehmigt  
**Scope:** Phase 1 (Fundament) + Phase 2 (EV-Datenbank + Admin)

## Übersicht

Eine Webanwendung zur Verwaltung und Anzeige einer Elektroauto-Datenbank. Nutzer sehen Fahrzeugkarten in Grid- oder Listenansicht. Ein geschützter Admin-Bereich erlaubt CRUD-Operationen und Konfiguration der sichtbaren Felder.

Spätere Phasen (3–6) fügen Verbrenner-Datenbank, Wirtschaftlichkeitsrechner, EV-Vergleich und Kaufberater hinzu.

---

## Tech-Stack

| Technologie | Verwendung | Kosten |
|-------------|-----------|--------|
| React + Vite | Frontend SPA | kostenlos |
| Firebase Firestore | Datenbank | kostenlos (Gratis-Tier) |
| Firebase Auth | Admin-Login | kostenlos |
| Vercel | Hosting | kostenlos |
| react-i18next | DE/EN Übersetzung | kostenlos |
| react-router-dom | Routing | kostenlos |
| xlsx (SheetJS) | Excel/CSV-Import | kostenlos |

---

## Projektstruktur

```
ev-database/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopNav.jsx         # Navigation, Sprachwechsel, Admin-Button
│   │   │   └── LanguageSwitch.jsx # DE/EN Toggle
│   │   ├── cars/
│   │   │   ├── CarCard.jsx        # Einzelne Fahrzeugkarte
│   │   │   ├── CarGrid.jsx        # Grid-Ansicht mit Größenauswahl
│   │   │   ├── CarList.jsx        # Listen-Ansicht
│   │   │   ├── CarDetail.jsx      # Detail-Modal (Felder kommen später)
│   │   │   └── ViewToggle.jsx     # Grid/Liste + Größe wechseln
│   │   └── admin/
│   │       ├── AdminPanel.jsx     # Admin-Übersicht
│   │       ├── CarForm.jsx        # Formular: Fahrzeug hinzufügen/bearbeiten
│   │       ├── CarImport.jsx      # Excel/CSV-Import mit Spalten-Mapping
│   │       └── FieldToggle.jsx    # Karten-Felder ein/aus, Reihenfolge
│   ├── pages/
│   │   ├── HomePage.jsx           # EV-Datenbank Übersicht
│   │   ├── AdminPage.jsx          # Admin-Bereich (geschützt)
│   │   └── LoginPage.jsx          # Admin-Login
│   ├── firebase/
│   │   ├── config.js              # Firebase-Initialisierung
│   │   ├── cars.js                # Firestore CRUD: ev_cars
│   │   └── auth.js                # Login / Logout / onAuthStateChanged
│   ├── hooks/
│   │   ├── useCars.js             # Lädt EV-Liste aus Firestore (Echtzeit)
│   │   └── useAuth.js             # Auth-Status (eingeloggt ja/nein)
│   ├── i18n/
│   │   ├── de.json                # Deutsche UI-Texte
│   │   └── en.json                # Englische UI-Texte
│   ├── utils/
│   │   └── calculations.js        # Berechnete Felder (kWh nach 70%, kWh/min)
│   └── main.jsx
├── .env                           # Firebase-Credentials (nicht in git)
├── .gitignore
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Firebase Firestore Collections

### `ev_cars` — ein Dokument pro EV

```js
{
  id: "auto-generated",
  marke: "Tesla",
  modell: "Model 3",
  batterie_netto: 75,          // kWh
  laden_10_80_min: 25,         // Minuten
  max_ladeleistung: 170,       // kW
  anhaengelast: 1000,          // kg
  wltp_reichweite: 560,        // km
  wltp_verbrauch: 14.5,        // kWh/100km
  basis_preis: 40990,          // €
  hoechster_preis: 55000,      // €
  null_hundert: 4.4,           // Sekunden
  ps: 358,
  top_speed: 225,              // km/h
  volt: 400,
  markteinfuehrung: "2021",
  // Berechnete Felder (werden beim Speichern mitgespeichert):
  kwh_nach_70: 52.5,           // batterie_netto * 0.7
  kwh_pro_min: 2.1             // (batterie_netto * 0.7) / laden_10_80_min
}
```

### `settings` — Konfiguration

```js
// Dokument: card_fields
{
  fields: [
    { key: "marke", label_de: "Marke", label_en: "Brand", visible: true, order: 0 },
    { key: "modell", label_de: "Modell", label_en: "Model", visible: true, order: 1 },
    { key: "batterie_netto", label_de: "Batterie Netto", label_en: "Battery Net", visible: true, order: 2 },
    { key: "laden_10_80_min", label_de: "10%–80% (min)", label_en: "10%–80% (min)", visible: true, order: 3 },
    { key: "kwh_nach_70", label_de: "kWh nach 70%", label_en: "kWh after 70%", visible: true, order: 4 },
    { key: "kwh_pro_min", label_de: "kWh/min", label_en: "kWh/min", visible: true, order: 5 },
    { key: "max_ladeleistung", label_de: "Max. Ladeleistung", label_en: "Max. Charge Power", visible: true, order: 6 },
    { key: "anhaengelast", label_de: "Anhängelast", label_en: "Towing Capacity", visible: false, order: 7 },
    { key: "wltp_reichweite", label_de: "WLTP Reichweite", label_en: "WLTP Range", visible: true, order: 8 },
    { key: "wltp_verbrauch", label_de: "WLTP Verbrauch", label_en: "WLTP Consumption", visible: false, order: 9 },
    { key: "basis_preis", label_de: "Basispreis", label_en: "Base Price", visible: true, order: 10 },
    { key: "hoechster_preis", label_de: "Höchster Preis", label_en: "Max Price", visible: false, order: 11 },
    { key: "null_hundert", label_de: "0–100 (s)", label_en: "0–100 (s)", visible: true, order: 12 },
    { key: "ps", label_de: "PS", label_en: "HP", visible: false, order: 13 },
    { key: "top_speed", label_de: "Top Speed", label_en: "Top Speed", visible: false, order: 14 },
    { key: "volt", label_de: "Volt", label_en: "Volt", visible: false, order: 15 },
    { key: "markteinfuehrung", label_de: "Markteinführung", label_en: "Market Launch", visible: false, order: 16 }
  ]
}
```

---

## EV-Datenbank (User-Ansicht)

### Ansichtsmodi
- **Grid** mit 3 Größen (vom User wählbar, in localStorage gespeichert):
  - Klein: 4–5 Karten/Reihe
  - Mittel: 3 Karten/Reihe (Standard)
  - Groß: 2 Karten/Reihe
- **Liste**: 1 Zeile pro Fahrzeug, kompakt
- Wechsel jederzeit über `ViewToggle`-Komponente

### Fahrzeugkarte
- Zeigt alle Felder mit `visible: true` aus `settings/card_fields`
- Reihenfolge entspricht `order`-Wert
- Klick auf Karte → `CarDetail`-Modal (Detailfelder kommen als spätere Funktion)
- Responsive: Grid passt sich Bildschirmbreite an

---

## Admin-Bereich

### Authentifizierung
- Firebase Auth, E-Mail + Passwort
- 1 Admin-Account, direkt in Firebase Console angelegt
- Route `/admin` prüft Auth-Status via `useAuth` — Redirect zu `/admin/login` wenn nicht eingeloggt
- Nach Login: Redirect zurück zu `/admin`

### Fahrzeuge verwalten

**Manuell hinzufügen/bearbeiten:**
- Formular mit allen 17 Feldern
- Berechnete Felder (`kwh_nach_70`, `kwh_pro_min`) werden live beim Tippen berechnet und read-only angezeigt
- Speichern schreibt berechnete Felder mit in Firestore

**Import (Excel / CSV):**
1. Admin lädt `.xlsx` oder `.csv` hoch
2. SheetJS liest Spaltenüberschriften automatisch aus
3. Mapping-Tabelle erscheint: *Spalte aus Datei → Feld in DB* (auto-erkannt, manuell korrigierbar)
4. Vorschau der ersten 5 Zeilen
5. Bestätigen → Batch-Import in Firestore

**Löschen:**
- Löschen-Button pro Fahrzeug mit Bestätigungs-Dialog

### Karten-Felder konfigurieren
- Liste aller 17 Felder mit Toggle (sichtbar / ausgeblendet)
- Reihenfolge per Drag & Drop änderbar
- Änderungen sofort in `settings/card_fields` gespeichert → gilt sofort für alle User

---

## Navigation

```
[Logo/App-Name]    [EV-Datenbank]    [DE | EN]  [Admin ← nur wenn eingeloggt]
```

### Routen (Phase 1+2)

| Route | Seite | Schutz |
|-------|-------|--------|
| `/` | EV-Datenbank | öffentlich |
| `/admin/login` | Admin-Login | öffentlich |
| `/admin` | Admin-Panel | Auth required |

### Spätere Routen (Phase 3–6)
`/verbrenner`, `/rechner`, `/vergleich`, `/kaufberater`

---

## Berechnungen

```js
// utils/calculations.js
export const calcKwhNach70 = (batterie_netto) =>
  batterie_netto * 0.7;

export const calcKwhProMin = (batterie_netto, laden_10_80_min) =>
  laden_10_80_min > 0 ? (batterie_netto * 0.7) / laden_10_80_min : 0;
```

---

## i18n

Alle UI-Texte in `de.json` und `en.json`. Feldbezeichnungen kommen aus `settings/card_fields` (haben `label_de` und `label_en`). Sprache wird in localStorage gespeichert.

---

## Deployment

- Vercel verbindet direkt mit GitHub-Repo
- `.env`-Variablen (Firebase-Config) in Vercel Dashboard eingeben
- Jeder Push auf `main` → automatisches Deployment

---

## Abgrenzung (nicht in Phase 1+2)

- Verbrenner-Datenbank
- Wirtschaftlichkeitsrechner
- EV-vs-EV Vergleich
- Kaufberater
- Detail-Seite Felder-Konfiguration
- Suchfunktion / Filter
