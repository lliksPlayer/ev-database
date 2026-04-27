import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applyCalculations } from '../../entities/vehicle/calculations.js'
import './CarForm.css'

const emptyForm = (fields) => Object.fromEntries(fields.map(f => [f.key, '']))

function withCalculatedFields(form, fields) {
  if (!fields.some((field) => field.calc)) {
    return form
  }

  const updated = applyCalculations({
    batterie_netto: parseFloat(form.batterie_netto) || 0,
    laden_10_80_min: parseFloat(form.laden_10_80_min) || 0,
  })

  return {
    ...form,
    kwh_nach_70: updated.kwh_nach_70,
    kwh_pro_min: updated.kwh_pro_min,
  }
}

export default function CarForm({ fields, addFn, updateFn, car, onDone }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => withCalculatedFields(car ? { ...car } : emptyForm(fields), fields))
  const [saving, setSaving] = useState(false)

  const serializeFieldValue = (field) => {
    const rawValue = form[field.key]

    if (field.type === 'number') {
      if (rawValue === '' || rawValue === null || rawValue === undefined) return null
      const parsed = parseFloat(rawValue)
      return Number.isFinite(parsed) ? parsed : null
    }

    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim()
      return trimmed === '' ? null : trimmed
    }

    return rawValue ?? null
  }

  const handleChange = (key, value) =>
    setForm((prev) => withCalculatedFields({ ...prev, [key]: value }, fields))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = {}
    fields.forEach(f => {
      data[f.key] = serializeFieldValue(f)
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
              required={Boolean(f.required) && !f.calc}
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
