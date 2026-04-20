# Wirtschaftlichkeitsrechner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neue Seite `/rechner` für TCO-Vergleich zweier Fahrzeuge (EV vs ICE oder EV vs EV) mit Normal/Experten-Modus und drei Ergebnis-Tabs.

**Architecture:** Dedizierte Route `/rechner` → `Calculator.jsx`. Fahrzeuge werden per URL-Params (`?ev1=<id>&ev2=<id>`) geladen und können auch manuell eingegeben werden. Alle Berechnungen laufen client-seitig in `tcoCalculation.js`. Ergebnisse werden mit Recharts visualisiert.

**Tech Stack:** React 19, react-router-dom v7, Firebase/Firestore, Recharts, react-i18next

---

## File Map

| Datei | Status | Verantwortlichkeit |
|-------|--------|-------------------|
| `src/utils/tcoCalculation.js` | Neu | TCO-Berechnungslogik (pure functions) |
| `src/pages/Calculator.jsx` | Neu | Hauptseite: URL-Parsing, State, Orchestrierung |
| `src/pages/Calculator.css` | Neu | Layout der Rechner-Seite |
| `src/components/calculator/UserModeToggle.jsx` | Neu | Normal/Experten-Umschalter |
| `src/components/calculator/VehicleSlot.jsx` | Neu | Ein Fahrzeug-Slot (DB-Picker + Param-Eingabe) |
| `src/components/calculator/VehicleSlot.css` | Neu | Slot-Styling |
| `src/components/calculator/IceForm.jsx` | Neu | Manuelle ICE-Eingabe + Vorlagen |
| `src/components/calculator/IceForm.css` | Neu | IceForm-Styling |
| `src/components/calculator/ResultsPanel.jsx` | Neu | Tabs: Monatlich / Gesamtverlauf / Break-even |
| `src/components/calculator/ResultsPanel.css` | Neu | ResultsPanel-Styling |
| `src/components/calculator/CostChart.jsx` | Neu | Recharts Linien- und Balkendiagramme |
| `src/App.jsx` | Ändern | Route `/rechner` hinzufügen |
| `src/components/layout/TopNav.jsx` | Ändern | NavLink zu `/rechner` |
| `src/components/cars/CarCard.jsx` | Ändern | "In Rechner laden"-Button |
| `src/components/cars/CarCard.css` | Ändern | Button-Styling |
| `src/i18n/de.json` | Ändern | Deutsche Übersetzungen für Rechner |
| `src/i18n/en.json` | Ändern | Englische Übersetzungen für Rechner |

---

## Task 1: Recharts installieren

**Files:**
- Modify: `ev-database/package.json` (via npm)

- [ ] **Step 1: Recharts installieren**

```bash
cd "ev-database" && npm install recharts
```

Expected output: `added N packages`

- [ ] **Step 2: Commit**

```bash
git add ev-database/package.json ev-database/package-lock.json
git commit -m "chore: recharts installieren"
```

---

## Task 2: i18n-Übersetzungen hinzufügen

**Files:**
- Modify: `ev-database/src/i18n/de.json`
- Modify: `ev-database/src/i18n/en.json`

- [ ] **Step 1: Deutsche Übersetzungen hinzufügen**

In `src/i18n/de.json` am Ende des JSON-Objekts (vor der letzten `}`) einfügen:

```json
  "nav": {
    "evDatabase": "E-Fahrzeuge",
    "iceDatabase": "Verbrenner",
    "admin": "Admin",
    "calculator": "Rechner"
  },
  "calc": {
    "title": "Wirtschaftlichkeitsrechner",
    "modeEvIce": "EV vs. Verbrenner",
    "modeEvEv": "EV vs. EV",
    "slotA": "Fahrzeug A",
    "slotB": "Fahrzeug B",
    "selectVehicle": "Fahrzeug wählen",
    "loadingVehicles": "Lade Fahrzeuge...",
    "noVehiclesInDb": "Noch keine Fahrzeuge in der Datenbank",
    "manualEntry": "Manuell eingeben",
    "fromDatabase": "Aus Datenbank",
    "modeNormal": "Normal",
    "modeExpert": "Experte",
    "params": {
      "kaufpreis": "Kaufpreis (€)",
      "jahresKm": "Jahreskilometer (km)",
      "stromPreis": "Strompreis (€/kWh)",
      "kraftstoffPreis": "Kraftstoffpreis (€/L)",
      "jahre": "Betrachtungszeitraum (Jahre)",
      "wartung": "Wartungskosten (€/Jahr)",
      "versicherung": "Versicherung (€/Jahr)",
      "steuer": "KFZ-Steuer (€/Jahr)",
      "restwertProzent": "Restwert (%)",
      "foerderung": "Förderung/BAFA (€)",
      "zinsSatz": "Finanzierungszins (%)",
      "verbrauchKwh": "Verbrauch (kWh/100km)",
      "verbrauchL": "Verbrauch (L/100km)"
    },
    "results": {
      "tabMonthly": "Monatliche Kosten",
      "tabTotal": "Gesamtverlauf",
      "tabBreakeven": "Break-even",
      "monthly": "Monatliche Kosten",
      "totalCost": "Gesamtkosten",
      "breakevenAt": "Break-even nach {{years}} Jahren",
      "noBreakeven": "Kein Break-even im Betrachtungszeitraum",
      "cheaper": "{{name}} ist günstiger",
      "costKaufpreis": "Kaufpreis",
      "costEnergie": "Energie",
      "costWartung": "Wartung",
      "costVersicherung": "Versicherung",
      "costSteuer": "Steuer",
      "costFinanzierung": "Finanzierung",
      "costRestwert": "Restwert"
    },
    "ice": {
      "templateLabel": "Vorlage wählen",
      "templateNone": "Keine Vorlage",
      "templateGolf": "VW Golf 2.0 TDI",
      "templateBmw": "BMW 320d",
      "templatePassat": "VW Passat TDI",
      "make": "Marke",
      "model": "Modell"
    },
    "addToCalculator": "In Rechner laden",
    "selectBoth": "Bitte beide Fahrzeuge wählen",
    "vehicleA": "Fahrzeug A",
    "vehicleB": "Fahrzeug B"
  }
```

