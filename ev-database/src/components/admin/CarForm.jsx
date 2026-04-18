import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
