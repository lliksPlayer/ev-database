import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BatteryCharging,
  Boxes,
  Calculator,
  Check,
  CheckCircle2,
  Clock3,
  Fuel,
  Gauge,
  Layers3,
  Package,
  Route,
  Search,
  Sparkles,
  Snowflake,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  TriangleAlert,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EV_CARD_FIELDS, ICE_CARD_FIELDS, getFieldDefinition } from '../entities/vehicle/fields.js'
import { useCarsCollection } from '../hooks/useCars'
import { useSettings } from '../hooks/useSettings'
import { useCompareTray } from '../features/comparison/useCompareTray.js'
import CarCard from '../components/cars/CarCard'
import CarDetail from '../components/cars/CarDetail'
import {
  ADVISOR_DRIVETRAINS,
  getAdvisorCriteriaGroups,
  cloneAdvisorCriteriaState,
  createAdvisorCriteriaState,
  getAdvisorCriteriaForDrivetrain,
  getAdvisorCriterionOptions,
  getCriterionThresholds,
  scoreAdvisorVehicles,
} from '../features/advisor/model/advisorCriteria.js'
import './AdvisorPage.css'

const RESULT_LIMIT = 12
const CRITERION_ICONS = Object.freeze({
  basis_preis: Wallet,
  null_hundert: Gauge,
  anhaengelast: Truck,
  karosserie: Boxes,
  segment: Layers3,
  kofferraum_l: Package,
  sitze: Users,
  isofix: ShieldCheck,
  wltp_reichweite: Route,
  batterie_netto: BatteryCharging,
  laden_10_80_min: Clock3,
  waermepumpe: Snowflake,
  verbrauch_l_100km: Fuel,
})

function formatValue(value, unit) {
  if (value === undefined || value === null || value === '') return '—'

  if (unit === '€') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (unit) return `${value} ${unit}`
  return String(value)
}

function getCriterionLabel(criterion, language) {
  const definition = getFieldDefinition(criterion.fieldKey)
  return definition?.labels?.[language] ?? criterion.fieldKey
}

function formatCriterionSelectedValue(t, criterion, value) {
  if (criterion.kind === 'boolean') {
    return value === 'yes'
      ? t('advisor.boolean.yes')
      : value === 'no'
        ? t('advisor.boolean.no')
        : value
  }

  return value
}

function getCriterionSelectedValues(criterion, criterionState) {
  if (criterion.kind !== 'select') return []
  return Array.isArray(criterionState?.selectedValues)
    ? criterionState.selectedValues.filter(Boolean)
    : []
}

function getCriterionRuleLabel(t, criterion, criterionState) {
  const definition = getFieldDefinition(criterion.fieldKey)
  if (criterion.kind === 'select') {
    const selectedValues = getCriterionSelectedValues(criterion, criterionState)
    if (selectedValues.length === 0) {
      return t('advisor.selectValueHint')
    }

    const formattedValues = selectedValues.map((value) => formatCriterionSelectedValue(t, criterion, value))
    if (formattedValues.length === 1) {
      return t('advisor.ruleExact', { value: formattedValues[0] })
    }

    return t('advisor.ruleExactMultiple', { values: formattedValues.join(', ') })
  }

  if (criterion.kind === 'boolean') {
    const selectedValue = criterionState?.selectedValue
    return selectedValue
      ? t('advisor.ruleExact', { value: formatCriterionSelectedValue(t, criterion, selectedValue) })
      : t('advisor.selectValueHint')
  }

  const thresholds = getCriterionThresholds(criterion, criterionState)

  if (!thresholds) return t('advisor.invalidThresholds')

  const formatter = (value) => formatValue(
    Number.isInteger(value) ? value : Number(value.toFixed(1)),
    definition?.unit
  )

  if (criterion.direction === 'higher-better') {
    return t('advisor.ruleHigher', {
      good: formatter(thresholds.good),
      ok: formatter(thresholds.ok),
      weak: formatter(thresholds.weakLimit),
    })
  }

  return t('advisor.ruleLower', {
    good: formatter(thresholds.good),
    ok: formatter(thresholds.ok),
    weak: formatter(thresholds.weakLimit),
  })
}

function getFitTranslationKey(fitStatus) {
  switch (fitStatus) {
    case 'strong':
      return 'advisor.fit.strong'
    case 'okay':
      return 'advisor.fit.okay'
    case 'warning':
      return 'advisor.fit.warning'
    default:
      return 'advisor.fit.neutral'
  }
}

