import { useTranslation } from 'react-i18next'
import './CarCard.css'

export default function CarCard({ car, fields, onClick }) {
  const { i18n } = useTranslation()
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
    </div>
  )
}
