import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { addCar, updateCar } from '../../firebase/cars'
import { applyCalculations } from '../../utils/calculations'
import './CarForm.css'

const FIELDS = [
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

const emptyForm = () => Object.fromEntries(FIELDS.map(f => [f.key, '']))

export default function CarForm({ car, onDone }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(car ? { ...car } : emptyForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const updated = applyCalculations({
      batterie_netto: parseFloat(form.batterie_netto) || 0,
      laden_10_80_min: parseFloat(form.laden_10_80_min) || 0,
    })
    setForm(prev => ({ ...prev, kwh_nach_70: updated.kwh_nach_70, kwh_pro_min: updated.kwh_pro_min }))
  }, [form.batterie_netto, form.laden_10_80_min])

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = {}
    FIELDS.forEach(f => {
      data[f.key] = f.type === 'number' ? (parseFloat(form[f.key]) || 0) : (form[f.key] || '')
    })
    try {
      if (car?.id) await updateCar(car.id, data)
      else await addCar(data)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="car-form" onSubmit={handleSubmit}>
      <h2>{car ? 'Fahrzeug bearbeiten' : 'Fahrzeug hinzufügen'}</h2>
      <div className="form-grid">
        {FIELDS.map(f => (
          <div key={f.key} className="form-group">
            <label>{f.label}</label>
            <input
              type={f.type}
              value={form[f.key]}
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