function getCriterionIcon(criterionId) {
  return CRITERION_ICONS[criterionId] ?? Sparkles
}

function buildAdvisorCardFields(baseFields, evaluations) {
  const existingKeys = new Set(baseFields.map((field) => field.key))
  const extraFields = evaluations
    .map((evaluation, index) => {
      const definition = getFieldDefinition(evaluation.criterion.fieldKey)
      if (!definition || existingKeys.has(definition.key)) return null

      return {
        key: definition.key,
        label_de: definition.labels.de,
        label_en: definition.labels.en,
        visible: true,
        order: 100 + index,
        category: definition.category,
        unit: definition.unit,
      }
    })
    .filter(Boolean)
    .slice(0, 3)

  return [...baseFields, ...extraFields].sort((left, right) => left.order - right.order)
}

function buildAdvisorInsight(t, language, entry) {
  const leadingLabels = (entry.leadingEvaluations ?? [])
    .slice(0, 3)
    .map((evaluation) => getCriterionLabel(evaluation.criterion, language))

  if (leadingLabels.length === 0) {
    return t('advisor.resultReasonFallback')
  }

  return t('advisor.resultReasonLead', { criteria: leadingLabels.join(', ') })
}

function isCriterionOptionSelected(criterion, criterionState, optionValue) {
  if (criterion.kind === 'select') {
    return getCriterionSelectedValues(criterion, criterionState).some(
      (selectedValue) => selectedValue.toLowerCase() === optionValue.toLowerCase()
    )
  }

  if (criterion.kind === 'boolean') {
    return (criterionState?.selectedValue ?? '').toLowerCase() === optionValue.toLowerCase()
  }

  return false
}

function getFitTone(fitStatus) {
  switch (fitStatus) {
    case 'strong':
      return 'good'
    case 'okay':
      return 'ok'
    case 'warning':
      return 'warning'
    default:
      return null
  }
}

