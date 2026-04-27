import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Check, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCompareTray } from '../../features/comparison/useCompareTray.js'
import './CompareTray.css'

function TrayVehicle({ label, vehicle, onRemove, tone = 'ev' }) {
  return (
    <div className={`compare-tray-slot compare-tray-slot--${tone}${vehicle ? ' compare-tray-slot--filled' : ''}`}>
      <span className="compare-tray-slot-label">{label}</span>
      {vehicle ? (
        <>
          <div className="compare-tray-slot-title">{vehicle.marke} {vehicle.modell}</div>
          <div className="compare-tray-slot-meta">
            {vehicle.markteinfuehrung ? <span>{vehicle.markteinfuehrung}</span> : null}
            {vehicle.basis_preis ? (
              <span>
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                }).format(vehicle.basis_preis)}
              </span>
            ) : null}
          </div>
          <button type="button" className="compare-tray-remove" onClick={() => onRemove(vehicle)}>
            <X size={14} />
          </button>
        </>
      ) : (
        <div className="compare-tray-empty">—</div>
      )}
    </div>
  )
}

export default function CompareTray() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const { tray, status, calculatorUrl, toggleVehicle, clearTray } = useCompareTray()

  const isCatalogRoute = pathname === '/autos' || pathname === '/verbrenner'
  const hasEntries = Boolean(tray.primaryEv || tray.secondary)

  if (!isCatalogRoute || !hasEntries) return null

  const ready = status === 'ready'
  const tone = tray.secondary?.vehicleType === 'ice' ? 'ice' : 'ev'

  return (
    <>
      <div className="compare-tray-spacer" />
      <aside className="compare-tray-shell" aria-label={t('compare.title')}>
        <div className="compare-tray">
          <div className="compare-tray-copy">
            <span className={`compare-tray-kicker compare-tray-kicker--${tone}`}>
              {t('compare.kicker')}
            </span>
            <div className="compare-tray-title-row">
              <h2 className="compare-tray-title">{t(`compare.status.${status}.title`)}</h2>
              <span className={`compare-tray-status compare-tray-status--${ready ? 'ready' : 'draft'}`}>
                {ready ? <Check size={14} /> : <Plus size={14} />}
                {t(`compare.status.${status}.pill`)}
              </span>
            </div>
            <p className="compare-tray-description">{t(`compare.status.${status}.description`)}</p>
          </div>

          <div className="compare-tray-vehicles">
            <TrayVehicle
              label={t('compare.slots.primaryEv')}
              vehicle={tray.primaryEv}
              onRemove={toggleVehicle}
              tone="ev"
            />
            <TrayVehicle
              label={t('compare.slots.secondary')}
              vehicle={tray.secondary}
              onRemove={toggleVehicle}
              tone={tray.secondary?.vehicleType === 'ice' ? 'ice' : 'ev'}
            />
          </div>

          <div className="compare-tray-actions">
            <Link to={calculatorUrl} className={`compare-tray-cta compare-tray-cta--${ready ? 'ready' : 'draft'}`}>
              {t(ready ? 'compare.openReady' : 'compare.openDraft')}
              <ArrowRight size={15} />
            </Link>
            <button type="button" className="compare-tray-clear" onClick={clearTray}>
              {t('compare.clear')}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
