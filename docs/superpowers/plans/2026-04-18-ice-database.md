# ICE-Datenbank Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verbrenner-Fahrzeuge (ICE) in die bestehende ev-database-App integrieren — mit öffentlichem Navigation-Wechsel und Admin-Verwaltung.

**Architecture:** Neue Firestore-Collection `ice_cars`. Gemeinsame Komponenten (CarForm, CarImport, AdminPanel) werden props-basiert generalisiert statt hardgekoppelt. Eine zentrale `fields.js`-Config steuert welche Felder pro Fahrzeugtyp genutzt werden.

**Tech Stack:** React, Vite, Firebase Firestore, react-router-dom, react-i18next

**Kein Test-Setup vorhanden** — keine Test-Schritte, stattdessen manuelle Verifikation im Browser nach jedem Task.

---

## File Map

| Aktion | Pfad | Zweck |
|---|---|---|
| Create | `src/config/fields.js` | EV_FIELDS und ICE_FIELDS Arrays |
| Create | `src/firebase/ice-cars.js` | Firebase CRUD für ice_cars Collection |
| Modify | `src/hooks/useCars.js` | useCarsCollection(name) generalisieren |
| Modify | `src/components/admin/CarForm.jsx` | fields als Prop statt hardcodiert |
| Modify | `src/components/admin/CarImport.jsx` | fields, importFn, transformFn als Props |
| Modify | `src/components/admin/AdminPanel.jsx` | cars, formFields, importFn, deleteFn, summaryKeys, showFieldSettings als Props |
| Modify | `src/pages/AdminPage.jsx` | EV/ICE Tab-Switcher, Props-Weitergabe |
| Modify | `src/pages/HomePage.jsx` | EV_FIELDS aus config nutzen |
| Create | `src/pages/IceHomePage.jsx` | Öffentliche Verbrenner-Übersicht |
| Modify | `src/components/layout/TopNav.jsx` | Zwei Nav-Links: E-Fahrzeuge + Verbrenner |
| Modify | `src/App.jsx` | Route /verbrenner hinzufügen |
| Modify | `src/i18n/de.json` | Neue i18n-Strings |
| Modify | `src/i18n/en.json` | Neue i18n-Strings |

---

## Task 1: Feld-Konfiguration anlegen

**Files:**
- Create: `src/config/fields.js`

- [ ] **Schritt 1: Datei anlegen**

```js
export const EV_FIELDS = [
  { key: 'marke', label: 'Marke', type: 'text' },
  { key: 'modell', label: 'Modell', type: 'text' },
  { key: 'batterie_netto', label: 'Batterie Netto (kWh)', type: 'number' },
  { key: 'laden_10_80_min', label: '10%–80% (min)', type: 'number' },
  { key: 'kwh_nach_70', label: 'kWh nach 70% (berechnet)', type: 'number', calc: true },
  { key: 'kwh_pro_min', label: 'kWh/min (berechnet)', type: 'number', calc: true },
  { key: 'max_ladeleistung', label: 'Max. Ladeleistung (kW)', type: 'number' },
  { key: 'anhaengelast', label: 'Anhängelast (kg)', type: 'number' },
  { key: 'wltp_reichweite', label: 'WLTP Reichweite (km)', type: 'number' },
  { key: 'wltp_verbrauch', label: 'WLTP Verbrauch (kWh/100km)', type: 'number' },
  { key: 'basis_preis', label: 'Basispreis (€)', type: 'number' },
  { key: 'hoechster_preis', label: 'Höchster Preis (€)', type: 'number' },
  { key: 'null_hundert', label: '0–100 (s)', type: 'number' },
  { key: 'ps', label: 'PS', type: 'number' },
  { key: 'top_speed', label: 'Top Speed (km/h)', type: 'number' },
  { key: 'volt', label: 'Volt', type: 'number' },
  { key: 'markteinfuehrung', label: 'Markteinführung', type: 'text' },
]

export const ICE_FIELDS = [
  { key: 'marke', label: 'Marke', type: 'text' },
  { key: 'modell', label: 'Modell', type: 'text' },
  { key: 'kraftstoff', label: 'Kraftstoff', type: 'text' },
  { key: 'hubraum_ccm', label: 'Hubraum (ccm)', type: 'number' },
  { key: 'zylinder', label: 'Zylinder', type: 'number' },
  { key: 'getriebe', label: 'Getriebe', type: 'text' },
  { key: 'ps', label: 'PS', type: 'number' },
  { key: 'null_hundert', label: '0–100 (s)', type: 'number' },
  { key: 'top_speed', label: 'Top Speed (km/h)', type: 'number' },
  { key: 'verbrauch_l100km', label: 'Verbrauch (l/100km)', type: 'number' },
  { key: 'co2_g_km', label: 'CO₂ (g/km)', type: 'number' },
  { key: 'anhaengelast', label: 'Anhängelast (kg)', type: 'number' },
  { key: 'basis_preis', label: 'Basispreis (€)', type: 'number' },
  { key: 'hoechster_preis', label: 'Höchster Preis (€)', type: 'number' },
  { key: 'markteinfuehrung', label: 'Markteinführung', type: 'text' },
]
```

