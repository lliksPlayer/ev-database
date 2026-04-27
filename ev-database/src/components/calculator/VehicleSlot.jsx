import { useTranslation } from 'react-i18next'
import { AlertTriangle, CircleAlert, Fuel, Zap } from 'lucide-react'
import IceForm from './IceForm'
import './VehicleSlot.css'

export default function VehicleSlot({
  label,
  type,
  vehicle,
  vehicles = [],
  loading = false,
  params,
  validation,
  expertMode,
  manualEntryEnabled = false,
  onManualEntryChange,
  onVehicleChange,
  onParamsChange,
}) {
  const { t } = useTranslation()

  const showManualToggle = type === 'ice'
  const isManual = showManualToggle && manualEntryEnabled

  const handleSelect = (id) => {
    const found = vehicles.find(c => c.id === id)
    if (found) onVehicleChange({ ...found, vehicleType: type })
  }

  const formatEur = (v) => v != null
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
    : '–'

  const formatCompactNumber = (value) => value != null
    ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: value % 1 === 0 ? 0 : 1 }).format(value)
    : '–'

  const financingType = params.financingType ?? 'cash'
  const purchasePrice = params.kaufpreis ?? vehicle?.basis_preis ?? ''
  const annualKm = params.jahresKm
  const years = params.jahre
  const profileMode = params.profileMode ?? 'normal'
  const cityShare = params.cityShare ?? 35
  const ruralShare = params.ruralShare ?? 40
  const highwayShare = params.highwayShare ?? 25
  const sourceLabel = isManual ? t('calc.summary.manual') : t('calc.summary.database')
  const homeShare = params.homeShare ?? 80
  const publicShare = params.publicShare ?? 0
  const fastShare = params.fastShare ?? 20
  const financeLabel = t(`calc.financingTypes.${financingType}`)
  const fieldIssues = validation?.fieldIssues ?? {}
  const notices = validation?.notices ?? []
  const consumptionValue = type === 'ev'
    ? params.verbrauchKwh ?? vehicle?.wltp_verbrauch ?? null
    : params.verbrauchL ?? vehicle?.verbrauch_l_100km ?? null
  const consumptionSummary = consumptionValue != null
    ? `${formatCompactNumber(consumptionValue)} ${type === 'ev' ? 'kWh/100 km' : 'L/100 km'}`
    : '–'
  const drivingProfileSummary = t(`calc.profile.modes.${profileMode}`)
  const energySummary = type === 'ev'
    ? `${t('calc.homeLabel')} ${homeShare ?? 0}% · ${t('calc.publicLabel')} ${publicShare ?? 0}% · ${t('calc.fastLabel')} ${fastShare ?? 0}%`
    : params.kraftstoffPreis != null
      ? `${formatCompactNumber(params.kraftstoffPreis)} €/L`
      : '–'

  const vehicleMeta = type === 'ev'
    ? [
        consumptionValue != null ? `${formatCompactNumber(consumptionValue)} kWh/100 km` : null,
        vehicle?.wltp_reichweite != null ? `${formatCompactNumber(vehicle.wltp_reichweite)} km WLTP` : null,
      ].filter(Boolean)
    : [
        vehicle?.kraftstoff || null,
        consumptionValue != null ? `${formatCompactNumber(consumptionValue)} L/100 km` : null,
      ].filter(Boolean)

  const resolveIssue = (key) => fieldIssues[key]
    ? t(`calc.validation.${fieldIssues[key].code}`, fieldIssues[key].values)
    : null

  const chargeProfileMessage = resolveIssue('chargeProfile')
  const drivingProfileMessage = resolveIssue('drivingProfile')

  return (
    <div className={`vehicle-slot vehicle-slot--${type}`}>
      <div className="slot-header">
        <div className="slot-label-wrap">
          <span className={`slot-type-badge slot-type-badge--${type}`}>
            {type === 'ev' ? <Zap size={11} strokeWidth={2.5} /> : <Fuel size={11} strokeWidth={2.5} />}
            {type === 'ev' ? 'EV' : 'ICE'}
          </span>
          <h3>{label}</h3>
        </div>
        {showManualToggle && (
          <div className="slot-source-toggle">
            <button
              className={!isManual ? 'active' : ''}
              onClick={() => onManualEntryChange?.(false)}
              disabled={vehicles.length === 0}
              type="button"
            >
              {t('calc.fromDatabase')}
            </button>
            <button
              className={isManual ? 'active' : ''}
              onClick={() => onManualEntryChange?.(true)}
              type="button"
            >
              {t('calc.manualEntry')}
            </button>
          </div>
        )}
      </div>

      <SlotSection
        step="1"
        title={t('calc.sections.vehicleTitle')}
        description={t(type === 'ev' ? 'calc.sections.vehicleDescriptionEv' : 'calc.sections.vehicleDescriptionIce')}
      >
        {!isManual && (
          <div className="slot-db-picker">
            {loading
              ? <span className="slot-loading">{t('calc.loadingVehicles')}</span>
              : vehicles.length === 0
                ? <span className="slot-empty">{t('calc.noVehiclesInDb')}</span>
                : (
                  <select
                    value={vehicle?.id || ''}
                    onChange={e => handleSelect(e.target.value)}
                  >
                    <option value="">{t('calc.selectVehicle')}</option>
                    {vehicles.map(c => (
                      <option key={c.id} value={c.id}>{c.marke} {c.modell}</option>
                    ))}
                  </select>
                )
            }
          </div>
        )}

        {isManual && (
          <IceForm vehicle={vehicle} onChange={v => onVehicleChange({ ...v, vehicleType: 'ice' })} />
        )}

        {vehicle && (
          <div className="slot-vehicle-card">
            <div className="slot-vehicle-card-main">
              <span className="slot-vehicle-kicker">{sourceLabel}</span>
              <span className="slot-vehicle-name">{vehicle.marke} {vehicle.modell}</span>
              {vehicleMeta.length > 0 && (
                <div className="slot-vehicle-meta">
                  {vehicleMeta.map((entry) => (
                    <span key={entry}>{entry}</span>
                  ))}
                </div>
              )}
            </div>
            {vehicle.basis_preis && <span className="slot-vehicle-price">{formatEur(vehicle.basis_preis)}</span>}
          </div>
        )}
      </SlotSection>

      <div className="slot-summary-grid">
        <SummaryCard label={t('calc.summary.source')} value={sourceLabel} />
        <SummaryCard label={t('calc.summary.acquisition')} value={purchasePrice === '' ? '–' : formatEur(purchasePrice)} />
        <SummaryCard label={t('calc.summary.financing')} value={financeLabel} />
        <SummaryCard
          label={t('calc.summary.usage')}
          value={annualKm ? `${new Intl.NumberFormat('de-DE').format(annualKm)} km/Jahr` : '–'}
        />
        <SummaryCard label={t('calc.summary.drivingProfile')} value={drivingProfileSummary} />
        <SummaryCard label={t('calc.summary.consumption')} value={consumptionSummary} />
        <SummaryCard label={t('calc.summary.energy')} value={energySummary} />
      </div>

      {(validation?.hasBlockingErrors || notices.length > 0 || chargeProfileMessage || drivingProfileMessage) && (
        <div className="slot-validation-list">
          {validation?.hasBlockingErrors && (
            <ValidationNotice
              tone="error"
              icon={<AlertTriangle size={15} />}
              message={t('calc.validation.fixSlotBeforeResults')}
            />
          )}
          {chargeProfileMessage && (
            <ValidationNotice
              tone={fieldIssues.chargeProfile?.tone ?? 'warning'}
              icon={fieldIssues.chargeProfile?.tone === 'error' ? <AlertTriangle size={15} /> : <CircleAlert size={15} />}
              message={chargeProfileMessage}
            />
          )}
          {drivingProfileMessage && (
            <ValidationNotice
              tone={fieldIssues.drivingProfile?.tone ?? 'warning'}
              icon={fieldIssues.drivingProfile?.tone === 'error' ? <AlertTriangle size={15} /> : <CircleAlert size={15} />}
              message={drivingProfileMessage}
            />
          )}
          {notices.map((notice) => (
            <ValidationNotice
              key={`${notice.tone}-${notice.code}`}
              tone={notice.tone}
              icon={notice.tone === 'error' ? <AlertTriangle size={15} /> : <CircleAlert size={15} />}
              message={t(`calc.validation.${notice.code}`, notice.values)}
            />
          ))}
        </div>
      )}

      <SlotSection
        step="2"
        title={t('calc.sections.usageTitle')}
        description={t('calc.sections.usageDescription')}
      >
        <div className="slot-field-grid">
          <FieldCard
            label={t('calc.params.jahresKm')}
            value={annualKm}
            tone={fieldIssues.jahresKm?.tone}
            message={resolveIssue('jahresKm')}
            onChange={v => onParamsChange({ jahresKm: Number(v) })}
          />
          <FieldCard
            label={t('calc.params.jahre')}
            value={years}
            min="1"
            max="15"
            tone={fieldIssues.jahre?.tone}
            message={resolveIssue('jahre')}
            onChange={v => onParamsChange({ jahre: Number(v) })}
          />
          <FieldCard
            className="field-card--wide"
            label={t('calc.params.drivingPreset')}
            renderValue={() => (
              <ChoiceGroup
                className="choice-group--profile"
                value={profileMode}
                options={[
                  { value: 'normal', label: t('calc.profile.modes.normal') },
                  { value: 'city', label: t('calc.profile.modes.city') },
                  { value: 'rural', label: t('calc.profile.modes.rural') },
                  { value: 'highway', label: t('calc.profile.modes.highway') },
                ]}
                onChange={(value) => onParamsChange({ profileMode: value })}
              />
            )}
          />
          <FieldHint className="field-hint--wide" tone={fieldIssues.drivingProfile?.tone}>
            {profileMode === 'normal'
              ? t('calc.hints.drivingProfileNeutral')
              : `${t('calc.hints.drivingProfilePreset')}: ${t('calc.profile.cityLabel')} ${cityShare}% · ${t('calc.profile.ruralLabel')} ${ruralShare}% · ${t('calc.profile.highwayLabel')} ${highwayShare}%`
            }
          </FieldHint>
        </div>
      </SlotSection>

      <SlotSection
        step="3"
        title={t('calc.sections.costsTitle')}
        description={t(type === 'ev' ? 'calc.sections.costsDescriptionEv' : 'calc.sections.costsDescriptionIce')}
      >
        <div className="slot-field-grid">
          <FieldCard
            label={t('calc.params.kaufpreis')}
            value={purchasePrice}
            tone={fieldIssues.kaufpreis?.tone}
            message={resolveIssue('kaufpreis')}
            onChange={v => onParamsChange({ kaufpreis: Number(v) })}
          />
          <FieldCard
            label={t(type === 'ev' ? 'calc.params.verbrauchKwh' : 'calc.params.verbrauchL')}
            value={consumptionValue}
            step={type === 'ev' ? '0.1' : '0.1'}
            tone={fieldIssues[type === 'ev' ? 'verbrauchKwh' : 'verbrauchL']?.tone}
            message={resolveIssue(type === 'ev' ? 'verbrauchKwh' : 'verbrauchL')}
            onChange={v => onParamsChange(type === 'ev' ? { verbrauchKwh: Number(v) } : { verbrauchL: Number(v) })}
          />

          {type === 'ev' ? (
            <>
              <FieldCard
                label={t('calc.params.homePrice')}
                value={params.homePrice ?? 0.28}
                step="0.01"
                tone={fieldIssues.homePrice?.tone}
                message={resolveIssue('homePrice')}
                onChange={v => onParamsChange({ homePrice: Number(v) })}
              />
              <FieldCard
                label={t('calc.params.publicPrice')}
                value={params.publicPrice ?? 0.45}
                step="0.01"
                tone={fieldIssues.publicPrice?.tone}
                message={resolveIssue('publicPrice')}
                onChange={v => onParamsChange({ publicPrice: Number(v) })}
              />
              <FieldCard
                label={t('calc.params.fastPrice')}
                value={params.fastPrice ?? 0.55}
                step="0.01"
                tone={fieldIssues.fastPrice?.tone}
                message={resolveIssue('fastPrice')}
                onChange={v => onParamsChange({ fastPrice: Number(v) })}
              />
              <FieldCard
                label={t('calc.params.homeShare')}
                value={homeShare}
                min="0"
                max="100"
                tone={fieldIssues.homeShare?.tone}
                message={resolveIssue('homeShare')}
                onChange={v => onParamsChange({ homeShare: Number(v) })}
              />
              <FieldCard
                label={t('calc.params.publicShare')}
                value={publicShare}
                min="0"
                max="100"
                tone={fieldIssues.publicShare?.tone}
                message={resolveIssue('publicShare')}
                onChange={v => onParamsChange({ publicShare: Number(v) })}
              />
              <FieldCard
                label={t('calc.params.fastShare')}
                value={fastShare}
                min="0"
                max="100"
                tone={fieldIssues.fastShare?.tone}
                message={resolveIssue('fastShare')}
                onChange={v => onParamsChange({ fastShare: Number(v) })}
              />
              <FieldHint
                className="field-hint--wide"
                tone={fieldIssues.chargeProfile?.tone}
              >
                {chargeProfileMessage || t('calc.hints.chargeProfile')}
              </FieldHint>
            </>
          ) : (
            <>
              <FieldCard
                label={t('calc.params.kraftstoffPreis')}
                value={params.kraftstoffPreis}
                step="0.01"
                tone={fieldIssues.kraftstoffPreis?.tone}
                message={resolveIssue('kraftstoffPreis')}
                onChange={v => onParamsChange({ kraftstoffPreis: Number(v) })}
              />
              <FieldHint className="field-hint--wide">
                {t('calc.hints.fuelPrice')}
              </FieldHint>
            </>
          )}
        </div>
      </SlotSection>

      {expertMode && (
        <SlotSection
          step="4"
          title={t('calc.sections.expertTitle')}
          description={t(type === 'ev' ? 'calc.sections.expertDescriptionEv' : 'calc.sections.expertDescriptionIce')}
          tone="expert"
        >
          <div className="slot-field-grid">
            <FieldCard
              className="field-card--wide"
              label={t('calc.params.financingType')}
              renderValue={() => (
                <ChoiceGroup
                  value={financingType}
                  options={[
                    { value: 'cash', label: t('calc.financingTypes.cash') },
                    { value: 'loan', label: t('calc.financingTypes.loan') },
                    { value: 'lease', label: t('calc.financingTypes.lease') },
                  ]}
                  onChange={(value) => onParamsChange({ financingType: value })}
                />
              )}
            />
            <FieldCard label={t('calc.params.wartung')} value={params.wartung ?? 0} tone={fieldIssues.wartung?.tone} message={resolveIssue('wartung')} onChange={v => onParamsChange({ wartung: Number(v) })} />
            <FieldCard label={t('calc.params.versicherung')} value={params.versicherung ?? 0} tone={fieldIssues.versicherung?.tone} message={resolveIssue('versicherung')} onChange={v => onParamsChange({ versicherung: Number(v) })} />
            <FieldCard label={t('calc.params.steuer')} value={params.steuer ?? 0} tone={fieldIssues.steuer?.tone} message={resolveIssue('steuer')} onChange={v => onParamsChange({ steuer: Number(v) })} />
            {financingType !== 'lease' && (
              <FieldCard label={t('calc.params.restwertProzent')} value={params.restwertProzent ?? 0} step="1" tone={fieldIssues.restwertProzent?.tone} message={resolveIssue('restwertProzent')} onChange={v => onParamsChange({ restwertProzent: Number(v) })} />
            )}
            <FieldCard label={t('calc.params.foerderung')} value={params.foerderung ?? 0} tone={fieldIssues.foerderung?.tone} message={resolveIssue('foerderung')} onChange={v => onParamsChange({ foerderung: Number(v) })} />
            {financingType === 'loan' && (
              <FieldCard label={t('calc.params.zinsSatz')} value={params.zinsSatz ?? 0} step="0.1" tone={fieldIssues.zinsSatz?.tone} message={resolveIssue('zinsSatz')} onChange={v => onParamsChange({ zinsSatz: Number(v) })} />
            )}
            {financingType === 'lease' && (
              <>
                <FieldCard
                  label={t('calc.params.leaseMonthlyRate')}
                  value={params.leaseMonthlyRate ?? 0}
                  tone={fieldIssues.leaseMonthlyRate?.tone}
                  message={resolveIssue('leaseMonthlyRate')}
                  onChange={v => onParamsChange({ leaseMonthlyRate: Number(v) })}
                />
                <FieldCard
                  label={t('calc.params.leaseDownPayment')}
                  value={params.leaseDownPayment ?? 0}
                  tone={fieldIssues.leaseDownPayment?.tone}
                  message={resolveIssue('leaseDownPayment')}
                  onChange={v => onParamsChange({ leaseDownPayment: Number(v) })}
                />
              </>
            )}
            {type === 'ev' && (
              <>
                <FieldCard
                  label={t('calc.params.thgQuote')}
                  value={params.thgQuote ?? 250}
                  onChange={v => onParamsChange({ thgQuote: Number(v) })}
                />
                <FieldCard
                  label={t('calc.params.homeLoss')}
                  value={params.homeLoss ?? 15}
                  step="1"
                  min="0"
                  max="50"
                  tone={fieldIssues.homeLoss?.tone}
                  message={resolveIssue('homeLoss')}
                  onChange={v => onParamsChange({ homeLoss: Number(v) })}
                />
                <FieldCard
                  label={t('calc.params.publicLoss')}
                  value={params.publicLoss ?? 15}
                  step="1"
                  min="0"
                  max="50"
                  tone={fieldIssues.publicLoss?.tone}
                  message={resolveIssue('publicLoss')}
                  onChange={v => onParamsChange({ publicLoss: Number(v) })}
                />
                <FieldCard
                  label={t('calc.params.fastLoss')}
                  value={params.fastLoss ?? 8}
                  step="1"
                  min="0"
                  max="50"
                  tone={fieldIssues.fastLoss?.tone}
                  message={resolveIssue('fastLoss')}
                  onChange={v => onParamsChange({ fastLoss: Number(v) })}
                />
                <FieldCard
                  label={t('calc.params.wallboxPurchaseCost')}
                  value={params.wallboxPurchaseCost ?? 0}
                  tone={fieldIssues.wallboxPurchaseCost?.tone}
                  message={resolveIssue('wallboxPurchaseCost')}
                  onChange={v => onParamsChange({ wallboxPurchaseCost: Number(v) })}
                />
                <FieldCard
                  label={t('calc.params.wallboxInstallationCost')}
                  value={params.wallboxInstallationCost ?? 0}
                  tone={fieldIssues.wallboxInstallationCost?.tone}
                  message={resolveIssue('wallboxInstallationCost')}
                  onChange={v => onParamsChange({ wallboxInstallationCost: Number(v) })}
                />
              </>
            )}
          </div>
        </SlotSection>
      )}
    </div>
  )
}

