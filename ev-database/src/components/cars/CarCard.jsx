import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalculatorIcon } from 'lucide-react'
import { getFieldMeta } from '../../utils/fieldIcons'
import './CarCard.css'

// Fields shown in the header — excluded from the metric rows
const HEADER_KEYS = new Set(['marke', 'modell', 'markteinfuehrung'])

export default function CarCard({ car, fields, onClick, variant = 'ev' }) {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language

  const visibleFields = [...fields]
    .filter(f => f.visible && !HEADER_KEYS.has(f.key))
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

  const isIce = variant === 'ice'

  return (
    <div className={`car-card${isIce ? ' car-card-ice' : ''}`} onClick={onClick}>
      <div className="car-card-header">
        <span className={`car-card-brand${isIce ? ' car-card-brand-ice' : ''}`}>
          {car.marke}
        </span>
        {car.markteinfuehrung && (
          <span className="car-card-year">{car.markteinfuehrung}</span>
        )}
      </div>
      <div className="car-card-title">{car.modell}</div>
      <div className="car-card-fields">
        {visibleFields.map(f => {
          const { icon: Icon, color } = getFieldMeta(f.key)
          return (
            <div key={f.key} className="car-field">
              <div
                className="car-field-icon"
                style={{ '--field-color': color }}
              >
                <Icon size={13} />
              </div>
              <span className="car-field-label">
                {lang === 'de' ? f.label_de : f.label_en}
              </span>
              <span className="car-field-value">{formatValue(f.key, car[f.key])}</span>
            </div>
          )
        })}
      </div>
      <button className={`calc-btn${isIce ? ' calc-btn-ice' : ''}`} onClick={handleAddToCalculator}>
        <CalculatorIcon size={14} />
        {t('calc.addToCalculator')}
      </button>
    </div>
  )
}