- [ ] **Schritt 2: Committen**

```bash
git add src/config/fields.js
git commit -m "feat: EV_FIELDS und ICE_FIELDS Konfiguration"
```

---

## Task 2: Firebase-Funktionen für ICE anlegen

**Files:**
- Create: `src/firebase/ice-cars.js`

- [ ] **Schritt 1: Datei anlegen**

```js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch
} from 'firebase/firestore'
import { db } from './config'

const carsRef = () => collection(db, 'ice_cars')

export const subscribeToIceCars = (callback) =>
  onSnapshot(query(carsRef(), orderBy('marke')), (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

export const addIceCar = (data) => addDoc(carsRef(), data)
export const updateIceCar = (id, data) => updateDoc(doc(carsRef(), id), data)
export const deleteIceCar = (id) => deleteDoc(doc(carsRef(), id))

export const importIceCars = async (cars) => {
  const batch = writeBatch(db)
  cars.forEach(car => batch.set(doc(carsRef()), car))
  return batch.commit()
}
```

- [ ] **Schritt 2: Committen**

```bash
git add src/firebase/ice-cars.js
git commit -m "feat: Firebase-Funktionen für ice_cars Collection"
```

---

## Task 3: useCars-Hook generalisieren

**Files:**
- Modify: `src/hooks/useCars.js`

- [ ] **Schritt 1: Hook ersetzen**

Vollständiger neuer Inhalt von `src/hooks/useCars.js`:

```js
import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useCarsCollection(collectionName) {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, collectionName), orderBy('marke')),
      (snap) => {
        setCars(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }
    )
    return unsub
  }, [collectionName])

  return { cars, loading }
}

export function useCars() {
  return useCarsCollection('ev_cars')
}
```

- [ ] **Schritt 2: Committen**

```bash
git add src/hooks/useCars.js
git commit -m "refactor: useCarsCollection(name) generalisieren, useCars() als Wrapper"
```

---

## Task 4: CarForm generalisieren

**Files:**
- Modify: `src/components/admin/CarForm.jsx`

CarForm erhält `fields` als Prop statt das hardcodierte `FIELDS`-Array.

- [ ] **Schritt 1: CarForm.jsx ersetzen**

Vollständiger neuer Inhalt:

