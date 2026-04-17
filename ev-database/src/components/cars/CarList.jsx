import { useTranslation } from 'react-i18next'
import './CarList.css'

export default function CarList({ cars, fields, onCarClick }) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const visibleFields = [...fields]
    .filter(f => f.visible && f.key !== 'marke' && f.key !== 'modell')
    .sort((a, b) => a.order - b.order)

  const formatValue = (key, value) => {
    if (value === undefined || value === null || value === '') return '–'
    if (['basis_preis', 'hoechster_preis'].includes(key))
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
    return value
  }

  return (
    <div className="car-list">
      {cars.map(car => (
        <div key={car.id} className="car-list-row" onClick={() => onCarClick(car)}>
          <div className="car-list-name">{car.marke} {car.modell}</div>
          {visibleFields.map(f => (
            <div key={f.key} className="car-list-field">
              {lang === 'de' ? f.label_de : f.label_en}:
              <span>{formatValue(f.key, car[f.key])}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
