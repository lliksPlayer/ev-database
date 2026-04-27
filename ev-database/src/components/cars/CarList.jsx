import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalculatorIcon } from 'lucide-react'
import './CarList.css'

export default function CarList({ cars, fields, onCarClick, variant = 'ev' }) {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language
  const isIce = variant === 'ice'

  const visibleFields = [...fields]
    .filter(f => f.visible && f.key !== 'marke' && f.key !== 'modell')
    .sort((a, b) => a.order - b.order)

  const formatValue = (key, value) => {
    if (value === undefined || value === null || value === '') return '–'
    if (['basis_preis', 'hoechster_preis'].includes(key))
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
    return value
  }

  const handleAddToCalculator = (event, car) => {
    event.stopPropagation()
    navigate(isIce ? `/rechner?mode=ev-ice&ice1=${car.id}` : `/rechner?mode=ev-ice&ev1=${car.id}`)
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
          <button
            type="button"
            className={`car-list-calc-btn${isIce ? ' car-list-calc-btn--ice' : ''}`}
            onClick={(event) => handleAddToCalculator(event, car)}
          >
            <CalculatorIcon size={14} />
            {t('calc.addToCalculator')}
          </button>
        </div>
      ))}
    </div>
  )
}