```jsx
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { addCar, updateCar } from '../../firebase/cars'
import { applyCalculations } from '../../utils/calculations'
import './CarForm.css'

const emptyForm = (fields) => Object.fromEntries(fields.map(f => [f.key, '']))

export default function CarForm({ fields, addFn, updateFn, car, onDone }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(car ? { ...car } : emptyForm(fields))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const hasCalcFields = fields.some(f => f.calc)
    if (!hasCalcFields) return
    const updated = applyCalculations({
      batterie_netto: parseFloat(form.batterie_netto) || 0,
      laden_10_80_min: parseFloat(form.laden_10_80_min) || 0,
    })
    setForm(prev => ({ ...prev, kwh_nach_70: updated.kwh_nach_70, kwh_pro_min: updated.kwh_pro_min }))
  }, [form.batterie_netto, form.laden_10_80_min, fields])

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = {}
    fields.forEach(f => {
      data[f.key] = f.type === 'number' ? (parseFloat(form[f.key]) || 0) : (form[f.key] || '')
    })
    try {
      if (car?.id) await updateFn(car.id, data)
      else await addFn(data)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="car-form" onSubmit={handleSubmit}>
      <h2>{car ? 'Fahrzeug bearbeiten' : 'Fahrzeug hinzufügen'}</h2>
      <div className="form-grid">
        {fields.map(f => (
          <div key={f.key} className="form-group">
            <label>{f.label}</label>
            <input
              type={f.type}
              value={form[f.key] ?? ''}
              readOnly={f.calc}
              onChange={e => !f.calc && handleChange(f.key, e.target.value)}
              step={f.type === 'number' ? 'any' : undefined}
            />
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? t('admin.saving') : t('admin.save')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          {t('admin.cancel')}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Schritt 2: Committen**

```bash
git add src/components/admin/CarForm.jsx
git commit -m "refactor: CarForm akzeptiert fields, addFn, updateFn als Props"
```

---

## Task 5: CarImport generalisieren

**Files:**
- Modify: `src/components/admin/CarImport.jsx`

CarImport erhält `fields`, `importFn` und `transformFn` als Props. `fields` ersetzt das hardcodierte `DB_FIELDS`-Array. `importFn` ersetzt den direkten `importCars`-Import. `transformFn` wird auf jede Zeile angewendet (für EV: `applyCalculations`, für ICE: identity).

- [ ] **Schritt 1: CarImport.jsx ersetzen**

Vollständiger neuer Inhalt:

```jsx
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import './CarImport.css'

const autoMatch = (colName, fields) => {
  const lower = colName.toLowerCase().replace(/\s/g, '_')
  const found = fields.find(f => f.key && (f.key === lower || f.label.toLowerCase().replace(/\s/g, '_') === lower))
  return found?.key || ''
}

