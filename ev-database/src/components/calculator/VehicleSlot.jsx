import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCarsCollection } from '../../hooks/useCars'
import IceForm from './IceForm'
import './VehicleSlot.css'

export default function VehicleSlot({ label, type, vehicle, params, expertMode, onVehicleChange, onParamsChange }) {
  const { t } = useTranslation()
  const collection = type === 'ev' ? 'ev_cars' : 'ice_cars'
  const { cars, loading } = useCarsCollection(collection)
  const [useManual, setUseManual] = useState(false)

  const showManualToggle = type === 'ice'

  const handleSelect = (id) => {
    const found = cars.find(c => c.id === id)
    if (found) onVehicleChange({ ...found, vehicleType: type })
  }

  const formatEur = (v) => v != null
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
    : '–'

  return (
    <div className={`vehicle-slot vehicle-slot--${type}`}>
      <div className="slot-header">
        <div className="slot-label-wrap">
          <span className={`slot-type-badge slot-type-badge--${type}`}>
            {type === 'ev' ? 'EV' : 'ICE'}
          </span>
          <h3>{label}</h3>
        </div>
        {showManualToggle && (
          <div className="slot-source-toggle">
            <button
              className={!useManual ? 'active' : ''}
              onClick={() => setUseManual(false)}
              disabled={cars.length === 0}
            >
              {t('calc.fromDatabase')}
            </button>
            <button
              className={useManual ? 'active' : ''}
              onClick={() => setUseManual(true)}
            >
              {t('calc.manualEntry')}
            </button>
          </div>
        )}
      </div>

      {!useManual && (
        <div className="slot-db-picker">
          {loading
            ? <span className="slot-loading">{t('calc.loadingVehicles')}</span>
            : cars.length === 0
              ? <span className="slot-empty">{t('calc.noVehiclesInDb')}</span>
              : (
                <select
                  value={vehicle?.id || ''}
                  onChange={e => handleSelect(e.target.value)}
                >
                  <option value="">{t('calc.selectVehicle')}</option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>{c.marke} {c.modell}</option>
                  ))}
                </select>
              )
          }
        </div>
      )}

      {useManual && (
        <IceForm vehicle={vehicle} onChange={v => onVehicleChange({ ...v, vehicleType: 'ice' })} />
      )}

      {vehicle && (
        <div className="slot-vehicle-info">
          <span className="slot-vehicle-name">{vehicle.marke} {vehicle.modell}</span>
          {vehicle.basis_preis && <span className="slot-vehicle-price">{formatEur(vehicle.basis_preis)}</span>}
        </div>
      )}

      <div className="slot-params">
        <ParamRow label={t('calc.params.kaufpreis')} value={params.kaufpreis ?? vehicle?.basis_preis ?? ''} onChange={v => onParamsChange({ kaufpreis: Number(v) })} />
        <ParamRow label={t('calc.params.jahresKm')} value={params.jahresKm} onChange={v => onParamsChange({ jahresKm: Number(v) })} />
        {type === 'ev'
          ? <ParamRow label={t('calc.params.stromPreis')} value={params.stromPreis} step="0.01" onChange={v => onParamsChange({ stromPreis: Number(v) })} />
          : <ParamRow label={t('calc.params.kraftstoffPreis')} value={params.kraftstoffPreis} step="0.01" onChange={v => onParamsChange({ kraftstoffPreis: Number(v) })} />
        }
        <ParamRow label={t('calc.params.jahre')} value={params.jahre} min="1" max="15" onChange={v => onParamsChange({ jahre: Number(v) })} />

        {expertMode && (
          <div className="slot-expert-params">
            <div className="slot-expert-divider">
              <span>{t('calc.expertParams') || 'Expert'}</span>
            </div>
            <ParamRow label={t('calc.params.wartung')} value={params.wartung ?? 0} onChange={v => onParamsChange({ wartung: Number(v) })} />
            <ParamRow label={t('calc.params.versicherung')} value={params.versicherung ?? 0} onChange={v => onParamsChange({ versicherung: Number(v) })} />
            <ParamRow label={t('calc.params.steuer')} value={params.steuer ?? 0} onChange={v => onParamsChange({ steuer: Number(v) })} />
            <ParamRow label={t('calc.params.restwertProzent')} value={params.restwertProzent ?? 0} step="1" onChange={v => onParamsChange({ restwertProzent: Number(v) })} />
            <ParamRow label={t('calc.params.foerderung')} value={params.foerderung ?? 0} onChange={v => onParamsChange({ foerderung: Number(v) })} />
            <ParamRow label={t('calc.params.zinsSatz')} value={params.zinsSatz ?? 0} step="0.1" onChange={v => onParamsChange({ zinsSatz: Number(v) })} />
          </div>
        )}
      </div>
    </div>
  )
}

function ParamRow({ label, value, onChange, step = '1', min, max }) {
  return (
    <div className="param-row">
      <label>{label}</label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