export default function AdvisorPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.startsWith('de') ? 'de' : 'en'

  const { cars: evCars, loading: evLoading } = useCarsCollection('ev_cars')
  const { cars: iceCars, loading: iceLoading } = useCarsCollection('ice_cars')
  const { fields: evDisplayFields, loading: evFieldsLoading } = useSettings()
  const { toggleVehicle, isSelected } = useCompareTray()

  const [draftDrivetrain, setDraftDrivetrain] = useState('all')
  const [draftCriteria, setDraftCriteria] = useState(() => createAdvisorCriteriaState())
  const [selectedCar, setSelectedCar] = useState(null)
  const [appliedSearch, setAppliedSearch] = useState(() => ({
    hasSearched: false,
    drivetrain: 'all',
    criteria: cloneAdvisorCriteriaState(createAdvisorCriteriaState()),
  }))

  const loading = evLoading || iceLoading || evFieldsLoading
  const allVehicles = useMemo(() => [...evCars, ...iceCars], [evCars, iceCars])
  const visibleCriteria = useMemo(() => getAdvisorCriteriaForDrivetrain(draftDrivetrain), [draftDrivetrain])
  const groupedCriteria = useMemo(() => getAdvisorCriteriaGroups(visibleCriteria), [visibleCriteria])
  const advisorEvFields = evDisplayFields.length > 0 ? evDisplayFields : EV_CARD_FIELDS

  const activeDraftCriteriaCount = useMemo(
    () => visibleCriteria.filter((criterion) => draftCriteria[criterion.id]?.enabled).length,
    [draftCriteria, visibleCriteria]
  )

  const searchResult = useMemo(() => {
    if (!appliedSearch.hasSearched) {
      return {
        activeCriteriaCount: 0,
        excludedCount: 0,
        totalCandidates: 0,
        results: [],
      }
    }

    return scoreAdvisorVehicles({
      vehicles: allVehicles,
      drivetrain: appliedSearch.drivetrain,
      criteriaState: appliedSearch.criteria,
    })
  }, [allVehicles, appliedSearch])

  const limitedResults = searchResult.results.slice(0, RESULT_LIMIT)

  const handleDrivetrainChange = (drivetrain) => {
    setDraftDrivetrain(drivetrain)
  }

  const handleToggleCriterion = (criterionId) => {
    setDraftCriteria((current) => ({
      ...current,
      [criterionId]: {
        ...current[criterionId],
        enabled: !current[criterionId]?.enabled,
      },
    }))
  }

  const handleCriterionValueChange = (criterionId, field, value) => {
    setDraftCriteria((current) => ({
      ...current,
      [criterionId]: {
        ...current[criterionId],
        [field]: field === 'selectedValue'
          ? value
          : field === 'selectedValues'
            ? value
            : value === ''
              ? ''
              : Number(value),
      },
    }))
  }

  const handleToggleCriterionOption = (criterion, optionValue) => {
    setDraftCriteria((current) => {
      const currentState = current[criterion.id] ?? {}

      if (criterion.kind === 'select') {
        const currentValues = getCriterionSelectedValues(criterion, currentState)
        const nextValues = currentValues.some((selectedValue) => selectedValue.toLowerCase() === optionValue.toLowerCase())
          ? currentValues.filter((selectedValue) => selectedValue.toLowerCase() !== optionValue.toLowerCase())
          : [...currentValues, optionValue]

        return {
          ...current,
          [criterion.id]: {
            ...currentState,
            selectedValues: nextValues,
          },
        }
      }

      const nextValue = currentState.selectedValue === optionValue ? '' : optionValue
      return {
        ...current,
        [criterion.id]: {
          ...currentState,
          selectedValue: nextValue,
        },
      }
    })
  }

  const handleSearch = () => {
    setAppliedSearch({
      hasSearched: true,
      drivetrain: draftDrivetrain,
      criteria: cloneAdvisorCriteriaState(draftCriteria),
    })
  }

  return (
    <div className="advisor-page app-page-shell">
      <section className="advisor-hero app-panel">
        <div className="advisor-hero-copy">
          <span className="app-kicker">{t('advisor.heroPurpose')}</span>
          <h1 className="app-title">{t('advisor.title')}</h1>
          <p className="app-subtitle">{t('advisor.subtitle')}</p>
        </div>
        <div className="advisor-status-grid">
          <div className="advisor-status-card">
            <Search size={16} />
            <strong>{t('advisor.statusSearch')}</strong>
          </div>
          <div className="advisor-status-card">
            <ToggleRight size={16} />
            <strong>{t('advisor.statusToggle')}</strong>
          </div>
          <div className="advisor-status-card">
            <Calculator size={16} />
            <strong>{t('advisor.statusFlow')}</strong>
          </div>
        </div>
      </section>

      <section className="advisor-section">
        <div className="advisor-section-header">
          <div>
            <span className="app-kicker">{t('advisor.setupPurpose')}</span>
            <h2 className="advisor-section-title">{t('advisor.setupTitle')}</h2>
            <p className="advisor-section-description">{t('advisor.setupDescription')}</p>
          </div>
        </div>

        <div className="advisor-toolbar">
          <div className="advisor-drive-toggle" role="tablist" aria-label={t('advisor.drivetrainLabel')}>
            {ADVISOR_DRIVETRAINS.map((drivetrain) => (
              <button
                key={drivetrain}
                type="button"
                className={`advisor-drive-btn${draftDrivetrain === drivetrain ? ' active' : ''}`}
                onClick={() => handleDrivetrainChange(drivetrain)}
              >
                {t(`advisor.drivetrains.${drivetrain}`)}
              </button>
            ))}
          </div>

          <div className="advisor-search-panel">
            <div className="advisor-search-copy">
              <span className="advisor-search-kicker">{t('advisor.searchPurpose')}</span>
              <strong>{t('advisor.searchTitle')}</strong>
              <p>
                {t('advisor.searchDescription', { count: activeDraftCriteriaCount })}
              </p>
            </div>
            <button
              type="button"
              className="advisor-search-button"
              onClick={handleSearch}
              disabled={loading}
            >
              <Search size={17} />
              {loading ? t('advisor.loadingVehicles') : t('advisor.searchCta')}
            </button>
          </div>
        </div>

        <div className="advisor-scale-legend" aria-label={t('advisor.searchPurpose')}>
          <span className="advisor-scale-chip advisor-scale-chip--good">
            <CheckCircle2 size={14} />
            {t('advisor.legend.good')}
          </span>
          <span className="advisor-scale-chip advisor-scale-chip--ok">
            <Sparkles size={14} />
            {t('advisor.legend.ok')}
          </span>
          <span className="advisor-scale-chip advisor-scale-chip--weak">
            <TriangleAlert size={14} />
            {t('advisor.legend.weak')}
          </span>
          <span className="advisor-scale-chip advisor-scale-chip--off">
            <ToggleLeft size={14} />
            {t('advisor.legend.off')}
          </span>
        </div>

        <div className="advisor-criteria-groups">
          {groupedCriteria.map((group) => (
            <section key={group.id} className="advisor-criteria-group">
              <div className="advisor-criteria-group-header">
                <div>
                  <span className="advisor-criteria-group-kicker">{t('advisor.groupKicker')}</span>
                  <h3>{t(`advisor.groups.${group.id}.title`)}</h3>
                </div>
                <p>{t(`advisor.groups.${group.id}.description`)}</p>
              </div>

              <div className="advisor-criteria-grid">
                {group.criteria.map((criterion) => {
                  const definition = getFieldDefinition(criterion.fieldKey)
                  const criterionState = draftCriteria[criterion.id]
                  const enabled = Boolean(criterionState?.enabled)
                  const CriterionIcon = getCriterionIcon(criterion.id)
                  const options = getAdvisorCriterionOptions(
                    criterion,
                    allVehicles.filter((vehicle) => criterion.appliesTo.includes(vehicle.vehicleType))
                  )

                  return (
                    <article
                      key={criterion.id}
                      className={`advisor-criterion-card${enabled ? '' : ' advisor-criterion-card--disabled'}`}
                    >
                      <div className="advisor-criterion-head">
                        <div className="advisor-criterion-copy">
                          <div className="advisor-criterion-title-row">
                            <span className="advisor-criterion-icon">
                              <CriterionIcon size={16} />
                            </span>
                            <div className="advisor-criterion-title-copy">
                              <span className="advisor-criterion-kicker">
                                {t(`advisor.appliesTo.${criterion.appliesTo.length === 2 ? 'both' : criterion.appliesTo[0]}`)}
                              </span>
                              <strong>{getCriterionLabel(criterion, language)}</strong>
                            </div>
                          </div>
                          <div className="advisor-criterion-pills">
                            <span className="advisor-criterion-pill advisor-criterion-pill--scope">
                              {t(`advisor.appliesTo.${criterion.appliesTo.length === 2 ? 'both' : criterion.appliesTo[0]}`)}
                            </span>
                            {criterion.kind === 'number' && (
                              <span className={`advisor-criterion-pill advisor-criterion-pill--${criterion.direction === 'higher-better' ? 'up' : 'down'}`}>
                                {criterion.direction === 'higher-better'
                                  ? t('advisor.moreIsBetter')
                                  : t('advisor.lessIsBetter')}
                              </span>
                            )}
                            {criterion.kind !== 'number' && (
                              <span className="advisor-criterion-pill advisor-criterion-pill--match">
                                {criterion.multi ? t('advisor.multiSelect') : t('advisor.exactMatch')}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`advisor-criterion-toggle${enabled ? ' active' : ''}`}
                          onClick={() => handleToggleCriterion(criterion.id)}
                          aria-pressed={enabled}
                          aria-label={enabled ? t('advisor.disableCriterion') : t('advisor.enableCriterion')}
                        >
                          {enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                      </div>

                      {criterion.kind === 'number' ? (
                        <div className="advisor-criterion-inputs">
                          <label className="advisor-criterion-input advisor-criterion-input--good">
                            <span>{t('advisor.goodThreshold')}</span>
                            <input
                              type="number"
                              min={criterion.input.min}
                              max={criterion.input.max}
                              step={criterion.input.step}
                              value={criterionState?.good ?? ''}
                              disabled={!enabled}
                              onChange={(event) => handleCriterionValueChange(criterion.id, 'good', event.target.value)}
                            />
                            <small>{definition?.unit ?? t('advisor.noUnit')}</small>
                          </label>
                          <label className="advisor-criterion-input advisor-criterion-input--ok">
                            <span>{t('advisor.okThreshold')}</span>
                            <input
                              type="number"
                              min={criterion.input.min}
                              max={criterion.input.max}
                              step={criterion.input.step}
                              value={criterionState?.ok ?? ''}
                              disabled={!enabled}
                              onChange={(event) => handleCriterionValueChange(criterion.id, 'ok', event.target.value)}
                            />
                            <small>{definition?.unit ?? t('advisor.noUnit')}</small>
                          </label>
                        </div>
                      ) : (
                        <div className="advisor-criterion-options">
                          <span className="advisor-criterion-options-label">
                            {criterion.multi ? t('advisor.desiredValues') : t('advisor.desiredValue')}
                          </span>
                          <div className="advisor-criterion-option-grid">
                            {options.map((option) => {
                              const selected = isCriterionOptionSelected(criterion, criterionState, option.value)
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`advisor-criterion-option${selected ? ' active' : ''}`}
                                  disabled={!enabled}
                                  onClick={() => handleToggleCriterionOption(criterion, option.value)}
                                  aria-pressed={selected}
                                >
                                  <span>{criterion.kind === 'boolean'
                                    ? formatCriterionSelectedValue(t, criterion, option.value)
                                    : option.label}</span>
                                  {selected && <Check size={14} />}
                                </button>
                              )
                            })}
                          </div>
                          <small className="advisor-criterion-options-help">
                            {criterion.multi ? t('advisor.multiSelectHelp') : t('advisor.exactMatchHelp')}
                          </small>
                        </div>
                      )}

                      <p className="advisor-criterion-rule">
                        {enabled ? getCriterionRuleLabel(t, criterion, criterionState) : t('advisor.criterionDisabledHint')}
                      </p>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="advisor-section advisor-section--results">
        <div className="advisor-section-header">
          <div>
            <span className="app-kicker">{t('advisor.resultsPurpose')}</span>
            <h2 className="advisor-section-title">{t('advisor.resultsTitle')}</h2>
            <p className="advisor-section-description">{t('advisor.resultsDescription')}</p>
          </div>
          <div className="advisor-results-metrics">
            <div className="advisor-results-metric">
              <span>{t('advisor.metricCandidates')}</span>
              <strong>{searchResult.totalCandidates}</strong>
            </div>
            <div className="advisor-results-metric">
              <span>{t('advisor.metricShown')}</span>
              <strong>{limitedResults.length}</strong>
            </div>
            <div className="advisor-results-metric">
              <span>{t('advisor.metricExcluded')}</span>
              <strong>{searchResult.excludedCount}</strong>
            </div>
          </div>
        </div>

        {!appliedSearch.hasSearched
          ? (
              <div className="advisor-placeholder">
                <Search size={36} />
                <p>{t('advisor.searchPending')}</p>
              </div>
            )
          : limitedResults.length === 0
            ? (
                <div className="advisor-placeholder">
                  <Search size={36} />
                  <p>{t('advisor.noResults')}</p>
                </div>
              )
            : (
                <>
                  <div className="advisor-result-grid">
                    {limitedResults.map((entry) => {
                      const { vehicle, totalScore, fitStatus, evaluations, rank } = entry
                      const fieldStatuses = Object.fromEntries(
                        evaluations
                          .filter((evaluation) => evaluation.status === 'good' || evaluation.status === 'ok' || evaluation.status === 'weak')
                          .map((evaluation) => [evaluation.criterion.fieldKey, evaluation.status])
                      )

                      const resultBadges = [
                        { label: `#${rank}`, tone: null },
                        { label: `${totalScore} ${t('advisor.points')}`, tone: getFitTone(fitStatus) },
                        { label: t(getFitTranslationKey(fitStatus)), tone: getFitTone(fitStatus) },
                      ]

                      return (
                        <CarCard
                          key={vehicle.id}
                          car={vehicle}
                          fields={buildAdvisorCardFields(vehicle.vehicleType === 'ice' ? ICE_CARD_FIELDS : advisorEvFields, evaluations)}
                          variant={vehicle.vehicleType}
                          onClick={() => setSelectedCar(vehicle)}
                          badges={resultBadges}
                          fieldStatuses={fieldStatuses}
                          insight={buildAdvisorInsight(t, language, entry)}
                          secondaryAction={{
                            label: t(isSelected(vehicle.id) ? 'advisor.removeCompare' : 'advisor.addCompare'),
                            active: isSelected(vehicle.id),
                            onClick: () => toggleVehicle(vehicle),
                          }}
                        />
                      )
                    })}
                  </div>

                  {searchResult.results.length > RESULT_LIMIT && (
                    <p className="advisor-results-note">
                      {t('advisor.resultsLimitNote', { shown: RESULT_LIMIT, total: searchResult.results.length })}
                    </p>
                  )}
                </>
              )
        }
      </section>

      <section className="advisor-section advisor-section--browse">
        <div className="advisor-section-header">
          <div>
            <span className="app-kicker">{t('advisor.browsePurpose')}</span>
            <h2 className="advisor-section-title">{t('advisor.browseTitle')}</h2>
            <p className="advisor-section-description">{t('advisor.browseDescription')}</p>
          </div>
        </div>
        <div className="advisor-browse-actions">
          <Link to="/autos" className="advisor-browse-card">
            <ArrowRight size={18} />
            <span>{t('advisor.browsePrimary')}</span>
          </Link>
          <Link to="/verbrenner" className="advisor-browse-card">
            <ArrowRight size={18} />
            <span>{t('advisor.browseSecondary')}</span>
          </Link>
        </div>
      </section>
      {selectedCar && <CarDetail car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  )
}