- [ ] **Step 2: Englische Übersetzungen hinzufügen**

In `src/i18n/en.json` dieselbe Struktur auf Englisch einfügen (nav.calculator und calc-Block):

```json
  "nav": {
    "evDatabase": "E-Vehicles",
    "iceDatabase": "ICE Vehicles",
    "admin": "Admin",
    "calculator": "Calculator"
  },
  "calc": {
    "title": "Cost Calculator",
    "modeEvIce": "EV vs. ICE",
    "modeEvEv": "EV vs. EV",
    "slotA": "Vehicle A",
    "slotB": "Vehicle B",
    "selectVehicle": "Select vehicle",
    "loadingVehicles": "Loading vehicles...",
    "noVehiclesInDb": "No vehicles in database yet",
    "manualEntry": "Enter manually",
    "fromDatabase": "From database",
    "modeNormal": "Normal",
    "modeExpert": "Expert",
    "params": {
      "kaufpreis": "Purchase price (€)",
      "jahresKm": "Annual kilometres",
      "stromPreis": "Electricity price (€/kWh)",
      "kraftstoffPreis": "Fuel price (€/L)",
      "jahre": "Period (years)",
      "wartung": "Maintenance (€/year)",
      "versicherung": "Insurance (€/year)",
      "steuer": "Vehicle tax (€/year)",
      "restwertProzent": "Residual value (%)",
      "foerderung": "Subsidy/Grant (€)",
      "zinsSatz": "Financing rate (%)",
      "verbrauchKwh": "Consumption (kWh/100km)",
      "verbrauchL": "Consumption (L/100km)"
    },
    "results": {
      "tabMonthly": "Monthly Costs",
      "tabTotal": "Total over time",
      "tabBreakeven": "Break-even",
      "monthly": "Monthly costs",
      "totalCost": "Total cost",
      "breakevenAt": "Break-even after {{years}} years",
      "noBreakeven": "No break-even within period",
      "cheaper": "{{name}} is cheaper",
      "costKaufpreis": "Purchase price",
      "costEnergie": "Energy",
      "costWartung": "Maintenance",
      "costVersicherung": "Insurance",
      "costSteuer": "Tax",
      "costFinanzierung": "Financing",
      "costRestwert": "Residual value"
    },
    "ice": {
      "templateLabel": "Choose template",
      "templateNone": "No template",
      "templateGolf": "VW Golf 2.0 TDI",
      "templateBmw": "BMW 320d",
      "templatePassat": "VW Passat TDI",
      "make": "Make",
      "model": "Model"
    },
    "addToCalculator": "Add to Calculator",
    "selectBoth": "Please select both vehicles",
    "vehicleA": "Vehicle A",
    "vehicleB": "Vehicle B"
  }
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/i18n/de.json ev-database/src/i18n/en.json
git commit -m "feat: i18n-Schlüssel für Wirtschaftlichkeitsrechner"
```

---

## Task 3: Route und Navigation hinzufügen

**Files:**
- Modify: `ev-database/src/App.jsx`
- Modify: `ev-database/src/components/layout/TopNav.jsx`

- [ ] **Step 1: Route in App.jsx eintragen**

