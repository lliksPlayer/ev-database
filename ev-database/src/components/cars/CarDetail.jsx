import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalculatorIcon, Check, Plus } from 'lucide-react'
import { getFieldDefinition } from '../../entities/vehicle/fields.js'
import { useCompareTray } from '../../features/comparison/useCompareTray.js'
import './CarDetail.css'

const DETAIL_SECTIONS = {
  ev: [
    { key: 'basis', fields: ['markteinfuehrung', 'basis_preis', 'hoechster_preis'] },
    { key: 'range_battery', fields: ['wltp_reichweite', 'batterie_netto', 'wltp_verbrauch', 'volt'] },
    { key: 'charging', fields: ['laden_ac_kw', 'laden_dc_kw', 'max_ladeleistung', 'laden_10_80_min', 'kwh_nach_70', 'kwh_pro_min'] },
    { key: 'performance', fields: ['null_hundert', 'top_speed', 'leistung_kw', 'ps'] },
    { key: 'dimensions', fields: ['laenge_mm', 'breite_mm', 'hoehe_mm', 'radstand_mm', 'gewicht_leer_kg', 'zul_gesamtgewicht_kg', 'zuladung_kg'] },
    { key: 'weight', fields: ['anhaengelast', 'anhaengelast_ungebremst_kg', 'dachlast_kg'] },
    { key: 'cargo', fields: ['kofferraum_l', 'kofferraum_max_l', 'frunk_l', 'sitze', 'isofix'] },
    { key: 'misc', fields: ['wendekreis_m', 'karosserie', 'segment', 'waermepumpe', 'plattform'] },
  ],
  ice: [
    { key: 'basis', fields: ['markteinfuehrung', 'basis_preis', 'hoechster_preis'] },
    { key: 'ice_powertrain', fields: ['kraftstoff', 'verbrauch_l_100km', 'co2_g_km', 'hubraum_ccm', 'zylinder', 'getriebe'] },
    { key: 'performance', fields: ['null_hundert', 'top_speed', 'ps', 'anhaengelast'] },
  ],
}

function formatValue(value, unit, format) {
  if (value === undefined || value === null || value === '') return null
  if (format === 'currency')
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  if (unit) return `${value} ${unit}`
  return String(value)
}

export default function CarDetail({ car, onClose }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isSelected, toggleVehicle } = useCompareTray()
  if (!car) return null

  const language = i18n.resolvedLanguage?.startsWith('de') ? 'de' : 'en'
  const sections = DETAIL_SECTIONS[car.vehicleType === 'ice' ? 'ice' : 'ev']
  const isIce = car.vehicleType === 'ice'
  const selected = isSelected(car.id)

  const handleAddToCalculator = () => {
    navigate(isIce ? `/rechner?mode=ev-ice&ice1=${car.id}` : `/rechner?mode=ev-ice&ev1=${car.id}`)
    onClose?.()
  }

  const handleToggleCompare = () => {
    toggleVehicle({
      ...car,
      vehicleType: isIce ? 'ice' : 'ev',
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-card ${isIce ? 'modal-card--ice' : 'modal-card--ev'}`} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header">
          <div className="modal-header-copy">
            <span className={`modal-kicker ${isIce ? 'modal-kicker--ice' : ''}`}>
              {t(isIce ? 'nav.iceDatabase' : 'nav.evDatabase')}
            </span>
            <div className="modal-title">{car.marke} {car.modell}</div>
          </div>
          <div className="detail-actions">
            <button
              type="button"
              className={`detail-calc-btn${isIce ? ' detail-calc-btn--ice' : ''}`}
              onClick={handleAddToCalculator}
            >
              <CalculatorIcon size={15} />
              {t('calc.addToCalculator')}
            </button>
            <button
              type="button"
              className={`detail-compare-btn${selected ? ' detail-compare-btn--active' : ''}`}
              onClick={handleToggleCompare}
              aria-pressed={selected}
            >
              {selected ? <Check size={15} /> : <Plus size={15} />}
              {t(selected ? 'compare.removeShort' : 'compare.addShort')}
            </button>
          </div>
        </div>

        {car.bild_url && (
          <div className="detail-image-wrap">
            <img src={car.bild_url} alt={`${car.marke} ${car.modell}`} className="detail-image" />
          </div>
        )}

        <div className="detail-sections">
          {sections.map((section) => {
            const visibleFields = section.fields
              .map((key) => {
                const definition = getFieldDefinition(key)
                return {
                  key,
                  label: definition?.labels?.[language] ?? key,
                  value: formatValue(
                    car[key],
                    definition?.unit,
                    ['basis_preis', 'hoechster_preis'].includes(key) ? 'currency' : undefined
                  ),
                }
              })
              .filter((field) => field.value !== null)

            if (visibleFields.length === 0) return null

            return (
              <section key={section.key} className="detail-section">
                <div className="detail-section-title">{t(`detail.sections.${section.key}`)}</div>
                {visibleFields.map(f => (
                  <div key={f.key} className="detail-field">
                    <span className="detail-field-label">{f.label}</span>
                    <span className="detail-field-value">{f.value}</span>
                  </div>
                ))}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
