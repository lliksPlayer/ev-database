# EV-Scraper + Detail-Ansicht Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fahrzeugdaten von ev-database.org per Firecrawl scrapen und in Firestore importieren; CarDetail-Modal zeigt alle neuen Felder in strukturierten Sektionen.

**Architecture:** Ein einmaliger Node.js-Script (`scripts/scrape-ev-database.js`) holt alle Auto-URLs von ev-database.org, extrahiert pro Fahrzeug strukturierte Daten via Firecrawl LLM-Extraktion und schreibt sie per Batch in Firestore. Die CarDetail-Komponente wird von "Coming Soon" auf echte Sektionen umgebaut.

**Tech Stack:** Node.js ESM, @mendable/firecrawl-js, Firebase Web SDK v12, dotenv, React 19

---

## File Structure

| Datei | Aktion | Verantwortlichkeit |
|---|---|---|
| `ev-database/scripts/firebase-import.js` | Neu | Firebase init für Node-Kontext (kein Vite), exportiert `importCars()` |
| `ev-database/scripts/scrape-ev-database.js` | Neu | Hauptscript: URLs holen → scrapen → importieren |
| `ev-database/src/components/cars/CarDetail.jsx` | Ändern | "Coming Soon" ersetzen durch strukturierte Sektionen |
| `ev-database/src/components/cars/CarDetail.css` | Ändern | Styles für Sektionen, Bildbereich, Feldzeilen |
| `ev-database/src/i18n/de.json` | Ändern | Übersetzungen für Detail-Sektionen |
| `ev-database/src/i18n/en.json` | Ändern | Übersetzungen für Detail-Sektionen |
| `ev-database/.env` | Ändern | FIRECRAWL_API_KEY hinzufügen |

---

## Task 1: Script-Abhängigkeiten installieren

**Files:**
- Modify: `ev-database/package.json`

- [ ] **Step 1: Abhängigkeiten installieren**

```bash
cd ev-database && npm install dotenv @mendable/firecrawl-js
```

Erwartete Ausgabe: `added N packages`

- [ ] **Step 2: Firecrawl API Key in .env eintragen**

Aktuelle `.env` öffnen und Zeile anhängen:
```
FIRECRAWL_API_KEY=fc-681db263d4af4694b4314c06574b68aa
```

- [ ] **Step 3: Commit**

```bash
cd ev-database && git add package.json package-lock.json .env
git commit -m "chore: dotenv und firecrawl-js installiert, API key in .env"
```

---

## Task 2: Firebase-Helper für Scripts

**Files:**
- Create: `ev-database/scripts/firebase-import.js`

Hintergrund: `src/firebase/config.js` nutzt `import.meta.env` (Vite-spezifisch). In einem Node.js-Script existiert `import.meta.env` nicht — daher brauchen wir eine separate Firebase-Initialisierung mit `dotenv`.

- [ ] **Step 1: Datei anlegen**

`ev-database/scripts/firebase-import.js`:
```js
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
})

export const db = getFirestore(app)

export async function importCars(cars) {
  const ref = collection(db, 'ev_cars')
  // Firestore batch ist auf 500 Operationen limitiert — bei mehr als 500 Autos in Chunks splitten
  const CHUNK = 499
  for (let i = 0; i < cars.length; i += CHUNK) {
    const batch = writeBatch(db)
    cars.slice(i, i + CHUNK).forEach(car => batch.set(doc(ref), car))
    await batch.commit()
    console.log(`  Chunk ${Math.floor(i / CHUNK) + 1} committed (${Math.min(i + CHUNK, cars.length)}/${cars.length})`)
  }
}
```

- [ ] **Step 2: Manuell testen — Firebase verbindet sich**

```bash
cd ev-database && node -e "import('./scripts/firebase-import.js').then(m => console.log('Firebase OK:', !!m.db))"
```

Erwartete Ausgabe: `Firebase OK: true`

- [ ] **Step 3: Commit**

```bash
git add scripts/firebase-import.js
git commit -m "feat: Firebase-Helper für Node-Scripts"
```

---

## Task 3: Scraper-Script

**Files:**
- Create: `ev-database/scripts/scrape-ev-database.js`

- [ ] **Step 1: Datei anlegen**