`src/App.jsx` komplett ersetzen:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import TopNav from './components/layout/TopNav'
import HomePage from './pages/HomePage'
import IceHomePage from './pages/IceHomePage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import Calculator from './pages/Calculator'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/verbrenner" element={<IceHomePage />} />
        <Route path="/rechner" element={<Calculator />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute><AdminPage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: NavLink in TopNav.jsx eintragen**

`src/components/layout/TopNav.jsx` komplett ersetzen:

```jsx
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitch from './LanguageSwitch'
import './TopNav.css'

export default function TopNav() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">⚡ EV Database</Link>
      <div className="nav-links">
        <NavLink to="/" end className="nav-link">{t('nav.evDatabase')}</NavLink>
        <NavLink to="/verbrenner" className="nav-link">{t('nav.iceDatabase')}</NavLink>
        <NavLink to="/rechner" className="nav-link">{t('nav.calculator')}</NavLink>
      </div>
      <div className="nav-right">
        <LanguageSwitch />
        {user && (
          <NavLink to="/admin" className="nav-link">{t('nav.admin')}</NavLink>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Platzhalter Calculator.jsx anlegen (damit Route nicht crasht)**

```jsx
// src/pages/Calculator.jsx
export default function Calculator() {
  return <div style={{ padding: '2rem' }}>Rechner wird geladen...</div>
}
```

- [ ] **Step 4: Dev-Server starten und Navigation prüfen**

```bash
cd ev-database && npm run dev
```

Browser: `http://localhost:5173/rechner` → muss "Rechner wird geladen..." zeigen. TopNav muss "Rechner"-Link enthalten.

- [ ] **Step 5: Commit**

```bash
git add ev-database/src/App.jsx ev-database/src/components/layout/TopNav.jsx ev-database/src/pages/Calculator.jsx
git commit -m "feat: Route /rechner und Nav-Link anlegen"
```

---

## Task 4: TCO-Berechnungslogik implementieren

**Files:**
- Create: `ev-database/src/utils/tcoCalculation.js`

- [ ] **Step 1: tcoCalculation.js erstellen**

```js
// ev-database/src/utils/tcoCalculation.js

const DEFAULT_EV_VERBRAUCH = 20   // kWh/100km
const DEFAULT_ICE_VERBRAUCH = 7   // L/100km

export function calculateTCO(vehicle, params, years) {
  const kaufpreis = Number(vehicle.basis_preis || vehicle.kaufpreis || 0)
  const foerderung = Number(params.foerderung || 0)
  const zinsSatz = Number(params.zinsSatz || 0)
  const effectiveKaufpreis = kaufpreis - foerderung
  const finanzierungskosten = effectiveKaufpreis * (zinsSatz / 100) * years

  let energiekosten = 0
  if (vehicle.vehicleType === 'ev') {
    const verbrauch = Number(vehicle.verbrauch_kwh_100km || DEFAULT_EV_VERBRAUCH)
    energiekosten = (params.jahresKm / 100) * verbrauch * params.stromPreis * years
  } else {
    const verbrauch = Number(vehicle.verbrauch_l_100km || DEFAULT_ICE_VERBRAUCH)
    energiekosten = (params.jahresKm / 100) * verbrauch * params.kraftstoffPreis * years
  }

  const wartungsTotal = Number(params.wartung || 0) * years
  const versicherungTotal = Number(params.versicherung || 0) * years
  const steuerTotal = Number(params.steuer || 0) * years
  const restwert = kaufpreis * (Number(params.restwertProzent || 0) / 100)
  const gesamt = effectiveKaufpreis + energiekosten + wartungsTotal +
    versicherungTotal + steuerTotal + finanzierungskosten - restwert

  return {
    kaufpreis: effectiveKaufpreis,
    energie: energiekosten,
    wartung: wartungsTotal,
    versicherung: versicherungTotal,
    steuer: steuerTotal,
    finanzierung: finanzierungskosten,
    restwert: -restwert,
    gesamt,
    monatlich: gesamt / (years * 12),
  }
}

export function buildYearlySeries(vehicle, params, maxYears) {
  return Array.from({ length: maxYears }, (_, i) => ({
    year: i + 1,
    gesamt: calculateTCO(vehicle, params, i + 1).gesamt,
  }))
}

// Gibt das Jahr zurück, ab dem vehicleA günstiger als vehicleB ist (oder null)
export function findBreakeven(vehicleA, paramsA, vehicleB, paramsB, maxYears = 15) {
  for (let y = 1; y <= maxYears; y++) {
    if (calculateTCO(vehicleA, paramsA, y).gesamt <= calculateTCO(vehicleB, paramsB, y).gesamt) {
      return y
    }
  }
  return null
}

export const DEFAULT_PARAMS_NORMAL = {
  jahresKm: 15000,
  stromPreis: 0.30,
  kraftstoffPreis: 1.75,
  jahre: 8,
}

export const DEFAULT_PARAMS_EXPERT = {
  ...DEFAULT_PARAMS_NORMAL,
  wartung: 800,
  versicherung: 1200,
  steuer: 200,
  restwertProzent: 30,
  foerderung: 0,
  zinsSatz: 0,
}

export const ICE_TEMPLATES = {
  golf: {
    marke: 'VW', modell: 'Golf 2.0 TDI',
    vehicleType: 'ice',
    basis_preis: 32000,
    verbrauch_l_100km: 5.5,
  },
  bmw: {
    marke: 'BMW', modell: '320d',
    vehicleType: 'ice',
    basis_preis: 45000,
    verbrauch_l_100km: 5.2,
  },
  passat: {
    marke: 'VW', modell: 'Passat TDI',
    vehicleType: 'ice',
    basis_preis: 40000,
    verbrauch_l_100km: 5.8,
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add ev-database/src/utils/tcoCalculation.js
git commit -m "feat: TCO-Berechnungslogik (tcoCalculation.js)"
```

---

## Task 5: UserModeToggle-Komponente

**Files:**
- Create: `ev-database/src/components/calculator/UserModeToggle.jsx`

- [ ] **Step 1: UserModeToggle.jsx erstellen**

```jsx
// ev-database/src/components/calculator/UserModeToggle.jsx
import { useTranslation } from 'react-i18next'

export default function UserModeToggle({ expertMode, onChange }) {
  const { t } = useTranslation()
  return (
    <div className="mode-toggle">
      <button
        className={`mode-btn${!expertMode ? ' active' : ''}`}
        onClick={() => onChange(false)}
      >
        {t('calc.modeNormal')}
      </button>
      <button
        className={`mode-btn${expertMode ? ' active' : ''}`}
        onClick={() => onChange(true)}
      >
        {t('calc.modeExpert')}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add ev-database/src/components/calculator/UserModeToggle.jsx
git commit -m "feat: UserModeToggle-Komponente"
```

---

## Task 6: IceForm-Komponente (manuelle ICE-Eingabe)

**Files:**
- Create: `ev-database/src/components/calculator/IceForm.jsx`
- Create: `ev-database/src/components/calculator/IceForm.css`

- [ ] **Step 1: IceForm.jsx erstellen**

```jsx
// ev-database/src/components/calculator/IceForm.jsx
import { useTranslation } from 'react-i18next'
import { ICE_TEMPLATES } from '../../utils/tcoCalculation'
import './IceForm.css'

export default function IceForm({ vehicle, onChange }) {
  const { t } = useTranslation()

  const handleTemplate = (key) => {
    if (!key) return
    onChange({ ...ICE_TEMPLATES[key] })
  }

  const handleField = (field, value) => {
    onChange({ ...vehicle, [field]: field === 'verbrauch_l_100km' || field === 'basis_preis' ? Number(value) : value })
  }

  return (
    <div className="ice-form">
      <div className="ice-form-row">
        <label>{t('calc.ice.templateLabel')}</label>
        <select onChange={e => handleTemplate(e.target.value)} defaultValue="">
          <option value="">{t('calc.ice.templateNone')}</option>
          <option value="golf">{t('calc.ice.templateGolf')}</option>
          <option value="bmw">{t('calc.ice.templateBmw')}</option>
          <option value="passat">{t('calc.ice.templatePassat')}</option>
        </select>
      </div>
      <div className="ice-form-row">
        <label>{t('calc.ice.make')}</label>
        <input value={vehicle?.marke || ''} onChange={e => handleField('marke', e.target.value)} />
      </div>
      <div className="ice-form-row">
        <label>{t('calc.ice.model')}</label>
        <input value={vehicle?.modell || ''} onChange={e => handleField('modell', e.target.value)} />
      </div>
      <div className="ice-form-row">
        <label>{t('calc.params.kaufpreis')}</label>
        <input type="number" value={vehicle?.basis_preis || ''} onChange={e => handleField('basis_preis', e.target.value)} />
      </div>
      <div className="ice-form-row">
        <label>{t('calc.params.verbrauchL')}</label>
        <input type="number" step="0.1" value={vehicle?.verbrauch_l_100km || ''} onChange={e => handleField('verbrauch_l_100km', e.target.value)} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: IceForm.css erstellen**

```css
/* ev-database/src/components/calculator/IceForm.css */
.ice-form { display: flex; flex-direction: column; gap: 0.5rem; }
.ice-form-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.ice-form-row label { font-size: 0.85rem; color: #666; min-width: 140px; }
.ice-form-row input,
.ice-form-row select { flex: 1; padding: 0.35rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; }
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/components/calculator/IceForm.jsx ev-database/src/components/calculator/IceForm.css
git commit -m "feat: IceForm mit Vorlagen und manueller Eingabe"
```

---

## Task 7: VehicleSlot-Komponente

**Files:**
- Create: `ev-database/src/components/calculator/VehicleSlot.jsx`
- Create: `ev-database/src/components/calculator/VehicleSlot.css`

- [ ] **Step 1: VehicleSlot.jsx erstellen**

```jsx
// ev-database/src/components/calculator/VehicleSlot.jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCarsCollection } from '../../hooks/useCars'
import IceForm from './IceForm'
import './VehicleSlot.css'

// type: 'ev' | 'ice'
export default function VehicleSlot({ label, type, vehicle, params, expertMode, onVehicleChange, onParamsChange }) {
  const { t } = useTranslation()
  const collection = type === 'ev' ? 'ev_cars' : 'ice_cars'
  const { cars, loading } = useCarsCollection(collection)
  const [useManual, setUseManual] = useState(type === 'ice' && cars.length === 0)

  const showManualToggle = type === 'ice'
  const showDbPicker = !useManual || cars.length > 0

  const handleSelect = (id) => {
    const found = cars.find(c => c.id === id)
    if (found) onVehicleChange({ ...found, vehicleType: type })
  }

  const formatEur = (v) => v != null
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
    : '–'

  return (
    <div className="vehicle-slot">
      <div className="slot-header">
        <h3>{label}</h3>
        {showManualToggle && (
          <div className="slot-source-toggle">
            <button className={!useManual ? 'active' : ''} onClick={() => setUseManual(false)} disabled={cars.length === 0}>
              {t('calc.fromDatabase')}
            </button>
            <button className={useManual ? 'active' : ''} onClick={() => setUseManual(true)}>
              {t('calc.manualEntry')}
            </button>
          </div>
        )}
      </div>

      {!useManual && (
        <div className="slot-db-picker">
          {loading
            ? <span>{t('calc.loadingVehicles')}</span>
            : cars.length === 0
              ? <span className="slot-empty">{t('calc.noVehiclesInDb')}</span>
              : (
                <select
                  value={vehicle?.id || ''}
                  onChange={e => handleSelect(e.target.value)}
                >
                  <option value="">{t('calc.selectVehicle')}</option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>{c.marke} {c.modell}</option>
                  ))}
                </select>
              )
          }
        </div>
      )}

      {useManual && (
        <IceForm vehicle={vehicle} onChange={v => onVehicleChange({ ...v, vehicleType: 'ice' })} />
      )}

      {vehicle && (
        <div className="slot-vehicle-info">
          <strong>{vehicle.marke} {vehicle.modell}</strong>
          {vehicle.basis_preis && <span>{formatEur(vehicle.basis_preis)}</span>}
        </div>
      )}

      <div className="slot-params">
        <ParamRow label={t('calc.params.kaufpreis')} value={params.kaufpreis ?? vehicle?.basis_preis ?? ''} onChange={v => onParamsChange({ kaufpreis: Number(v) })} />
        <ParamRow label={t('calc.params.jahresKm')} value={params.jahresKm} onChange={v => onParamsChange({ jahresKm: Number(v) })} />
        {type === 'ev'
          ? <ParamRow label={t('calc.params.stromPreis')} value={params.stromPreis} step="0.01" onChange={v => onParamsChange({ stromPreis: Number(v) })} />
          : <ParamRow label={t('calc.params.kraftstoffPreis')} value={params.kraftstoffPreis} step="0.01" onChange={v => onParamsChange({ kraftstoffPreis: Number(v) })} />
        }
        <ParamRow label={t('calc.params.jahre')} value={params.jahre} min="1" max="15" onChange={v => onParamsChange({ jahre: Number(v) })} />

        {expertMode && <>
          <ParamRow label={t('calc.params.wartung')} value={params.wartung ?? 0} onChange={v => onParamsChange({ wartung: Number(v) })} />
          <ParamRow label={t('calc.params.versicherung')} value={params.versicherung ?? 0} onChange={v => onParamsChange({ versicherung: Number(v) })} />
          <ParamRow label={t('calc.params.steuer')} value={params.steuer ?? 0} onChange={v => onParamsChange({ steuer: Number(v) })} />
          <ParamRow label={t('calc.params.restwertProzent')} value={params.restwertProzent ?? 0} step="1" onChange={v => onParamsChange({ restwertProzent: Number(v) })} />
          <ParamRow label={t('calc.params.foerderung')} value={params.foerderung ?? 0} onChange={v => onParamsChange({ foerderung: Number(v) })} />
          <ParamRow label={t('calc.params.zinsSatz')} value={params.zinsSatz ?? 0} step="0.1" onChange={v => onParamsChange({ zinsSatz: Number(v) })} />
        </>}
      </div>
    </div>
  )
}

