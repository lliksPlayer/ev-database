import { useState } from 'react'
import * as XLSX from 'xlsx'
import { useTranslation } from 'react-i18next'
import { importCars } from '../../firebase/cars'
import { applyCalculations } from '../../utils/calculations'
import './CarImport.css'

const DB_FIELDS = [
  { key: '', label: '— ignorieren —' },
  { key: 'marke', label: 'Marke' },
  { key: 'modell', label: 'Modell' },
  { key: 'batterie_netto', label: 'Batterie Netto (kWh)' },
  { key: 'laden_10_80_min', label: '10%–80% (min)' },
  { key: 'max_ladeleistung', label: 'Max. Ladeleistung (kW)' },
  { key: 'anhaengelast', label: 'Anhängelast (kg)' },
  { key: 'wltp_reichweite', label: 'WLTP Reichweite (km)' },
  { key: 'wltp_verbrauch', label: 'WLTP Verbrauch (kWh/100km)' },
  { key: 'basis_preis', label: 'Basispreis (€)' },
  { key: 'hoechster_preis', label: 'Höchster Preis (€)' },
  { key: 'null_hundert', label: '0–100 (s)' },
  { key: 'ps', label: 'PS' },
  { key: 'top_speed', label: 'Top Speed (km/h)' },
  { key: 'volt', label: 'Volt' },
  { key: 'markteinfuehrung', label: 'Markteinführung' },
]

const NUM_FIELDS = ['batterie_netto','laden_10_80_min','max_ladeleistung','anhaengelast',
  'wltp_reichweite','wltp_verbrauch','basis_preis','hoechster_preis','null_hundert','ps','top_speed','volt']

const autoMatch = (colName) => {
  const lower = colName.toLowerCase().replace(/\s/g, '_')
  const found = DB_FIELDS.find(f => f.key && (f.key === lower || f.label.toLowerCase().replace(/\s/g, '_') === lower))
  return found?.key || ''
}

export default function CarImport({ onDone }) {
  const { t } = useTranslation()
  const [columns, setColumns] = useState([])
  const [mapping, setMapping] = useState({})
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)

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
      headers.forEach(h => { autoMap[h] = autoMatch(String(h)) })
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
        car[dbKey] = NUM_FIELDS.includes(dbKey) ? (parseFloat(val) || 0) : (String(val || ''))
      })
      return applyCalculations(car)
    }).filter(c => c.marke || c.modell)
    try {
      await importCars(cars)
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
                      {DB_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
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