function SlotSection({ step, title, description, tone = 'default', children }) {
  return (
    <section className={`slot-section${tone === 'expert' ? ' slot-section--expert' : ''}`}>
      <div className="slot-section-header">
        <span className="slot-step">{step}</span>
        <div className="slot-section-copy">
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="slot-summary-card">
      <span className="slot-summary-label">{label}</span>
      <span className="slot-summary-value">{value}</span>
    </div>
  )
}

function FieldCard({
  label,
  value,
  onChange,
  tone = null,
  message = null,
  step = '1',
  min,
  max,
  className = '',
  renderValue = null,
}) {
  return (
    <div className={`field-card${tone ? ` field-card--${tone}` : ''}${className ? ` ${className}` : ''}`}>
      <label>{label}</label>
      {renderValue ? (
        renderValue()
      ) : (
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {message && <span className={`field-card-message field-card-message--${tone}`}>{message}</span>}
    </div>
  )
}

function FieldHint({ children, className = '', tone = null }) {
  return (
    <div className={`field-hint${tone ? ` field-hint--${tone}` : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

function ChoiceGroup({ value, options, onChange, className = '' }) {
  return (
    <div className={`choice-group${className ? ` ${className}` : ''}`} role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`choice-pill${value === option.value ? ' active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function ValidationNotice({ tone = 'warning', icon, message }) {
  return (
    <div className={`validation-notice validation-notice--${tone}`}>
      <span className="validation-notice-icon">{icon}</span>
      <span>{message}</span>
    </div>
  )
}