`ev-database/scripts/scrape-ev-database.js`:
```js
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import FirecrawlApp from '@mendable/firecrawl-js'
import { importCars } from './firebase-import.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    marke:                      { type: 'string',  description: 'Car brand/manufacturer e.g. Tesla, BMW' },
    modell:                     { type: 'string',  description: 'Car model name e.g. Model 3 RWD' },
    baujahr:                    { type: 'string',  description: 'Production years e.g. 2021-2023' },
    preis_de:                   { type: 'number',  description: 'Recommended retail price in Germany in EUR, numeric only' },
    bild_url:                   { type: 'string',  description: 'URL of the main vehicle photo (largest non-thumbnail image)' },
    reichweite_wltp:            { type: 'number',  description: 'Official WLTP range in km' },
    akku_kapazitaet_kwh:        { type: 'number',  description: 'Useable battery capacity in kWh' },
    architektur_volt:           { type: 'number',  description: 'Battery architecture voltage, typically 400 or 800' },
    laden_ac_kw:                { type: 'number',  description: 'Maximum AC home/destination charging power in kW' },
    laden_dc_kw:                { type: 'number',  description: 'Maximum DC fast charging power in kW' },
    ladezeit_10_80_min:         { type: 'number',  description: 'DC fast charge time from 10 to 80 percent in minutes' },
    beschleunigung_sec:         { type: 'number',  description: '0-100 km/h acceleration time in seconds' },
    hoechstgeschwindigkeit_kmh: { type: 'number',  description: 'Top speed in km/h' },
    leistung_kw:                { type: 'number',  description: 'Total motor power in kW' },
    laenge_mm:                  { type: 'number',  description: 'Vehicle length in mm' },
    breite_mm:                  { type: 'number',  description: 'Vehicle width without mirrors in mm' },
    hoehe_mm:                   { type: 'number',  description: 'Vehicle height in mm' },
    radstand_mm:                { type: 'number',  description: 'Wheelbase in mm' },
    gewicht_leer_kg:            { type: 'number',  description: 'Unladen weight EU in kg' },
    zul_gesamtgewicht_kg:       { type: 'number',  description: 'Gross vehicle weight GVWR in kg' },
    zuladung_kg:                { type: 'number',  description: 'Maximum payload in kg' },
    anhaengelast_gebremst_kg:   { type: 'number',  description: 'Towing weight braked in kg' },
    anhaengelast_ungebremst_kg: { type: 'number',  description: 'Towing weight unbraked in kg' },
    kofferraum_l:               { type: 'number',  description: 'Cargo volume in liters' },
    kofferraum_max_l:           { type: 'number',  description: 'Maximum cargo volume with rear seats folded in liters' },
    frunk_l:                    { type: 'number',  description: 'Front trunk frunk volume in liters, 0 if none' },
    dachlast_kg:                { type: 'number',  description: 'Maximum roof load in kg' },
    sitze:                      { type: 'number',  description: 'Number of seats' },
    isofix:                     { type: 'string',  description: 'Isofix info e.g. "Yes, 2 seats" or "No"' },
    wendekreis_m:               { type: 'number',  description: 'Turning circle in meters' },
    karosserie:                 { type: 'string',  description: 'Car body type e.g. SUV, Sedan, Hatchback, Estate' },
    segment:                    { type: 'string',  description: 'Car segment e.g. B - Small, C - Medium, D - Large' },
    waermepumpe:                { type: 'string',  description: 'Heat pump: Yes or No' },
    plattform:                  { type: 'string',  description: 'Vehicle platform name e.g. MEB, Tesla 3/Y' },
  },
  required: ['marke', 'modell'],
}

async function getCarUrls() {
  console.log('Mapping ev-database.org for car URLs...')
  const result = await firecrawl.mapUrl('https://ev-database.org/', {
    includeSubdomains: false,
  })
  const urls = (result.links ?? []).filter(url => /ev-database\.org\/car\/\d+\//.test(url))
  // Deduplizieren
  return [...new Set(urls)]
}

async function scrapeOne(url) {
  const result = await firecrawl.scrapeUrl(url, {
    formats: ['extract'],
    extract: { schema: EXTRACT_SCHEMA },
  })
  return result?.extract ?? null
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const urls = await getCarUrls()
  console.log(`Found ${urls.length} car URLs\n`)

  const cars = []
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    try {
      const data = await scrapeOne(url)
      if (data?.marke) {
        cars.push(data)
        console.log(`[${i + 1}/${urls.length}] ✓ ${data.marke} ${data.modell}`)
      } else {
        console.log(`[${i + 1}/${urls.length}] ⚠ No data: ${url}`)
      }
    } catch (err) {
      console.log(`[${i + 1}/${urls.length}] ✗ ${url}: ${err.message}`)
    }
    // 300ms zwischen Requests — Firecrawl-Rate-Limit schonen
    if (i < urls.length - 1) await sleep(300)
  }

  console.log(`\nImporting ${cars.length} cars to Firestore...`)
  await importCars(cars)
  console.log('Done!')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: Dry-run mit einem Auto testen**

Skript temporär auf ein Auto begrenzen (Zeile `urls.length` → `1`) und ausführen:
```bash
cd ev-database && node scripts/scrape-ev-database.js
```

Erwartete Ausgabe:
```
Mapping ev-database.org for car URLs...
Found N car URLs
[1/1] ✓ Tesla Model 3 RWD
Importing 1 cars to Firestore...
  Chunk 1 committed (1/1)