export default function CarImport({ fields, importFn, transformFn = (c) => c, onDone }) {
  const { t } = useTranslation()
  const [columns, setColumns] = useState([])
  const [mapping, setMapping] = useState({})
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)

  const dbFields = [{ key: '', label: '— ignorieren —' }, ...fields.filter(f => !f.calc)]
  const numKeys = fields.filter(f => f.type === 'number' && !f.calc).map(f => f.key)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
      const headers = data[0] || []
      const dataRows = data.slice(1).filter(r => r.some(c => c !== undefined && c !== ''))
      setColumns(headers)
      setRows(dataRows)
      const autoMap = {}
      headers.forEach(h => { autoMap[h] = autoMatch(String(h), fields) })
      setMapping(autoMap)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    setSaving(true)
    const cars = rows.map(row => {
      const car = {}
      columns.forEach((col, i) => {
        const dbKey = mapping[col]
        if (!dbKey) return
        const val = row[i]
        car[dbKey] = numKeys.includes(dbKey) ? (parseFloat(val) || 0) : (String(val || ''))
      })
      return transformFn(car)
    }).filter(c => c.marke || c.modell)
    try {
      await importFn(cars)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="car-import">
      <h2>{t('admin.importVehicles')}</h2>
      <div className="import-upload">
        <label>{t('admin.importFile')}</label>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
      </div>

      {columns.length > 0 && (
        <>
          <h3 style={{ marginBottom: '0.75rem' }}>{t('admin.importMapping')}</h3>
          <table className="mapping-table">
            <thead>
              <tr><th>Spalte in Datei</th><th>Feld in DB</th></tr>
            </thead>
            <tbody>
              {columns.map(col => (
                <tr key={col}>
                  <td>{col}</td>
                  <td>
                    <select value={mapping[col] || ''} onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}>
                      {dbFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginBottom: '0.75rem' }}>{t('admin.importPreview')}</h3>
          <table className="preview-table">
            <thead>
              <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, i) => (
                <tr key={i}>{columns.map((c, j) => <td key={j}>{row[j] ?? ''}</td>)}</tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleImport} disabled={saving}>
              {saving ? t('admin.saving') : `${t('admin.importConfirm')} (${rows.length} Fahrzeuge)`}
            </button>
            <button className="btn btn-secondary" onClick={onDone}>{t('admin.cancel')}</button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Schritt 2: Committen**

```bash
git add src/components/admin/CarImport.jsx
git commit -m "refactor: CarImport akzeptiert fields, importFn, transformFn als Props"
```

---

## Task 6: AdminPanel generalisieren

**Files:**
- Modify: `src/components/admin/AdminPanel.jsx`

AdminPanel erhält `cars`, `formFields`, `addFn`, `updateFn`, `deleteFn`, `importFn`, `transformFn`, `summaryKeys`, `showFieldSettings` als Props. Der interne `useCars()`-Aufruf entfällt — `cars` kommt von außen.

`summaryKeys` ist ein Array von zwei Feld-Keys die in der Tabelle (neben Marke/Modell) angezeigt werden. Die Labels werden aus `formFields` abgeleitet.

- [ ] **Schritt 1: AdminPanel.jsx ersetzen**

Vollständiger neuer Inhalt:

```jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../hooks/useSettings'
import { saveSettings } from '../../firebase/settings'
import CarForm from './CarForm'
import CarImport from './CarImport'
import FieldToggle from './FieldToggle'
import './AdminPanel.css'

const EV_DEFAULT_FIELDS = [
  { key: 'marke', label_de: 'Marke', label_en: 'Brand', visible: true, order: 0 },
  { key: 'modell', label_de: 'Modell', label_en: 'Model', visible: true, order: 1 },
  { key: 'batterie_netto', label_de: 'Batterie Netto', label_en: 'Battery Net', visible: true, order: 2 },
  { key: 'laden_10_80_min', label_de: '10%–80% (min)', label_en: '10%–80% (min)', visible: true, order: 3 },
  { key: 'kwh_nach_70', label_de: 'kWh nach 70%', label_en: 'kWh after 70%', visible: true, order: 4 },
  { key: 'kwh_pro_min', label_de: 'kWh/min', label_en: 'kWh/min', visible: true, order: 5 },
  { key: 'max_ladeleistung', label_de: 'Max. Ladeleistung', label_en: 'Max. Charge Power', visible: true, order: 6 },
  { key: 'anhaengelast', label_de: 'Anhängelast', label_en: 'Towing Capacity', visible: false, order: 7 },
  { key: 'wltp_reichweite', label_de: 'WLTP Reichweite', label_en: 'WLTP Range', visible: true, order: 8 },
  { key: 'wltp_verbrauch', label_de: 'WLTP Verbrauch', label_en: 'WLTP Consumption', visible: false, order: 9 },
  { key: 'basis_preis', label_de: 'Basispreis', label_en: 'Base Price', visible: true, order: 10 },
  { key: 'hoechster_preis', label_de: 'Höchster Preis', label_en: 'Max Price', visible: false, order: 11 },
  { key: 'null_hundert', label_de: '0–100 (s)', label_en: '0–100 (s)', visible: true, order: 12 },
  { key: 'ps', label_de: 'PS', label_en: 'HP', visible: false, order: 13 },
  { key: 'top_speed', label_de: 'Top Speed', label_en: 'Top Speed', visible: false, order: 14 },
  { key: 'volt', label_de: 'Volt', label_en: 'Volt', visible: false, order: 15 },
  { key: 'markteinfuehrung', label_de: 'Markteinführung', label_en: 'Market Launch', visible: false, order: 16 },
]

export default function AdminPanel({
  cars,
  formFields,
  addFn,
  updateFn,
  deleteFn,
  importFn,
  transformFn,
  summaryKeys,
  showFieldSettings = false,
}) {
  const { t } = useTranslation()
  const { fields } = useSettings()
  const [tab, setTab] = useState('vehicles')
  const [view, setView] = useState('list')
  const [editCar, setEditCar] = useState(null)

  const summaryLabels = summaryKeys.map(key => {
    const field = formFields.find(f => f.key === key)
    return { key, label: field?.label || key }
  })

  const handleSeedFields = async () => {
    await saveSettings(EV_DEFAULT_FIELDS)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.deleteConfirm'))) return
    await deleteFn(id)
  }

  return (
    <div className="admin-panel">
      <h1>{t('admin.title')}</h1>
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'vehicles' ? 'active' : ''}`} onClick={() => { setTab('vehicles'); setView('list') }}>
          {t('admin.vehicles')} ({cars.length})
        </button>
        {showFieldSettings && (
          <button className={`admin-tab ${tab === 'fields' ? 'active' : ''}`} onClick={() => setTab('fields')}>
            {t('admin.fields')}
          </button>
        )}
      </div>

      {tab === 'vehicles' && (
        <>
          {view === 'list' && (
            <>
              <div className="admin-actions">
                <button className="btn btn-primary" onClick={() => setView('add')}>{t('admin.addVehicle')}</button>
                <button className="btn btn-secondary" onClick={() => setView('import')}>{t('admin.importVehicles')}</button>
              </div>
              <table className="car-table">
                <thead>
                  <tr>
                    <th>{t('admin.tableMake')}</th>
                    <th>{t('admin.tableModel')}</th>
                    {summaryLabels.map(s => <th key={s.key}>{s.label}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map(car => (
                    <tr key={car.id}>
                      <td>{car.marke}</td>
                      <td>{car.modell}</td>
                      {summaryLabels.map(s => (
                        <td key={s.key}>{car[s.key] ?? '–'}</td>
                      ))}
                      <td>
                        <button className="btn btn-secondary btn-small car-table-edit"
                          onClick={() => { setEditCar(car); setView('edit') }}>
                          {t('admin.edit')}
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDelete(car.id)}>
                          {t('admin.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {(view === 'add' || view === 'edit') && (
            <CarForm
              fields={formFields}
              addFn={addFn}
              updateFn={updateFn}
              car={view === 'edit' ? editCar : null}
              onDone={() => { setView('list'); setEditCar(null) }}
            />
          )}
          {view === 'import' && (
            <CarImport
              fields={formFields}
              importFn={importFn}
              transformFn={transformFn}
              onDone={() => setView('list')}
            />
          )}
        </>
      )}

      {showFieldSettings && tab === 'fields' && fields.length === 0 && (
        <div className="seed-prompt">
          <p>Konfiguration noch nicht angelegt.</p>
          <button className="btn btn-primary" onClick={handleSeedFields}>Standard-Felder anlegen</button>
        </div>
      )}
      {showFieldSettings && tab === 'fields' && fields.length > 0 && <FieldToggle fields={fields} />}
    </div>
  )
}
```

- [ ] **Schritt 2: Committen**

```bash
git add src/components/admin/AdminPanel.jsx
git commit -m "refactor: AdminPanel props-basiert (cars, formFields, Firebase-Fns, summaryKeys)"
```

---

## Task 7: AdminPage mit EV/ICE Tab-Switcher

**Files:**
- Modify: `src/pages/AdminPage.jsx`

AdminPage verwaltet den aktiven Typ (EV/ICE) und übergibt die passenden Props an AdminPanel.

- [ ] **Schritt 1: AdminPage.jsx ersetzen**

Vollständiger neuer Inhalt:

```jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { logout } from '../firebase/auth'
import { useCarsCollection } from '../hooks/useCars'
import { addCar, updateCar, deleteCar, importCars } from '../firebase/cars'
import { addIceCar, updateIceCar, deleteIceCar, importIceCars } from '../firebase/ice-cars'
import { applyCalculations } from '../utils/calculations'
import { EV_FIELDS, ICE_FIELDS } from '../config/fields'
import AdminPanel from '../components/admin/AdminPanel'
import './AdminPage.css'

const EV_CONFIG = {
  collectionName: 'ev_cars',
  formFields: EV_FIELDS,
  addFn: addCar,
  updateFn: updateCar,
  deleteFn: deleteCar,
  importFn: importCars,
  transformFn: applyCalculations,
  summaryKeys: ['batterie_netto', 'basis_preis'],
  showFieldSettings: true,
}

const ICE_CONFIG = {
  collectionName: 'ice_cars',
  formFields: ICE_FIELDS,
  addFn: addIceCar,
  updateFn: updateIceCar,
  deleteFn: deleteIceCar,
  importFn: importIceCars,
  transformFn: (car) => car,
  summaryKeys: ['kraftstoff', 'basis_preis'],
  showFieldSettings: false,
}

function AdminContent({ config }) {
  const { cars } = useCarsCollection(config.collectionName)
  return (
    <AdminPanel
      cars={cars}
      formFields={config.formFields}
      addFn={config.addFn}
      updateFn={config.updateFn}
      deleteFn={config.deleteFn}
      importFn={config.importFn}
      transformFn={config.transformFn}
      summaryKeys={config.summaryKeys}
      showFieldSettings={config.showFieldSettings}
    />
  )
}

export default function AdminPage() {
  const { t } = useTranslation()
  const [type, setType] = useState('ev')

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-type-tabs">
          <button
            className={`admin-tab ${type === 'ev' ? 'active' : ''}`}
            onClick={() => setType('ev')}
          >
            {t('nav.evDatabase')}
          </button>
          <button
            className={`admin-tab ${type === 'ice' ? 'active' : ''}`}
            onClick={() => setType('ice')}
          >
            {t('nav.iceDatabase')}
          </button>
        </div>
        <button className="btn btn-secondary btn-small admin-logout" onClick={logout}>
          {t('admin.logout')}
        </button>
      </div>
      <AdminContent key={type} config={type === 'ev' ? EV_CONFIG : ICE_CONFIG} />
    </div>
  )
}
```

- [ ] **Schritt 2: CSS in `src/pages/AdminPage.css` anpassen**

Die bestehende `.admin-header`-Regel hat `justify-content: flex-end` — auf `space-between` ändern und `.admin-type-tabs` ergänzen.

Vollständiger neuer Inhalt von `src/pages/AdminPage.css`:

```css
.admin-page { min-height: calc(100vh - 56px); }
.admin-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1.5rem;
  background: white; border-bottom: 1px solid #eee;
}
.admin-logout { border: 1px solid #ddd; background: white; }
.admin-type-tabs { display: flex; gap: 0.5rem; }
```

- [ ] **Schritt 3: Committen**

```bash
git add src/pages/AdminPage.jsx src/pages/AdminPage.css
git commit -m "feat: AdminPage mit EV/ICE Tab-Switcher"
```

---

## Task 8: HomePage auf EV_FIELDS umstellen

**Files:**
- Modify: `src/pages/HomePage.jsx`

HomePage importiert EV_FIELDS aus `fields.js` und übergibt sie an CarGrid/CarList anstelle der bisher von useSettings gelieferten Felder (die Einstellungsfelder bleiben für die Sichtbarkeits-Konfiguration zuständig).

Hinweis: `useSettings` liefert die sichtbaren Felder für die Cards. Das bleibt unverändert — EV_FIELDS wird hier nicht direkt verwendet, da HomePage bereits `useSettings` nutzt. **Kein Handlungsbedarf** — HomePage funktioniert weiterhin unverändert, da `useCars()` bereits auf `ev_cars` zeigt.

- [ ] **Schritt 1: Sicherstellen dass HomePage unverändert kompiliert**

```bash
cd ev-database && npm run build 2>&1 | tail -20
```

Erwartetes Ergebnis: Build erfolgreich, keine Fehler.

- [ ] **Schritt 2: Committen (falls keine Änderung nötig)**

```bash
git commit --allow-empty -m "chore: HomePage unverändert — useCars() zeigt bereits auf ev_cars"
```

---

## Task 9: IceHomePage anlegen

**Files:**
- Create: `src/pages/IceHomePage.jsx`

Öffentliche Übersicht für Verbrenner — identische Struktur wie `HomePage`, nutzt `useCarsCollection('ice_cars')` und `ICE_FIELDS`.

- [ ] **Schritt 1: IceHomePage.jsx anlegen**

```jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCarsCollection } from '../hooks/useCars'
import { ICE_FIELDS } from '../config/fields'
import ViewToggle from '../components/cars/ViewToggle'
import CarGrid from '../components/cars/CarGrid'
import CarList from '../components/cars/CarList'
import CarDetail from '../components/cars/CarDetail'
import './HomePage.css'

const ICE_SETTINGS = ICE_FIELDS.map((f, i) => ({
  key: f.key,
  label_de: f.label,
  label_en: f.label,
  visible: i < 6,
  order: i,
}))

export default function IceHomePage() {
  const { t } = useTranslation()
  const { cars, loading } = useCarsCollection('ice_cars')

  const [view, setView] = useState(() => localStorage.getItem('ice-view') || 'grid')
  const [size, setSize] = useState(() => localStorage.getItem('ice-gridSize') || 'medium')
  const [selectedCar, setSelectedCar] = useState(null)

  const handleSetView = (v) => { setView(v); localStorage.setItem('ice-view', v) }
  const handleSetSize = (s) => { setSize(s); localStorage.setItem('ice-gridSize', s) }

  if (loading) return <div className="home-page"><p className="home-loading">{t('home.loading')}</p></div>

  return (
    <div className="home-page">
      <h1>{t('home.iceTitle')}</h1>
      <ViewToggle view={view} setView={handleSetView} size={size} setSize={handleSetSize} />
      {cars.length === 0
        ? <p className="home-empty">{t('home.noCars')}</p>
        : view === 'grid'
          ? <CarGrid cars={cars} fields={ICE_SETTINGS} size={size} onCarClick={setSelectedCar} />
          : <CarList cars={cars} fields={ICE_SETTINGS} onCarClick={setSelectedCar} />
      }
      {selectedCar && <CarDetail car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  )
}
```

- [ ] **Schritt 2: Committen**

```bash
git add src/pages/IceHomePage.jsx
git commit -m "feat: IceHomePage — öffentliche Verbrenner-Übersicht"
```

---

## Task 10: i18n-Strings ergänzen

**Files:**
- Modify: `src/i18n/de.json`
- Modify: `src/i18n/en.json`

- [ ] **Schritt 1: de.json aktualisieren**

In `de.json` die folgenden Keys ergänzen:

Im `"nav"`-Objekt:
```json
"iceDatabase": "Verbrenner"
```

Im `"home"`-Objekt:
```json
"iceTitle": "Verbrenner-Datenbank"
```

Vollständiges `de.json` nach der Änderung:

```json
{
  "nav": {
    "evDatabase": "E-Fahrzeuge",
    "iceDatabase": "Verbrenner",
    "admin": "Admin"
  },
  "home": {
    "title": "Elektroauto-Datenbank",
    "iceTitle": "Verbrenner-Datenbank",
    "loading": "Lädt...",
    "noCars": "Keine Fahrzeuge gefunden."
  },
  "viewToggle": {
    "grid": "Raster",
    "list": "Liste",
    "small": "Klein",
    "medium": "Mittel",
    "large": "Groß"
  },
  "admin": {
    "title": "Admin-Bereich",
    "vehicles": "Fahrzeuge",
    "fields": "Kartenfelder",
    "addVehicle": "Fahrzeug hinzufügen",
    "importVehicles": "Importieren",
    "edit": "Bearbeiten",
    "delete": "Löschen",
    "deleteConfirm": "Fahrzeug wirklich löschen?",
    "save": "Speichern",
    "cancel": "Abbrechen",
    "saving": "Speichert...",
    "importFile": "Excel / CSV hochladen",
    "importMapping": "Spalten zuordnen",
    "importPreview": "Vorschau (erste 5 Zeilen)",
    "importConfirm": "Importieren",
    "fieldVisible": "Sichtbar",
    "fieldHidden": "Ausgeblendet",
    "logout": "Abmelden",
    "tableMake": "Marke",
    "tableModel": "Modell",
    "tableBattery": "Batterie",
    "tablePrice": "Preis"
  },
  "login": {
    "title": "Admin Login",
    "email": "E-Mail",
    "password": "Passwort",
    "submit": "Anmelden",
    "error": "Ungültige Anmeldedaten"
  },
  "detail": {
    "title": "Fahrzeugdetails",
    "close": "Schließen",
    "comingSoon": "Weitere Details folgen."
  }
}
```

- [ ] **Schritt 2: en.json aktualisieren**

Vollständiges `en.json` nach der Änderung:

```json
{
  "nav": {
    "evDatabase": "E-Vehicles",
    "iceDatabase": "ICE Vehicles",
    "admin": "Admin"
  },
  "home": {
    "title": "Electric Car Database",
    "iceTitle": "ICE Vehicle Database",
    "loading": "Loading...",
    "noCars": "No vehicles found."
  },
  "viewToggle": {
    "grid": "Grid",
    "list": "List",
    "small": "Small",
    "medium": "Medium",
    "large": "Large"
  },
  "admin": {
    "title": "Admin Panel",
    "vehicles": "Vehicles",
    "fields": "Card Fields",
    "addVehicle": "Add Vehicle",
    "importVehicles": "Import",
    "edit": "Edit",
    "delete": "Delete",
    "deleteConfirm": "Really delete this vehicle?",
    "save": "Save",
    "cancel": "Cancel",
    "saving": "Saving...",
    "importFile": "Upload Excel / CSV",
    "importMapping": "Map Columns",
    "importPreview": "Preview (first 5 rows)",
    "importConfirm": "Import",
    "fieldVisible": "Visible",
    "fieldHidden": "Hidden",
    "logout": "Logout",
    "tableMake": "Make",
    "tableModel": "Model",
    "tableBattery": "Battery",
    "tablePrice": "Price"
  },
  "login": {
    "title": "Admin Login",
    "email": "Email",
    "password": "Password",
    "submit": "Sign In",
    "error": "Invalid credentials"
  },
  "detail": {
    "title": "Vehicle Details",
    "close": "Close",
    "comingSoon": "More details coming soon."
  }
}
```

- [ ] **Schritt 3: Committen**

```bash
git add src/i18n/de.json src/i18n/en.json
git commit -m "feat: i18n-Strings für ICE-Navigation und Seitentitel"
```

---

## Task 11: TopNav aktualisieren

**Files:**
- Modify: `src/components/layout/TopNav.jsx`

Zwei NavLinks in `nav-links`: "E-Fahrzeuge" und "Verbrenner".

- [ ] **Schritt 1: TopNav.jsx ersetzen**

Vollständiger neuer Inhalt:

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

Hinweis: `end` auf dem `/`-Link ist wichtig — ohne es würde `/` auch bei `/verbrenner` als aktiv markiert.

- [ ] **Schritt 2: Committen**

```bash
git add src/components/layout/TopNav.jsx
git commit -m "feat: TopNav mit E-Fahrzeuge/Verbrenner Navigation"
```

---

## Task 12: App.jsx — Route /verbrenner hinzufügen

**Files:**
- Modify: `src/App.jsx`

- [ ] **Schritt 1: App.jsx ersetzen**

Vollständiger neuer Inhalt:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import TopNav from './components/layout/TopNav'
import HomePage from './pages/HomePage'
import IceHomePage from './pages/IceHomePage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'

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
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute><AdminPage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Schritt 2: Build prüfen**

```bash
cd ev-database && npm run build 2>&1 | tail -30
```

Erwartetes Ergebnis: Build erfolgreich, keine TypeScript/JSX-Fehler.

- [ ] **Schritt 3: Committen**

```bash
git add src/App.jsx
git commit -m "feat: Route /verbrenner für IceHomePage"
```

---

## Task 13: Manuelle Verifikation

- [ ] **Dev-Server starten**

```bash
cd ev-database && npm run dev
```

- [ ] **Checkliste im Browser (http://localhost:5173)**

1. TopNav zeigt "E-Fahrzeuge" und "Verbrenner" Links
2. `/` zeigt EV-Datenbank wie bisher
3. `/verbrenner` zeigt "Verbrenner-Datenbank" Titel, leere Liste (noch keine Daten)
4. Als Admin einloggen → `/admin` zeigt zwei Tabs: "E-Fahrzeuge" / "Verbrenner"
5. Im EV-Tab: Fahrzeuge bearbeiten funktioniert wie bisher
6. Im Verbrenner-Tab: Fahrzeug hinzufügen — Formular zeigt ICE-Felder (Kraftstoff, Hubraum, etc.)
7. Verbrenner-Fahrzeug speichern → erscheint auf `/verbrenner`
8. Verbrenner-Fahrzeug bearbeiten und löschen funktioniert
9. "Kartenfelder"-Tab erscheint nur im EV-Admin-Tab, nicht im Verbrenner-Tab

- [ ] **Abschluss-Commit**

```bash
git add -A
git commit -m "feat: ICE-Datenbank vollständig integriert"
```