function ParamRow({ label, value, onChange, step = '1', min, max }) {
  return (
    <div className="param-row">
      <label>{label}</label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
```

- [ ] **Step 2: VehicleSlot.css erstellen**

```css
/* ev-database/src/components/calculator/VehicleSlot.css */
.vehicle-slot {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}
.slot-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
.slot-header h3 { margin: 0; font-size: 1rem; }
.slot-source-toggle { display: flex; gap: 0.25rem; }
.slot-source-toggle button { padding: 0.2rem 0.6rem; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
.slot-source-toggle button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
.slot-db-picker select { width: 100%; padding: 0.4rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
.slot-empty { color: #999; font-size: 0.85rem; }
.slot-vehicle-info { display: flex; justify-content: space-between; font-size: 0.9rem; background: #f8f9fa; padding: 0.5rem 0.75rem; border-radius: 4px; }
.slot-params { display: flex; flex-direction: column; gap: 0.4rem; }
.param-row { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.param-row label { font-size: 0.82rem; color: #555; min-width: 160px; }
.param-row input { width: 100px; padding: 0.3rem 0.4rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.88rem; text-align: right; }
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/components/calculator/VehicleSlot.jsx ev-database/src/components/calculator/VehicleSlot.css
git commit -m "feat: VehicleSlot-Komponente mit DB-Picker und Param-Eingabe"
```

---

## Task 8: CostChart-Komponente (Recharts)

**Files:**
- Create: `ev-database/src/components/calculator/CostChart.jsx`

- [ ] **Step 1: CostChart.jsx erstellen**

```jsx
// ev-database/src/components/calculator/CostChart.jsx
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts'

const COLOR_A = '#2563eb'
const COLOR_B = '#dc2626'

const formatEur = (v) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

// Liniendiagramm: Gesamtkosten über Jahre
export function TotalCostChart({ seriesA, seriesB, labelA, labelB, breakevenYear }) {
  const data = seriesA.map((a, i) => ({
    year: a.year,
    [labelA]: Math.round(a.gesamt),
    [labelB]: Math.round(seriesB[i].gesamt),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" label={{ value: 'Jahre', position: 'insideBottomRight', offset: -5 }} />
        <YAxis tickFormatter={v => `${Math.round(v / 1000)}k€`} />
        <Tooltip formatter={(v) => formatEur(v)} />
        <Legend />
        {breakevenYear && <ReferenceLine x={breakevenYear} stroke="#16a34a" strokeDasharray="4 4" label="Break-even" />}
        <Line type="monotone" dataKey={labelA} stroke={COLOR_A} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey={labelB} stroke={COLOR_B} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Balkendiagramm: Monatliche Kosten aufgeschlüsselt
export function MonthlyCostChart({ tcoA, tcoB, labelA, labelB }) {
  const categories = ['kaufpreis', 'energie', 'wartung', 'versicherung', 'steuer', 'finanzierung']
  const data = categories.map(key => ({
    name: key,
    [labelA]: Math.round(tcoA[key] / (12 * /* years embedded in tco */ 1) * 12) || 0,
    [labelB]: Math.round(tcoB[key] / (12 * 1) * 12) || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `${v}€`} />
        <Tooltip formatter={(v) => formatEur(v)} />
        <Legend />
        <Bar dataKey={labelA} fill={COLOR_A} />
        <Bar dataKey={labelB} fill={COLOR_B} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add ev-database/src/components/calculator/CostChart.jsx
git commit -m "feat: CostChart mit Recharts (Linie + Balken)"
```

---

## Task 9: ResultsPanel-Komponente

**Files:**
- Create: `ev-database/src/components/calculator/ResultsPanel.jsx`
- Create: `ev-database/src/components/calculator/ResultsPanel.css`

- [ ] **Step 1: ResultsPanel.jsx erstellen**

```jsx
// ev-database/src/components/calculator/ResultsPanel.jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateTCO, buildYearlySeries, findBreakeven } from '../../utils/tcoCalculation'
import { TotalCostChart, MonthlyCostChart } from './CostChart'
import './ResultsPanel.css'

const TABS = ['monthly', 'total', 'breakeven']

export default function ResultsPanel({ vehicleA, paramsA, vehicleB, paramsB }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState('monthly')

  const years = Math.max(paramsA.jahre || 8, paramsB.jahre || 8)
  const tcoA = calculateTCO(vehicleA, paramsA, years)
  const tcoB = calculateTCO(vehicleB, paramsB, years)
  const seriesA = buildYearlySeries(vehicleA, paramsA, years)
  const seriesB = buildYearlySeries(vehicleB, paramsB, years)
  const breakevenYear = findBreakeven(vehicleA, paramsA, vehicleB, paramsB, years)

  const labelA = `${vehicleA.marke} ${vehicleA.modell}`
  const labelB = `${vehicleB.marke} ${vehicleB.modell}`

  const formatEur = (v) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

  const costKeys = ['kaufpreis', 'energie', 'wartung', 'versicherung', 'steuer', 'finanzierung', 'restwert']

  return (
    <div className="results-panel">
      <div className="results-tabs">
        <button className={tab === 'monthly' ? 'active' : ''} onClick={() => setTab('monthly')}>
          {t('calc.results.tabMonthly')}
        </button>
        <button className={tab === 'total' ? 'active' : ''} onClick={() => setTab('total')}>
          {t('calc.results.tabTotal')}
        </button>
        <button className={tab === 'breakeven' ? 'active' : ''} onClick={() => setTab('breakeven')}>
          {t('calc.results.tabBreakeven')}
        </button>
      </div>

      <div className="results-content">
        {tab === 'monthly' && (
          <div>
            <div className="results-summary">
              <div className="summary-card" style={{ borderColor: '#2563eb' }}>
                <div className="summary-label">{labelA}</div>
                <div className="summary-value">{formatEur(tcoA.monatlich)}/Monat</div>
              </div>
              <div className="summary-card" style={{ borderColor: '#dc2626' }}>
                <div className="summary-label">{labelB}</div>
                <div className="summary-value">{formatEur(tcoB.monatlich)}/Monat</div>
              </div>
            </div>
            <MonthlyCostChart tcoA={tcoA} tcoB={tcoB} labelA={labelA} labelB={labelB} years={years} />
          </div>
        )}

        {tab === 'total' && (
          <div>
            <TotalCostChart seriesA={seriesA} seriesB={seriesB} labelA={labelA} labelB={labelB} breakevenYear={breakevenYear} />
            <table className="cost-table">
              <thead>
                <tr><th>Kostenposition</th><th>{labelA}</th><th>{labelB}</th></tr>
              </thead>
              <tbody>
                {costKeys.map(key => (
                  <tr key={key}>
                    <td>{t(`calc.results.cost${key.charAt(0).toUpperCase() + key.slice(1)}`)}</td>
                    <td>{formatEur(tcoA[key])}</td>
                    <td>{formatEur(tcoB[key])}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>{t('calc.results.totalCost')}</strong></td>
                  <td><strong>{formatEur(tcoA.gesamt)}</strong></td>
                  <td><strong>{formatEur(tcoB.gesamt)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === 'breakeven' && (
          <div className="breakeven-section">
            {breakevenYear
              ? (
                <>
                  <div className="breakeven-badge">
                    {t('calc.results.breakevenAt', { years: breakevenYear })}
                  </div>
                  <p>{t('calc.results.cheaper', { name: labelA })}</p>
                </>
              )
              : (
                <div className="breakeven-badge no-breakeven">
                  {t('calc.results.noBreakeven')}
                </div>
              )
            }
            <TotalCostChart seriesA={seriesA} seriesB={seriesB} labelA={labelA} labelB={labelB} breakevenYear={breakevenYear} />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: ResultsPanel.css erstellen**

```css
/* ev-database/src/components/calculator/ResultsPanel.css */
.results-panel { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
.results-tabs { display: flex; border-bottom: 1px solid #e0e0e0; background: #f8f9fa; }
.results-tabs button { flex: 1; padding: 0.75rem; border: none; background: none; cursor: pointer; font-size: 0.9rem; color: #555; border-bottom: 2px solid transparent; }
.results-tabs button.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 600; }
.results-content { padding: 1.25rem; }
.results-summary { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
.summary-card { flex: 1; border-left: 4px solid; padding: 0.75rem 1rem; background: #f8f9fa; border-radius: 0 6px 6px 0; }
.summary-label { font-size: 0.85rem; color: #666; margin-bottom: 0.25rem; }
.summary-value { font-size: 1.3rem; font-weight: 700; }
.cost-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.88rem; }
.cost-table th, .cost-table td { padding: 0.5rem 0.75rem; text-align: right; border-bottom: 1px solid #eee; }
.cost-table th:first-child, .cost-table td:first-child { text-align: left; }
.cost-table th { background: #f8f9fa; font-weight: 600; }
.total-row td { border-top: 2px solid #ccc; }
.breakeven-section { display: flex; flex-direction: column; gap: 1rem; align-items: center; }
.breakeven-badge { font-size: 1.4rem; font-weight: 700; color: #16a34a; padding: 1rem 2rem; background: #f0fdf4; border-radius: 8px; text-align: center; }
.breakeven-badge.no-breakeven { color: #dc2626; background: #fef2f2; }
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/components/calculator/ResultsPanel.jsx ev-database/src/components/calculator/ResultsPanel.css
git commit -m "feat: ResultsPanel mit drei Tabs (Monatlich, Gesamtverlauf, Break-even)"
```

---

## Task 10: Calculator-Hauptseite

**Files:**
- Modify: `ev-database/src/pages/Calculator.jsx`
- Create: `ev-database/src/pages/Calculator.css`

- [ ] **Step 1: Calculator.jsx vollständig implementieren**

```jsx
// ev-database/src/pages/Calculator.jsx
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useTranslation } from 'react-i18next'
import UserModeToggle from '../components/calculator/UserModeToggle'
import VehicleSlot from '../components/calculator/VehicleSlot'
import ResultsPanel from '../components/calculator/ResultsPanel'
import { DEFAULT_PARAMS_NORMAL, DEFAULT_PARAMS_EXPERT } from '../utils/tcoCalculation'
import './Calculator.css'

export default function Calculator() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [compMode, setCompMode] = useState('ev-ice') // 'ev-ice' | 'ev-ev'
  const [expertMode, setExpertMode] = useState(false)
  const [vehicleA, setVehicleA] = useState(null)
  const [vehicleB, setVehicleB] = useState(null)
  const [paramsA, setParamsA] = useState({ ...DEFAULT_PARAMS_NORMAL })
  const [paramsB, setParamsB] = useState({ ...DEFAULT_PARAMS_NORMAL })

  // URL-Params: Fahrzeuge vorladen
  useEffect(() => {
    const ev1 = searchParams.get('ev1')
    const ev2 = searchParams.get('ev2')
    if (ev1) loadVehicle(ev1, 'ev_cars', setVehicleA)
    if (ev2) {
      setCompMode('ev-ev')
      loadVehicle(ev2, 'ev_cars', setVehicleB)
    }
  }, [])

  const loadVehicle = async (id, collection, setter) => {
    try {
      const snap = await getDoc(doc(db, collection, id))
      if (snap.exists()) setter({ id: snap.id, ...snap.data(), vehicleType: 'ev' })
    } catch (e) {
      console.error('Fahrzeug laden fehlgeschlagen:', e)
    }
  }

  const updateParamsA = (patch) => setParamsA(p => ({ ...p, ...patch }))
  const updateParamsB = (patch) => setParamsB(p => ({ ...p, ...patch }))

  const handleExpertMode = (on) => {
    setExpertMode(on)
    const defaults = on ? DEFAULT_PARAMS_EXPERT : DEFAULT_PARAMS_NORMAL
    setParamsA(p => ({ ...defaults, ...p }))
    setParamsB(p => ({ ...defaults, ...p }))
  }

  const handleCompMode = (mode) => {
    setCompMode(mode)
    setVehicleB(null)
    setParamsB({ ...DEFAULT_PARAMS_NORMAL })
  }

  const canShowResults = vehicleA && vehicleB

  return (
    <div className="calculator-page">
      <div className="calc-header">
        <h1>{t('calc.title')}</h1>
        <div className="calc-controls">
          <div className="comp-mode-toggle">
            <button className={compMode === 'ev-ice' ? 'active' : ''} onClick={() => handleCompMode('ev-ice')}>
              {t('calc.modeEvIce')}
            </button>
            <button className={compMode === 'ev-ev' ? 'active' : ''} onClick={() => handleCompMode('ev-ev')}>
              {t('calc.modeEvEv')}
            </button>
          </div>
          <UserModeToggle expertMode={expertMode} onChange={handleExpertMode} />
        </div>
      </div>

      <div className="calc-slots">
        <VehicleSlot
          label={t('calc.vehicleA')}
          type="ev"
          vehicle={vehicleA}
          params={paramsA}
          expertMode={expertMode}
          onVehicleChange={v => { setVehicleA(v); updateParamsA({ kaufpreis: v.basis_preis }) }}
          onParamsChange={updateParamsA}
        />
        <VehicleSlot
          label={t('calc.vehicleB')}
          type={compMode === 'ev-ev' ? 'ev' : 'ice'}
          vehicle={vehicleB}
          params={paramsB}
          expertMode={expertMode}
          onVehicleChange={v => { setVehicleB(v); updateParamsB({ kaufpreis: v.basis_preis }) }}
          onParamsChange={updateParamsB}
        />
      </div>

      {canShowResults
        ? <ResultsPanel vehicleA={vehicleA} paramsA={paramsA} vehicleB={vehicleB} paramsB={paramsB} />
        : <div className="calc-placeholder">{t('calc.selectBoth')}</div>
      }
    </div>
  )
}
```

- [ ] **Step 2: Calculator.css erstellen**

```css
/* ev-database/src/pages/Calculator.css */
.calculator-page { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem 3rem; display: flex; flex-direction: column; gap: 1.5rem; }
.calc-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.calc-header h1 { margin: 0; font-size: 1.5rem; }
.calc-controls { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
.comp-mode-toggle, .mode-toggle { display: flex; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
.comp-mode-toggle button, .mode-toggle button, .mode-btn {
  padding: 0.4rem 1rem; border: none; background: #f5f5f5; cursor: pointer; font-size: 0.88rem; color: #444;
}
.comp-mode-toggle button.active, .mode-toggle button.active, .mode-btn.active {
  background: #2563eb; color: #fff;
}
.calc-slots { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 700px) { .calc-slots { grid-template-columns: 1fr; } }
.calc-placeholder { text-align: center; padding: 2rem; color: #999; background: #f8f9fa; border-radius: 8px; border: 1px dashed #ddd; }
```

- [ ] **Step 3: Dev-Server prüfen**

```bash
cd ev-database && npm run dev
```

Browser: `http://localhost:5173/rechner` — Seite muss vollständig rendern. Zwei VehicleSlots wählen → ResultsPanel mit Tabs muss erscheinen.

- [ ] **Step 4: Commit**

```bash
git add ev-database/src/pages/Calculator.jsx ev-database/src/pages/Calculator.css
git commit -m "feat: Calculator-Hauptseite mit zwei Slots und ResultsPanel"
```

---

## Task 11: "In Rechner laden"-Button auf CarCard

**Files:**
- Modify: `ev-database/src/components/cars/CarCard.jsx`
- Modify: `ev-database/src/components/cars/CarCard.css`

- [ ] **Step 1: CarCard.jsx anpassen**

```jsx
// ev-database/src/components/cars/CarCard.jsx
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import './CarCard.css'

export default function CarCard({ car, fields, onClick }) {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language

  const visibleFields = [...fields]
    .filter(f => f.visible)
    .sort((a, b) => a.order - b.order)

  const formatValue = (key, value) => {
    if (value === undefined || value === null || value === '') return '–'
    if (['basis_preis', 'hoechster_preis'].includes(key))
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
    return value
  }

  const handleAddToCalculator = (e) => {
    e.stopPropagation()
    const existing = localStorage.getItem('calc_slot_a')
    if (!existing) {
      localStorage.setItem('calc_slot_a', car.id)
      navigate(`/rechner?ev1=${car.id}`)
    } else {
      navigate(`/rechner?ev1=${existing}&ev2=${car.id}`)
      localStorage.removeItem('calc_slot_a')
    }
  }

  return (
    <div className="car-card" onClick={onClick}>
      <div className="car-card-title">{car.marke} {car.modell}</div>
      {visibleFields.map(f => (
        <div key={f.key} className="car-field">
          <span className="car-field-label">
            {lang === 'de' ? f.label_de : f.label_en}
          </span>
          <span className="car-field-value">{formatValue(f.key, car[f.key])}</span>
        </div>
      ))}
      <button className="calc-btn" onClick={handleAddToCalculator}>
        {t('calc.addToCalculator')}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Button-Styling in CarCard.css hinzufügen**

Am Ende von `src/components/cars/CarCard.css` einfügen:

```css
.calc-btn {
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.4rem 0;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  transition: background 0.15s;
}
.calc-btn:hover { background: #1d4ed8; }
```

- [ ] **Step 3: Verhalten testen**

Dev-Server starten, auf einer Fahrzeugkarte "In Rechner laden" klicken → muss zu `/rechner?ev1=<id>` navigieren. Zweite Karte klicken → muss zu `/rechner?ev1=<id1>&ev2=<id2>` navigieren.

- [ ] **Step 4: Commit**

```bash
git add ev-database/src/components/cars/CarCard.jsx ev-database/src/components/cars/CarCard.css
git commit -m "feat: 'In Rechner laden'-Button auf Fahrzeugkarte"
```

---

## Task 12: CostChart monatliche Kosten korrigieren

Der `MonthlyCostChart` in Task 8 hat einen Platzhalter für `years`. Der Wert muss aus den TCO-Daten korrekt abgeleitet werden.

**Files:**
- Modify: `ev-database/src/components/calculator/CostChart.jsx`

- [ ] **Step 1: MonthlyCostChart years-Prop hinzufügen und Berechnung korrigieren**

In `CostChart.jsx` die `MonthlyCostChart`-Funktion ersetzen:

```jsx
export function MonthlyCostChart({ tcoA, tcoB, labelA, labelB, years }) {
  const categories = ['kaufpreis', 'energie', 'wartung', 'versicherung', 'steuer', 'finanzierung']
  const months = years * 12

  const data = categories.map(key => ({
    name: key,
    [labelA]: Math.round((tcoA[key] || 0) / months),
    [labelB]: Math.round((tcoB[key] || 0) / months),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `${v}€`} />
        <Tooltip formatter={(v) => formatEur(v)} />
        <Legend />
        <Bar dataKey={labelA} fill={COLOR_A} />
        <Bar dataKey={labelB} fill={COLOR_B} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: years-Prop in ResultsPanel an MonthlyCostChart übergeben**

In `ResultsPanel.jsx` die Zeile mit `<MonthlyCostChart` anpassen:

```jsx
<MonthlyCostChart tcoA={tcoA} tcoB={tcoB} labelA={labelA} labelB={labelB} years={years} />
```

- [ ] **Step 3: Commit**

```bash
git add ev-database/src/components/calculator/CostChart.jsx ev-database/src/components/calculator/ResultsPanel.jsx
git commit -m "fix: MonthlyCostChart monatliche Kosten korrekt berechnen"
```

---

## Task 13: Obsidian-Wiki aktualisieren

- [ ] **Step 1: Brain/log.md Eintrag hinzufügen**

```
## [2026-04-19] task | Wirtschaftlichkeitsrechner implementiert (TCO, EV vs ICE, EV vs EV)
```

- [ ] **Step 2: Brain/wiki/projects/ev-vergleich.md aktualisieren**

Abschnitt "Offene Fragen" durch neue Einträge ergänzen:
- Wirtschaftlichkeitsrechner: Route `/rechner`, zwei Modi (EV vs ICE, EV vs EV), Normal/Experten-Modus, Recharts

- [ ] **Step 3: Commit**

```bash
git add Brain/log.md Brain/wiki/projects/ev-vergleich.md
git commit -m "docs: Obsidian-Wiki nach Wirtschaftlichkeitsrechner aktualisiert"
```