Done!
```

In Firebase Console unter `ev_cars` Collection prüfen: Ein neues Dokument mit den Feldern vorhanden.

- [ ] **Step 3: Limit entfernen und vollständig laufen lassen**

```bash
cd ev-database && node scripts/scrape-ev-database.js
```

- [ ] **Step 4: Commit**

```bash
git add scripts/scrape-ev-database.js
git commit -m "feat: EV-Scraper-Script für ev-database.org"
```

---

## Task 4: i18n-Übersetzungen für Detail-Sektionen

**Files:**
- Modify: `ev-database/src/i18n/de.json`
- Modify: `ev-database/src/i18n/en.json`

- [ ] **Step 1: Deutschen Übersetzungen ergänzen**

In `src/i18n/de.json` den `"detail"`-Block ersetzen:
```json
"detail": {
  "title": "Fahrzeugdetails",
  "close": "Schließen",
  "sections": {
    "basis": "Basis",
    "range_battery": "Reichweite & Akku",
    "charging": "Laden",
    "performance": "Performance",
    "dimensions": "Maße",
    "weight": "Gewicht & Anhängelast",
    "cargo": "Kofferraum",
    "misc": "Diverses"
  },
  "fields": {
    "baujahr": "Baujahr",
    "preis_de": "Preis (DE)",
    "reichweite_wltp": "Reichweite WLTP",
    "akku_kapazitaet_kwh": "Akkukapazität",
    "architektur_volt": "Architektur",
    "laden_ac_kw": "Laden AC",
    "laden_dc_kw": "Laden DC",
    "ladezeit_10_80_min": "Ladezeit 10→80%",
    "beschleunigung_sec": "0–100 km/h",
    "hoechstgeschwindigkeit_kmh": "Höchstgeschwindigkeit",
    "leistung_kw": "Leistung",
    "laenge_mm": "Länge",
    "breite_mm": "Breite",
    "hoehe_mm": "Höhe",
    "radstand_mm": "Radstand",
    "gewicht_leer_kg": "Leergewicht",
    "zul_gesamtgewicht_kg": "Zul. Gesamtgewicht",
    "zuladung_kg": "Zuladung",
    "anhaengelast_gebremst_kg": "Anhängelast gebremst",
    "anhaengelast_ungebremst_kg": "Anhängelast ungebremst",
    "kofferraum_l": "Kofferraum",
    "kofferraum_max_l": "Kofferraum max.",
    "frunk_l": "Frunk",
    "dachlast_kg": "Dachlast",
    "sitze": "Sitze",
    "isofix": "Isofix",
    "wendekreis_m": "Wendekreis",
    "karosserie": "Karosserie",
    "segment": "Segment",
    "waermepumpe": "Wärmepumpe",
    "plattform": "Plattform"
  },
  "units": {
    "km": "km",
    "kwh": "kWh",
    "volt": "V",
    "kw": "kW",
    "min": "Min.",
    "sec": "s",
    "kmh": "km/h",
    "mm": "mm",
    "kg": "kg",
    "liter": "L",
    "meter": "m"
  }
}
```

- [ ] **Step 2: Englische Übersetzungen ergänzen**

In `src/i18n/en.json` den `"detail"`-Block ersetzen:
```json
"detail": {
  "title": "Vehicle Details",
  "close": "Close",
  "sections": {
    "basis": "Basics",
    "range_battery": "Range & Battery",
    "charging": "Charging",
    "performance": "Performance",
    "dimensions": "Dimensions",
    "weight": "Weight & Towing",
    "cargo": "Cargo",
    "misc": "Miscellaneous"
  },
  "fields": {
    "baujahr": "Year",
    "preis_de": "Price (DE)",
    "reichweite_wltp": "WLTP Range",
    "akku_kapazitaet_kwh": "Battery Capacity",
    "architektur_volt": "Architecture",
    "laden_ac_kw": "AC Charging",
    "laden_dc_kw": "DC Charging",
    "ladezeit_10_80_min": "Charge Time 10→80%",
    "beschleunigung_sec": "0–100 km/h",
    "hoechstgeschwindigkeit_kmh": "Top Speed",
    "leistung_kw": "Power",
    "laenge_mm": "Length",
    "breite_mm": "Width",
    "hoehe_mm": "Height",
    "radstand_mm": "Wheelbase",
    "gewicht_leer_kg": "Unladen Weight",
    "zul_gesamtgewicht_kg": "Gross Weight",
    "zuladung_kg": "Max Payload",
    "anhaengelast_gebremst_kg": "Towing Braked",
    "anhaengelast_ungebremst_kg": "Towing Unbraked",
    "kofferraum_l": "Cargo Volume",
    "kofferraum_max_l": "Cargo Volume Max",
    "frunk_l": "Frunk",
    "dachlast_kg": "Roof Load",
    "sitze": "Seats",
    "isofix": "Isofix",
    "wendekreis_m": "Turning Circle",
    "karosserie": "Body Type",
    "segment": "Segment",
    "waermepumpe": "Heat Pump",
    "plattform": "Platform"
  },
  "units": {
    "km": "km",
    "kwh": "kWh",
    "volt": "V",
    "kw": "kW",
    "min": "min",
    "sec": "s",
    "kmh": "km/h",
    "mm": "mm",
    "kg": "kg",
    "liter": "L",
    "meter": "m"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/de.json src/i18n/en.json
git commit -m "feat: i18n-Übersetzungen für CarDetail-Sektionen"
```

---

## Task 5: CarDetail-CSS aktualisieren

**Files:**
- Modify: `ev-database/src/components/cars/CarDetail.jsx`

Hinweis: CSS-Klassen aus Task 5 müssen zuerst committed sein.

- [ ] **Step 1: CarDetail.jsx vollständig ersetzen**

`ev-database/src/components/cars/CarDetail.jsx`:
```jsx
import { useTranslation } from 'react-i18next'
import './CarDetail.css'

const SECTIONS = [
  {
    key: 'basis',
    fields: [
      { key: 'baujahr' },
      { key: 'preis_de', unit: null, format: 'currency' },
    ],
  },
  {
    key: 'range_battery',
    fields: [
      { key: 'reichweite_wltp',     unit: 'km' },
      { key: 'akku_kapazitaet_kwh', unit: 'kwh' },
      { key: 'architektur_volt',    unit: 'volt' },
    ],
  },
  {
    key: 'charging',
    fields: [
      { key: 'laden_ac_kw',         unit: 'kw' },
      { key: 'laden_dc_kw',         unit: 'kw' },
      { key: 'ladezeit_10_80_min',  unit: 'min' },
    ],
  },
  {
    key: 'performance',
    fields: [
      { key: 'beschleunigung_sec',         unit: 'sec' },
      { key: 'hoechstgeschwindigkeit_kmh', unit: 'kmh' },
      { key: 'leistung_kw',               unit: 'kw' },
    ],
  },
  {
    key: 'dimensions',
    fields: [
      { key: 'laenge_mm',   unit: 'mm' },
      { key: 'breite_mm',   unit: 'mm' },
      { key: 'hoehe_mm',    unit: 'mm' },
      { key: 'radstand_mm', unit: 'mm' },
    ],
  },
  {
    key: 'weight',
    fields: [
      { key: 'gewicht_leer_kg',            unit: 'kg' },
      { key: 'zul_gesamtgewicht_kg',       unit: 'kg' },
      { key: 'zuladung_kg',                unit: 'kg' },
      { key: 'anhaengelast_gebremst_kg',   unit: 'kg' },
      { key: 'anhaengelast_ungebremst_kg', unit: 'kg' },
    ],
  },
  {
    key: 'cargo',
    fields: [
      { key: 'kofferraum_l',     unit: 'liter' },
      { key: 'kofferraum_max_l', unit: 'liter' },
      { key: 'frunk_l',          unit: 'liter' },
      { key: 'dachlast_kg',      unit: 'kg' },
    ],
  },
  {
    key: 'misc',
    fields: [
      { key: 'sitze' },
      { key: 'isofix' },
      { key: 'wendekreis_m', unit: 'meter' },
      { key: 'karosserie' },
      { key: 'segment' },
      { key: 'waermepumpe' },
      { key: 'plattform' },
    ],
  },
]

function formatValue(value, unit, format, units, t) {
  if (value === undefined || value === null || value === '') return null
  if (format === 'currency')
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  if (unit && units[unit]) return `${value} ${t(`detail.units.${unit}`)}`
  return String(value)
}

export default function CarDetail({ car, onClose }) {
  const { t } = useTranslation()
  if (!car) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{car.marke} {car.modell}</div>

        {car.bild_url && (
          <div className="detail-image-wrap">
            <img src={car.bild_url} alt={`${car.marke} ${car.modell}`} className="detail-image" />
          </div>
        )}

        {SECTIONS.map(section => {
          const visibleFields = section.fields
            .map(f => ({
              ...f,
              label: t(`detail.fields.${f.key}`),
              value: formatValue(car[f.key], f.unit, f.format, {
                km: true, kwh: true, volt: true, kw: true, min: true,
                sec: true, kmh: true, mm: true, kg: true, liter: true, meter: true
              }, t),
            }))
            .filter(f => f.value !== null)

          if (visibleFields.length === 0) return null

          return (
            <div key={section.key} className="detail-section">
              <div className="detail-section-title">{t(`detail.sections.${section.key}`)}</div>
              {visibleFields.map(f => (
                <div key={f.key} className="detail-field">
                  <span className="detail-field-label">{f.label}</span>
                  <span className="detail-field-value">{f.value}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: App starten und Detail-Modal prüfen**

```bash
cd ev-database && npm run dev
```

Ein Fahrzeug anklicken → Modal öffnet → Sektionen sichtbar. Felder ohne Wert werden nicht angezeigt. Bild erscheint falls `bild_url` vorhanden.

- [ ] **Step 3: Commit**

```bash
git add src/components/cars/CarDetail.jsx
git commit -m "feat: CarDetail zeigt strukturierte Sektionen mit allen Feldern"
```

---

## Task 6: CarDetail-Komponente

**Files:**
- Modify: `ev-database/src/components/cars/CarDetail.css`

- [ ] **Step 1: CSS vollständig ersetzen**

`ev-database/src/components/cars/CarDetail.css`:
```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; padding: 1rem;
}
.modal-card {
  background: white;
  border-radius: 14px;
  padding: 2rem;
  max-width: 540px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
}
.modal-title {
  font-size: 1.3rem; font-weight: 700;
  margin-bottom: 1rem; padding-right: 2rem;
}
.modal-close {
  position: absolute; top: 1rem; right: 1rem;
  background: #f0f0f0; border: none; border-radius: 50%;
  width: 32px; height: 32px; cursor: pointer; font-size: 1rem;
}

.detail-image-wrap {
  width: 100%; margin-bottom: 1.25rem;
  border-radius: 10px; overflow: hidden;
  background: #f5f5f5;
}
.detail-image {
  width: 100%; height: auto; display: block;
  max-height: 200px; object-fit: cover;
}

.detail-section {
  margin-bottom: 1.25rem;
}
.detail-section-title {
  font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #888; margin-bottom: 0.4rem;
}
.detail-field {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 0.3rem 0;
  border-bottom: 1px solid #f0f0f0;
}
.detail-field:last-child { border-bottom: none; }
.detail-field-label { color: #555; font-size: 0.875rem; }
.detail-field-value { font-weight: 600; font-size: 0.875rem; text-align: right; }
```

- [ ] **Step 2: Visuell prüfen**

App im Browser öffnen, ein Fahrzeug anklicken. Prüfen:
- Sektions-Titel in grau/uppercase
- Felder als Label-Wert-Zeilen
- Bild oben (falls vorhanden)
- Modal scrollbar bei vielen Feldern

- [ ] **Step 3: Commit**

```bash
git add src/components/cars/CarDetail.css
git commit -m "feat: CarDetail-CSS für Sektionen und Fahrzeugbild"
```
