import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import EnrichmentBadge from '../admin/EnrichmentBadge'
import './CarDetail.css'

const SECTIONS = [
  {
    key: 'basis',
    fields: [
      { key: 'baujahr' },
      { key: 'preis_de', unit: null, format: 'currency' },
    ],
  },
  {
    key: 'range_battery',
    fields: [
      { key: 'reichweite_wltp',     unit: 'km' },
      { key: 'akku_kapazitaet_kwh', unit: 'kwh' },
      { key: 'architektur_volt',    unit: 'volt' },
    ],
  },
  {
    key: 'charging',
    fields: [
      { key: 'laden_ac_kw',         unit: 'kw' },
      { key: 'laden_dc_kw',         unit: 'kw' },
      { key: 'ladezeit_10_80_min',  unit: 'min' },
    ],
  },
  {
    key: 'performance',
    fields: [
      { key: 'beschleunigung_sec',         unit: 'sec' },
      { key: 'hoechstgeschwindigkeit_kmh', unit: 'kmh' },
      { key: 'leistung_kw',               unit: 'kw' },
    ],
  },
  {
    key: 'dimensions',
    fields: [
      { key: 'laenge_mm',   unit: 'mm' },
      { key: 'breite_mm',   unit: 'mm' },
      { key: 'hoehe_mm',    unit: 'mm' },
      { key: 'radstand_mm', unit: 'mm' },
    ],
  },
  {
    key: 'weight',
    fields: [
      { key: 'gewicht_leer_kg',            unit: 'kg' },
      { key: 'zul_gesamtgewicht_kg',       unit: 'kg' },
      { key: 'zuladung_kg',                unit: 'kg' },
      { key: 'anhaengelast_gebremst_kg',   unit: 'kg' },
      { key: 'anhaengelast_ungebremst_kg', unit: 'kg' },
    ],
  },
  {
    key: 'cargo',
    fields: [
      { key: 'kofferraum_l',     unit: 'liter' },
      { key: 'kofferraum_max_l', unit: 'liter' },
      { key: 'frunk_l',          unit: 'liter' },
      { key: 'dachlast_kg',      unit: 'kg' },
    ],
  },
  {
    key: 'misc',
    fields: [
      { key: 'sitze' },
      { key: 'isofix' },
      { key: 'wendekreis_m', unit: 'meter' },
      { key: 'karosserie' },
      { key: 'segment' },
      { key: 'waermepumpe' },
      { key: 'plattform' },
    ],
  },
]

const UNITS = { km: true, kwh: true, volt: true, kw: true, min: true, sec: true, kmh: true, mm: true, kg: true, liter: true, meter: true }

function formatValue(value, unit, format, t) {
  if (value === undefined || value === null || value === '') return null
  if (format === 'currency')
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  if (unit && UNITS[unit]) return `${value} ${t(`detail.units.${unit}`)}`
  return String(value)
}

export default function CarDetail({ car, onClose }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = !!user

  if (!car) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{car.marke} {car.modell}</div>

        {car.bild_url && (
          <div className="detail-image-wrap">
            <img src={car.bild_url} alt={`${car.marke} ${car.modell}`} className="detail-image" />
          </div>
        )}

        {SECTIONS.map(section => {
          const visibleFields = section.fields
            .map(f => ({
              ...f,
              label: t(`detail.fields.${f.key}`),
              value: formatValue(car[f.key], f.unit, f.format, t),
              enrichedMeta: car._enriched?.[f.key] ?? null,
            }))
            .filter(f => f.value !== null)

          if (visibleFields.length === 0) return null

          return (
            <div key={section.key} className="detail-section">
              <div className="detail-section-title">{t(`detail.sections.${section.key}`)}</div>
              {visibleFields.map(f => (
                <div key={f.key} className="detail-field">
                  <span className="detail-field-label">{f.label}</span>
                  <span className="detail-field-value">
                    {f.value}
                    {isAdmin && <EnrichmentBadge meta={f.enrichedMeta} />}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
