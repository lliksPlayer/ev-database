import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightLeft,
  BadgeEuro,
  CalendarClock,
  Fuel,
  GaugeCircle,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  calculateTCO,
  buildYearlySeries,
  findBreakeven,
  getProfileAdjustedConsumption,
} from '../../features/comparison/model/tcoCalculation.js'
import {
  applyScenarioToAssumptions,
  createScenarioDefaults,
  hasEvInScenario,
  hasIceInScenario,
} from '../../features/comparison/model/scenarioAnalysis.js'
import { TotalCostChart, MonthlyCostChart } from './CostChart'
import './ResultsPanel.css'

export default function ResultsPanel({ vehicleA, assumptionsA, vehicleB, assumptionsB }) {
  const { t } = useTranslation()

  const years = Math.max(assumptionsA.profile.years || 8, assumptionsB.profile.years || 8)
  const tcoA = calculateTCO(vehicleA, assumptionsA, years)
  const tcoB = calculateTCO(vehicleB, assumptionsB, years)
  const seriesA = buildYearlySeries(vehicleA, assumptionsA, years)
  const seriesB = buildYearlySeries(vehicleB, assumptionsB, years)
  const breakeven = findBreakeven(vehicleA, assumptionsA, vehicleB, assumptionsB, years)

  const labelA = `${vehicleA.marke} ${vehicleA.modell}`
  const labelB = `${vehicleB.marke} ${vehicleB.modell}`
  const winnerIsA = tcoA.gesamt <= tcoB.gesamt
  const winnerLabel = winnerIsA ? labelA : labelB
  const loserLabel = winnerIsA ? labelB : labelA
  const totalDifference = Math.abs(tcoA.gesamt - tcoB.gesamt)
  const monthlyDifference = Math.abs(tcoA.monatlich - tcoB.monatlich)
  const totalKmA = (assumptionsA.profile.annualKm || 0) * years
  const totalKmB = (assumptionsB.profile.annualKm || 0) * years
  const perKmA = totalKmA > 0 ? tcoA.gesamt / totalKmA : 0
  const perKmB = totalKmB > 0 ? tcoB.gesamt / totalKmB : 0
  const profileInfoA = getProfileAdjustedConsumption(vehicleA, assumptionsA)
  const profileInfoB = getProfileAdjustedConsumption(vehicleB, assumptionsB)

  const formatEur = (value) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)

  const formatEurPrecise = (value) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)

  const formatNumber = (value) =>
    new Intl.NumberFormat('de-DE', {
      maximumFractionDigits: 0,
    }).format(value)

  const formatConsumption = (value, unit) =>
    `${new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value)} ${unit}`

  const formatSignedPercent = (value) => `${value > 0 ? '+' : ''}${value} %`
  const formatSignedEur = (value) => `${value > 0 ? '+' : ''}${formatEur(value)}`

  const costRows = [
    { key: 'kaufpreis', label: t('calc.results.costKaufpreis') },
    { key: 'infrastruktur', label: t('calc.results.costInfrastruktur') },
    { key: 'energie', label: t('calc.results.costEnergie') },
    { key: 'wartung', label: t('calc.results.costWartung') },
    { key: 'versicherung', label: t('calc.results.costVersicherung') },
    { key: 'steuer', label: t('calc.results.costSteuer') },
    { key: 'finanzierung', label: t('calc.results.costFinanzierung') },
    { key: 'restwert', label: t('calc.results.costRestwert') },
    { key: 'thg', label: t('calc.results.costThg') },
  ]

  const costBreakdownData = costRows
    .filter(({ key }) => !['restwert', 'thg'].includes(key))
    .map(({ key, label }) => ({
      name: label,
      [labelA]: Math.round((tcoA[key] || 0) / (years * 12)),
      [labelB]: Math.round((tcoB[key] || 0) / (years * 12)),
    }))
  const topCostDrivers = buildCostDriverInsights(tcoA, tcoB, t)
  const leadCostDriver = topCostDrivers[0]

  const breakevenWinnerLabel = breakeven?.winner === 'b' ? labelB : labelA
  const breakEvenText = breakeven
    ? (
        t('calc.results.breakevenDescription', { name: breakevenWinnerLabel, years: breakeven.year })
      )
    : t('calc.results.noBreakevenDescription', { name: winnerLabel })

  return (
    <div className="results-panel">
      <section className="results-hero">
        <div className="results-hero-copy">
          <span className="results-kicker">{t('calc.results.kicker')}</span>
          <h2>{t('calc.results.title')}</h2>
          <p>{t('calc.results.subtitle', { years })}</p>
        </div>

        <div className="results-outcome-card">
          <span className="results-outcome-label">{t('calc.results.bestChoice')}</span>
          <strong>{winnerLabel}</strong>
          <p>{t('calc.results.cheaperThan', { winner: winnerLabel, loser: loserLabel })}</p>
          <div className="results-outcome-metrics">
            <div>
              <span>{t('calc.results.savingsTotal')}</span>
              <strong>{formatEur(totalDifference)}</strong>
            </div>
            <div>
              <span>{t('calc.results.savingsMonthly')}</span>
              <strong>{formatEur(monthlyDifference)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="results-kpi-grid">
        <VehicleResultCard
          accent="a"
          label={labelA}
          total={tcoA.gesamt}
          monthly={tcoA.monatlich}
          perKm={perKmA}
          formatEur={formatEur}
          formatEurPrecise={formatEurPrecise}
          t={t}
        />
        <VehicleResultCard
          accent="b"
          label={labelB}
          total={tcoB.gesamt}
          monthly={tcoB.monatlich}
          perKm={perKmB}
          formatEur={formatEur}
          formatEurPrecise={formatEurPrecise}
          t={t}
        />
      </section>

      <section className="results-section">
        <div className="results-section-header">
          <div>
            <span className="results-section-kicker">{t('calc.results.sectionProfile')}</span>
            <h3>{t('calc.results.sectionProfileTitle')}</h3>
            <p>{t('calc.results.sectionProfileDescription')}</p>
          </div>
          <InsightPill icon={<GaugeCircle size={16} />} title={t('calc.results.profileInsightPill')} />
        </div>
        <div className="profile-insight-grid">
          <DrivingProfileCard
            accent="a"
            label={labelA}
            profileInfo={profileInfoA}
            formatConsumption={formatConsumption}
            formatSignedPercent={formatSignedPercent}
            t={t}
          />
          <DrivingProfileCard
            accent="b"
            label={labelB}
            profileInfo={profileInfoB}
            formatConsumption={formatConsumption}
            formatSignedPercent={formatSignedPercent}
            t={t}
          />
        </div>
      </section>

      <section className="results-section">
        <div className="results-section-header">
          <div>
            <span className="results-section-kicker">{t('calc.results.sectionDecision')}</span>
            <h3>{t('calc.results.sectionBreakEvenTitle')}</h3>
            <p>{breakEvenText}</p>
          </div>
          <InsightPill
            icon={<TrendingUp size={16} />}
            title={breakeven ? t('calc.results.breakevenAt', { years: breakeven.year }) : t('calc.results.noBreakeven')}
          />
        </div>
        <div className="results-chart-card">
          <TotalCostChart
            seriesA={seriesA}
            seriesB={seriesB}
            labelA={labelA}
            labelB={labelB}
            breakevenYear={breakeven?.year}
          />
        </div>
      </section>

      <section className="results-section">
        <div className="results-section-header">
          <div>
            <span className="results-section-kicker">{t('calc.results.sectionCostDrivers')}</span>
            <h3>{t('calc.results.sectionBreakdownTitle')}</h3>
            <p>{t('calc.results.sectionBreakdownDescription')}</p>
          </div>
          <InsightPill
            icon={<BadgeEuro size={16} />}
            title={
              leadCostDriver
                ? t('calc.results.driverLeadPill', { category: leadCostDriver.label })
                : t('calc.results.monthlyView')
            }
          />
        </div>
        {topCostDrivers.length > 0 && (
          <div className="driver-insight-grid">
            {topCostDrivers.map((driver) => (
              <CostDriverInsightCard
                key={driver.key}
                driver={driver}
                labelA={labelA}
                labelB={labelB}
                formatEur={formatEur}
                t={t}
              />
            ))}
          </div>
        )}
        <div className="results-chart-card">
          <MonthlyCostChart data={costBreakdownData} labelA={labelA} labelB={labelB} />
        </div>
      </section>

      <ScenarioSection
        key={`${vehicleA.id ?? labelA}-${vehicleB.id ?? labelB}`}
        vehicleA={vehicleA}
        vehicleB={vehicleB}
        assumptionsA={assumptionsA}
        assumptionsB={assumptionsB}
        baselineTcoA={tcoA}
        baselineTcoB={tcoB}
        labelA={labelA}
        labelB={labelB}
        years={years}
        t={t}
        formatEur={formatEur}
        formatNumber={formatNumber}
        formatSignedPercent={formatSignedPercent}
        formatSignedEur={formatSignedEur}
      />

      <section className="results-section">
        <div className="results-section-header">
          <div>
            <span className="results-section-kicker">{t('calc.results.sectionDetails')}</span>
            <h3>{t('calc.results.sectionTableTitle')}</h3>
            <p>{t('calc.results.sectionTableDescription')}</p>
          </div>
          <div className="results-mini-insights">
            <InsightPill icon={<CalendarClock size={16} />} title={`${years} ${t('calc.results.yearsLabel')}`} />
            <InsightPill icon={<ArrowRightLeft size={16} />} title={t('calc.results.compareAllCosts')} />
          </div>
        </div>
        <div className="results-table-card">
          <table className="cost-table">
            <thead>
              <tr>
                <th>{t('calc.results.costPosition')}</th>
                <th>{labelA}</th>
                <th>{labelB}</th>
              </tr>
            </thead>
            <tbody>
              {costRows.map(({ key, label }, index) => (
                <tr key={key} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td>{label}</td>
                  <td className="num">{formatEur(tcoA[key])}</td>
                  <td className="num">{formatEur(tcoB[key])}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td><strong>{t('calc.results.totalCost')}</strong></td>
                <td className="num"><strong>{formatEur(tcoA.gesamt)}</strong></td>
                <td className="num"><strong>{formatEur(tcoB.gesamt)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function VehicleResultCard({ accent, label, total, monthly, perKm, formatEur, formatEurPrecise, t }) {
  const metrics = [
    {
      key: 'total',
      label: t('calc.results.kpiTotal'),
      value: formatEur(total),
      icon: <BadgeEuro size={16} />,
    },
    {
      key: 'monthly',
      label: t('calc.results.kpiMonthly'),
      value: formatEur(monthly),
      icon: <CalendarClock size={16} />,
    },
    {
      key: 'perKm',
      label: t('calc.results.kpiPerKm'),
      value: formatEurPrecise(perKm),
      icon: <GaugeCircle size={16} />,
    },
  ]

  return (
    <div className={`vehicle-result-card vehicle-result-card--${accent}`}>
      <div className="vehicle-result-card-header">
        <span className="vehicle-result-card-label">{label}</span>
      </div>
      <div className="vehicle-result-card-metrics">
        {metrics.map((metric) => (
          <div key={metric.key} className="vehicle-result-metric">
            <div className="vehicle-result-metric-icon">{metric.icon}</div>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightPill({ icon, title }) {
  return (
    <div className="results-insight-pill">
      <span>{icon}</span>
      <strong>{title}</strong>
    </div>
  )
}

function DrivingProfileCard({ accent, label, profileInfo, formatConsumption, formatSignedPercent, t }) {
  const selectedMode = profileInfo.mode ?? 'normal'
  const deltaTone = profileInfo.deltaPercent < -1 ? 'better' : profileInfo.deltaPercent > 1 ? 'worse' : 'neutral'

  return (
    <div className={`profile-card profile-card--${accent}`}>
      <div className="profile-card-header">
        <span className="results-kicker">{label}</span>
        <strong>{t(`calc.profile.modes.${selectedMode}`)}</strong>
      </div>
      <p>{getProfileNarrative(profileInfo.vehicleType, selectedMode, t)}</p>
      <div className="profile-card-metrics">
        <div className="profile-card-metric">
          <span>{t('calc.results.profileBaseConsumption')}</span>
          <strong>{formatConsumption(profileInfo.baseConsumption, profileInfo.unit)}</strong>
        </div>
        <div className="profile-card-metric">
          <span>{t('calc.results.profileAdjustedConsumption')}</span>
          <strong>{formatConsumption(profileInfo.adjustedConsumption, profileInfo.unit)}</strong>
        </div>
      </div>
      <div className="profile-card-footer">
        <div className={`scenario-delta-pill scenario-delta-pill--${deltaTone}`}>
          <span>{t('calc.results.profileDelta')}</span>
          <strong>{formatSignedPercent(Number(profileInfo.deltaPercent.toFixed(1)))}</strong>
        </div>
        <div className="profile-share-list">
          <span>{t('calc.profile.cityLabel')} {Math.round(profileInfo.profile.city * 100)}%</span>
          <span>{t('calc.profile.ruralLabel')} {Math.round(profileInfo.profile.rural * 100)}%</span>
          <span>{t('calc.profile.highwayLabel')} {Math.round(profileInfo.profile.highway * 100)}%</span>
        </div>
      </div>
    </div>
  )
}

function CostDriverInsightCard({ driver, labelA, labelB, formatEur, t }) {
  const winnerLabel = driver.winner === 'a' ? labelA : labelB

  return (
    <div className={`driver-card driver-card--${driver.winner}`}>
      <div className="driver-card-header">
        <span className="results-kicker">{driver.label}</span>
        <strong>{winnerLabel}</strong>
      </div>
      <p>{t(driver.narrativeKey)}</p>
      <div className="driver-card-metrics">
        <div className="driver-card-metric">
          <span>{t('calc.results.driverAdvantage')}</span>
          <strong>{formatEur(driver.delta)}</strong>
        </div>
        <div className="driver-card-metric">
          <span>{labelA}</span>
          <strong>{formatEur(driver.valueA)}</strong>
        </div>
        <div className="driver-card-metric">
          <span>{labelB}</span>
          <strong>{formatEur(driver.valueB)}</strong>
        </div>
      </div>
    </div>
  )
}

function ScenarioSection({
  vehicleA,
  vehicleB,
  assumptionsA,
  assumptionsB,
  baselineTcoA,
  baselineTcoB,
  labelA,
  labelB,
  years,
  t,
  formatEur,
  formatNumber,
  formatSignedPercent,
  formatSignedEur,
}) {
  const scenarioDefaults = useMemo(
    () => createScenarioDefaults(assumptionsA, assumptionsB),
    [assumptionsA, assumptionsB]
  )
  const [scenario, setScenario] = useState(() => scenarioDefaults)

  const scenarioHasEv = hasEvInScenario(vehicleA, assumptionsA, vehicleB, assumptionsB)
  const scenarioHasIce = hasIceInScenario(vehicleA, assumptionsA, vehicleB, assumptionsB)

  const scenarioAssumptionsA = useMemo(
    () => applyScenarioToAssumptions(vehicleA, assumptionsA, scenario),
    [vehicleA, assumptionsA, scenario]
  )
  const scenarioAssumptionsB = useMemo(
    () => applyScenarioToAssumptions(vehicleB, assumptionsB, scenario),
    [vehicleB, assumptionsB, scenario]
  )

  const scenarioTcoA = calculateTCO(vehicleA, scenarioAssumptionsA, years)
  const scenarioTcoB = calculateTCO(vehicleB, scenarioAssumptionsB, years)
  const scenarioWinnerIsA = scenarioTcoA.gesamt <= scenarioTcoB.gesamt
  const scenarioWinnerLabel = scenarioWinnerIsA ? labelA : labelB
  const scenarioLoserLabel = scenarioWinnerIsA ? labelB : labelA
  const scenarioTotalDifference = Math.abs(scenarioTcoA.gesamt - scenarioTcoB.gesamt)
  const scenarioMonthlyDifference = Math.abs(scenarioTcoA.monatlich - scenarioTcoB.monatlich)
  const scenarioDeltaA = {
    total: scenarioTcoA.gesamt - baselineTcoA.gesamt,
    monthly: scenarioTcoA.monatlich - baselineTcoA.monatlich,
  }
  const scenarioDeltaB = {
    total: scenarioTcoB.gesamt - baselineTcoB.gesamt,
    monthly: scenarioTcoB.monatlich - baselineTcoB.monatlich,
  }

  const scenarioInsights = [
    `${formatNumber(scenario.annualKm)} km/Jahr`,
    `${t('calc.results.scenarioElectricityPill')}: ${scenarioHasEv ? formatSignedPercent(scenario.electricityDeltaPercent) : t('calc.results.scenarioInactive')}`,
    `${t('calc.results.scenarioFuelPill')}: ${scenarioHasIce ? formatSignedPercent(scenario.fuelDeltaPercent) : t('calc.results.scenarioInactive')}`,
  ]

  return (
    <section className="results-section">
      <div className="results-section-header">
        <div>
          <span className="results-section-kicker">{t('calc.results.sectionScenario')}</span>
          <h3>{t('calc.results.sectionScenarioTitle')}</h3>
          <p>{t('calc.results.sectionScenarioDescription')}</p>
        </div>
        <div className="results-mini-insights">
          <InsightPill icon={<SlidersHorizontal size={16} />} title={scenarioInsights[0]} />
          <InsightPill icon={<Zap size={16} />} title={scenarioInsights[1]} />
          <InsightPill icon={<Fuel size={16} />} title={scenarioInsights[2]} />
        </div>
      </div>

      <div className="scenario-grid">
        <div className="scenario-controls-card">
          <div className="scenario-controls-header">
            <div>
              <span className="results-kicker">{t('calc.results.sectionScenario')}</span>
              <h4>{t('calc.results.sectionScenarioControls')}</h4>
            </div>
            <button
              type="button"
              className="scenario-reset-button"
              onClick={() => setScenario(scenarioDefaults)}
            >
              <RotateCcw size={16} />
              {t('calc.results.scenarioReset')}
            </button>
          </div>

          <div className="scenario-controls-list">
            <ScenarioSlider
              label={t('calc.results.scenarioAnnualKm')}
              hint={t('calc.results.scenarioAnnualKmHint')}
              value={scenario.annualKm}
              min={5000}
              max={50000}
              step={500}
              unit={` ${t('calc.results.scenarioAnnualKmUnit')}`}
              onChange={(value) => setScenario((current) => ({ ...current, annualKm: value }))}
            />
            <ScenarioSlider
              label={t('calc.results.scenarioElectricityDelta')}
              hint={scenarioHasEv ? t('calc.results.scenarioElectricityHint') : t('calc.results.scenarioDisabledEv')}
              value={scenario.electricityDeltaPercent}
              min={-30}
              max={60}
              step={5}
              unit="%"
              disabled={!scenarioHasEv}
              onChange={(value) => setScenario((current) => ({ ...current, electricityDeltaPercent: value }))}
            />
            <ScenarioSlider
              label={t('calc.results.scenarioFuelDelta')}
              hint={scenarioHasIce ? t('calc.results.scenarioFuelHint') : t('calc.results.scenarioDisabledIce')}
              value={scenario.fuelDeltaPercent}
              min={-30}
              max={60}
              step={5}
              unit="%"
              disabled={!scenarioHasIce}
              onChange={(value) => setScenario((current) => ({ ...current, fuelDeltaPercent: value }))}
            />
          </div>
        </div>

        <div className="scenario-summary-card">
          <span className="results-kicker">{t('calc.results.scenarioOutcome')}</span>
          <strong>{scenarioWinnerLabel}</strong>
          <p>{t('calc.results.cheaperThan', { winner: scenarioWinnerLabel, loser: scenarioLoserLabel })}</p>
          <div className="results-outcome-metrics">
            <div>
              <span>{t('calc.results.scenarioGap')}</span>
              <strong>{formatEur(scenarioTotalDifference)}</strong>
            </div>
            <div>
              <span>{t('calc.results.scenarioMonthlyGap')}</span>
              <strong>{formatEur(scenarioMonthlyDifference)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="scenario-result-grid">
        <ScenarioResultCard
          accent="a"
          label={labelA}
          total={scenarioTcoA.gesamt}
          deltaTotal={scenarioDeltaA.total}
          deltaMonthly={scenarioDeltaA.monthly}
          formatEur={formatEur}
          formatSignedEur={formatSignedEur}
          t={t}
        />
        <ScenarioResultCard
          accent="b"
          label={labelB}
          total={scenarioTcoB.gesamt}
          deltaTotal={scenarioDeltaB.total}
          deltaMonthly={scenarioDeltaB.monthly}
          formatEur={formatEur}
          formatSignedEur={formatSignedEur}
          t={t}
        />
      </div>
    </section>
  )
}

function getProfileNarrative(vehicleType, profileMode, t) {
  if (profileMode === 'normal') {
    return t('calc.results.profileNarrativeNormal')
  }

  if (vehicleType === 'ev') {
    if (profileMode === 'city') return t('calc.results.profileNarrativeEvCity')
    if (profileMode === 'highway') return t('calc.results.profileNarrativeEvHighway')
    return t('calc.results.profileNarrativeEvRural')
  }

  if (profileMode === 'city') return t('calc.results.profileNarrativeIceCity')
  if (profileMode === 'highway') return t('calc.results.profileNarrativeIceHighway')
  return t('calc.results.profileNarrativeIceRural')
}

function buildCostDriverInsights(tcoA, tcoB, t) {
  const drivers = [
    {
      key: 'valueLoss',
      label: t('calc.results.driverValueLoss'),
      valueA: Math.max((tcoA.kaufpreis || 0) + (tcoA.restwert || 0), 0),
      valueB: Math.max((tcoB.kaufpreis || 0) + (tcoB.restwert || 0), 0),
      narrativeKey: 'calc.results.driverNarrativeValueLoss',
    },
    {
      key: 'energy',
      label: t('calc.results.costEnergie'),
      valueA: Math.max(tcoA.energie || 0, 0),
      valueB: Math.max(tcoB.energie || 0, 0),
      narrativeKey: 'calc.results.driverNarrativeEnergy',
    },
    {
      key: 'financing',
      label: t('calc.results.costFinanzierung'),
      valueA: Math.max(tcoA.finanzierung || 0, 0),
      valueB: Math.max(tcoB.finanzierung || 0, 0),
      narrativeKey: 'calc.results.driverNarrativeFinancing',
    },
    {
      key: 'running',
      label: t('calc.results.driverRunning'),
      valueA: Math.max((tcoA.wartung || 0) + (tcoA.versicherung || 0) + (tcoA.steuer || 0), 0),
      valueB: Math.max((tcoB.wartung || 0) + (tcoB.versicherung || 0) + (tcoB.steuer || 0), 0),
      narrativeKey: 'calc.results.driverNarrativeRunning',
    },
    {
      key: 'infrastructure',
      label: t('calc.results.costInfrastruktur'),
      valueA: Math.max(tcoA.infrastruktur || 0, 0),
      valueB: Math.max(tcoB.infrastruktur || 0, 0),
      narrativeKey: 'calc.results.driverNarrativeInfrastructure',
    },
  ]

  return drivers
    .map((driver) => {
      const delta = Math.abs(driver.valueA - driver.valueB)
      if (delta < 1) return null

      return {
        ...driver,
        delta,
        winner: driver.valueA <= driver.valueB ? 'a' : 'b',
      }
    })
    .filter(Boolean)
    .sort((left, right) => right.delta - left.delta)
    .slice(0, 3)
}

function ScenarioSlider({ label, hint, value, min, max, step, unit, disabled = false, onChange }) {
  return (
    <div className={`scenario-slider ${disabled ? 'scenario-slider--disabled' : ''}`}>
      <div className="scenario-slider-header">
        <div>
          <strong>{label}</strong>
          <span>{hint}</span>
        </div>
        <strong className="scenario-slider-value">
          {value > 0 && unit === '%' ? '+' : ''}
          {value}
          {unit}
        </strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="scenario-slider-scale">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

function ScenarioResultCard({ accent, label, total, deltaTotal, deltaMonthly, formatEur, formatSignedEur, t }) {
  const totalTone = deltaTotal < 0 ? 'better' : deltaTotal > 0 ? 'worse' : 'neutral'
  const monthlyTone = deltaMonthly < 0 ? 'better' : deltaMonthly > 0 ? 'worse' : 'neutral'

  return (
    <div className={`scenario-result-card scenario-result-card--${accent}`}>
      <span className="results-kicker">{label}</span>
      <strong className="scenario-result-total">{formatEur(total)}</strong>
      <p>{t('calc.results.scenarioComparedToBase')}</p>
      <div className="scenario-result-metrics">
        <div className={`scenario-delta-pill scenario-delta-pill--${totalTone}`}>
          <span>{t('calc.results.scenarioDeltaTotal')}</span>
          <strong>{deltaTotal === 0 ? t('calc.results.scenarioNoChange') : formatSignedEur(deltaTotal)}</strong>
        </div>
        <div className={`scenario-delta-pill scenario-delta-pill--${monthlyTone}`}>
          <span>{t('calc.results.scenarioDeltaMonthly')}</span>
          <strong>{deltaMonthly === 0 ? t('calc.results.scenarioNoChange') : formatSignedEur(deltaMonthly)}</strong>
        </div>
      </div>
    </div>
  )
}
