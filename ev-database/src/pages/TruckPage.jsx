import { useState } from 'react'
import { Link, NavLink, Navigate, useParams } from 'react-router-dom'
import {
  ArrowUpDown,
  ArrowLeft,
  BatteryCharging,
  BookOpenText,
  Building2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  Grid2x2,
  Leaf,
  Route,
  ShieldCheck,
  Search,
  TruckElectric,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { evaluateTruckAdvisorMatches } from '../features/trucks/model/truckAdvisorLogic.js'
import { TRUCK_ADVISOR_MODELS } from '../features/trucks/model/truckAdvisorModels.js'
import { calculateTruckTcoPreview } from '../features/trucks/model/truckTco.js'
import './TruckPage.css'

const TRUCK_SECTION_IDS = ['verstehen', 'wirtschaftlichkeit-betrieb', 'finden-vergleichen']
const SIGNAL_IDS = ['momentum', 'scale', 'toll', 'infrastructure']
const ECONOMIC_IDS = ['capex', 'toll', 'thg', 'opex']
const REGULATION_IDS = ['toll', 'thg', 'incentives', 'compliance']
const CHARGING_IDS = ['ac', 'ccs', 'hpc', 'mcs']
const USE_CASE_IDS = ['urban', 'regional', 'longhaul']
const FAQ_IDS = ['fit', 'charging', 'cost', 'timing']
const FIND_COMPARE_ROUTE_IDS = ['berater', 'modelle']
const OPERATIONS_ROUTE_IDS = ['business-case', 'laden-betrieb', 'regulatorik']

const HUB_ICONS = Object.freeze({
  verstehen: BookOpenText,
  'wirtschaftlichkeit-betrieb': CircleDollarSign,
  'finden-vergleichen': TruckElectric,
})

const SIGNAL_ICONS = Object.freeze({
  momentum: TrendingUp,
  scale: Building2,
  toll: CircleDollarSign,
  infrastructure: BatteryCharging,
})

const ECONOMIC_ICONS = Object.freeze({
  capex: CircleDollarSign,
  toll: Route,
  thg: Leaf,
  opex: ShieldCheck,
})

const REGULATION_ICONS = Object.freeze({
  toll: Route,
  thg: Leaf,
  incentives: CircleDollarSign,
  compliance: ShieldCheck,
})

const CHARGING_ICONS = Object.freeze({
  ac: Building2,
  ccs: BatteryCharging,
  hpc: Clock3,
  mcs: Zap,
})

const USE_CASE_ICONS = Object.freeze({
  urban: Building2,
  regional: Route,
  longhaul: TruckElectric,
})

const FAQ_ICONS = Object.freeze({
  fit: Route,
  charging: BatteryCharging,
  cost: CircleDollarSign,
  timing: TruckElectric,
})

const FIND_COMPARE_ICONS = Object.freeze({
  berater: TruckElectric,
  modelle: Grid2x2,
})

const OPERATIONS_ROUTE_ICONS = Object.freeze({
  'business-case': CircleDollarSign,
  'laden-betrieb': BatteryCharging,
  regulatorik: ShieldCheck,
})

const FIND_COMPARE_FLOW_IDS = ['profile', 'compare', 'business']
const TRUCK_WORKSPACE_STEP_IDS = ['useCase', 'route', 'charging', 'operations', 'refinement', 'results']
const INITIAL_TRUCK_WORKSPACE = Object.freeze({
  useCase: 'regional',
  dailyKm: 280,
  rangeBuffer: 15,
  routePredictability: 'stable',
  returnToDepot: true,
  depotCharging: true,
  publicFastCharge: false,
  chargeWindow: 'overnight',
  gridStatus: 'unclear',
  payloadNeed: 18,
  vehicleFormat: 'any',
  trailerUse: 'optional',
  chargingStandard: 'ccs',
  modelQuery: '',
  sortKey: 'fit',
  sortOrder: 'desc',
})

const SECTION_VISUAL_ICONS = Object.freeze({
  verstehen: [BookOpenText, TrendingUp, Route],
  'wirtschaftlichkeit-betrieb': [CircleDollarSign, BatteryCharging, ShieldCheck],
  'finden-vergleichen': [TruckElectric, Grid2x2, Zap],
})

function TruckVisualRail({ icons, compact = false }) {
  return (
    <div className={`truck-visual-rail${compact ? ' truck-visual-rail--compact' : ''}`} aria-hidden="true">
      <div className="truck-visual-track" />
      {icons.map((VisualIcon, index) => (
        <div
          key={index}
          className="truck-visual-node"
          style={{ '--truck-delay': `${index * 0.18}s` }}
        >
          <span className="truck-visual-card">
            <VisualIcon size={compact ? 17 : 20} />
          </span>
          <span className="truck-visual-dot" />
        </div>
      ))}
    </div>
  )
}

function countTruckWorkspaceFilters(state) {
  let count = 0

  if (state.useCase) count += 1
  if (state.dailyKm > 0) count += 1
  if (state.rangeBuffer > 0) count += 1
  if (state.routePredictability) count += 1
  if (state.returnToDepot) count += 1
  if (state.depotCharging) count += 1
  if (state.publicFastCharge) count += 1
  if (state.chargeWindow) count += 1
  if (state.gridStatus) count += 1
  if (state.payloadNeed > 0) count += 1
  if (state.vehicleFormat !== 'any') count += 1
  if (state.trailerUse !== 'optional') count += 1
  if (state.chargingStandard !== 'ccs') count += 1
  if (state.modelQuery.trim()) count += 1

  return count
}

function rankChargingStandard(value) {
  return value === 'mcs' ? 2 : 1
}

function sortTruckMatches(matches, sortKey, sortOrder) {
  const direction = sortOrder === 'asc' ? 1 : -1

  return [...matches].sort((a, b) => {
    let comparison = 0

    switch (sortKey) {
      case 'range':
        comparison = a.maxRangeKm - b.maxRangeKm
        break
      case 'payload':
        comparison = a.maxPayloadT - b.maxPayloadT
        break
      case 'charging':
        comparison = rankChargingStandard(a.chargingStandard) - rankChargingStandard(b.chargingStandard)
        break
      case 'model':
        comparison = `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, 'de')
        break
      case 'fit':
      default:
        comparison = a.score - b.score
        if (comparison === 0) comparison = a.maxRangeKm - b.maxRangeKm
        break
    }

    return comparison * direction
  })
}

function getTruckUseCaseLabel(t, useCaseId) {
  return t(`truck.workspace.useCases.${useCaseId}`)
}

function getTruckFormatLabel(t, formatId) {
  return t(`truck.workspace.vehicleFormat.${formatId}`)
}

function evaluateTruckBusinessCase(state, leadCard) {
  if (!leadCard) {
    return {
      stage: 'blocked',
      leverage: state.dailyKm >= 220 ? 'midMileage' : 'selectiveMileage',
      risk: !state.depotCharging && !state.publicFastCharge ? 'missingChargeBase' : 'noOperationalFit',
      next: 'reworkProfile',
    }
  }

  let stage = 'review'
  if ((leadCard.tone === 'excellent' || leadCard.tone === 'good') && state.depotCharging && state.gridStatus === 'secured') {
    stage = 'ready'
  } else if (leadCard.tone === 'excellent' || leadCard.tone === 'good') {
    stage = 'pilot'
  }

  let leverage = 'selectiveMileage'
  if (state.dailyKm >= 350) leverage = 'highMileage'
  else if (state.dailyKm >= 220) leverage = 'midMileage'

  let risk = 'stableBase'
  if (!state.depotCharging && !state.publicFastCharge) {
    risk = 'missingChargeBase'
  } else if (state.depotCharging && state.gridStatus === 'none') {
    risk = 'gridMissing'
  } else if (state.chargingStandard === 'mcs' && leadCard.chargingStandard !== 'mcs') {
    risk = 'mcsGap'
  } else if (leadCard.watchouts.includes('rangeTight')) {
    risk = 'rangeTight'
  } else if (leadCard.watchouts.includes('payloadTight')) {
    risk = 'payloadTight'
  } else if (leadCard.watchouts.includes('chargeWindowWeak')) {
    risk = 'chargeWindowTight'
  }

  let next = 'runPilot'
  if (stage === 'ready') next = 'buildBusinessCase'
  else if (state.depotCharging && state.gridStatus !== 'secured') next = 'clarifyGrid'
  else if (!state.depotCharging && state.publicFastCharge) next = 'pricePublicCharging'
  else if (state.chargingStandard === 'mcs' && leadCard.chargingStandard !== 'mcs') next = 'testCcsFallback'
  else if (!leadCard) next = 'reworkProfile'

  return { stage, leverage, risk, next }
}

function getUiLocale(language) {
  return language?.startsWith('de') ? 'de-DE' : 'en-US'
}

function formatCurrency(value, language, compact = false) {
  return new Intl.NumberFormat(getUiLocale(language), {
    style: 'currency',
    currency: 'EUR',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value)
}

function formatPercent(value, language) {
  return new Intl.NumberFormat(getUiLocale(language), {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDecimal(value, language, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(getUiLocale(language), {
    maximumFractionDigits,
  }).format(value)
}

function TruckDisclosureSection({
  id,
  kicker,
  title,
  description,
  quickFacts,
  expanded,
  onToggle,
  expandLabel,
  collapseLabel,
  children,
}) {
  return (
    <section id={id} className="truck-section truck-section--disclosure">
      <div className="truck-disclosure-top">
        <div className="truck-section-copy">
          <span className="truck-kicker">{kicker}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <button type="button" className="truck-disclosure-toggle" onClick={onToggle}>
          <span>{expanded ? collapseLabel : expandLabel}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className="truck-quickfacts">
        {quickFacts.map((fact) => (
          <article key={fact.id} className="truck-quickfact">
            <span className="truck-card-kicker">{fact.label}</span>
            <strong>{fact.value}</strong>
          </article>
        ))}
      </div>

      {expanded ? <div className="truck-disclosure-content">{children}</div> : null}
    </section>
  )
}

function UnderstandingSubnav({ t }) {
  return (
    <section className="truck-section truck-section--subnav">
      <div className="truck-subnav">
        {[
          ['whyNow', 'truck-signals'],
          ['usecases', 'truck-usecases'],
          ['comparison', 'truck-comparison'],
          ['faq', 'truck-faq'],
        ].map(([itemId, anchorId]) => (
          <a key={itemId} href={`#${anchorId}`} className="truck-subnav-link">
            {t(`truck.understandingSubnav.${itemId}`)}
          </a>
        ))}
      </div>
    </section>
  )
}

function TruckAccordionSection({ id, kicker, title, description, items }) {
  const [openItemId, setOpenItemId] = useState(items[0]?.id ?? null)

  return (
    <section id={id} className="truck-section">
      <div className="truck-section-copy">
        <span className="truck-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="truck-accordion">
        {items.map((item) => {
          const isOpen = openItemId === item.id

          return (
            <article key={item.id} className={`truck-accordion-item${isOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="truck-accordion-toggle"
                onClick={() => setOpenItemId((current) => (current === item.id ? null : item.id))}
                aria-expanded={isOpen}
              >
                <div className="truck-accordion-head">
                  {item.purpose ? <span className="truck-card-kicker">{item.purpose}</span> : null}
                  <h3>{item.question}</h3>
                </div>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isOpen ? (
                <div className="truck-accordion-content">
                  <p>{item.answer}</p>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function OperationsOverviewSection({ t }) {
  return (
    <section className="truck-section">
      <div className="truck-section-copy">
        <span className="truck-kicker">{t('truck.opsOverviewPurpose')}</span>
        <h2>{t('truck.opsOverviewTitle')}</h2>
        <p>{t('truck.opsOverviewDescription')}</p>
      </div>

      <div className="truck-topic-grid">
        {['lever', 'risk', 'decision'].map((itemId) => (
          <article key={itemId} className="truck-topic-card truck-topic-card--overview">
            <span className="truck-card-kicker">{t(`truck.opsOverview.cards.${itemId}.purpose`)}</span>
            <h3>{t(`truck.opsOverview.cards.${itemId}.title`)}</h3>
            <strong className="truck-economics-stat">{t(`truck.opsOverview.cards.${itemId}.stat`)}</strong>
            <p>{t(`truck.opsOverview.cards.${itemId}.description`)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function OperationsRouteNav({ t }) {
  return (
    <section className="truck-section truck-section--subnav">
      <div className="truck-subnav">
        <NavLink end to="/e-lkw/wirtschaftlichkeit-betrieb" className={({ isActive }) => `truck-subnav-link${isActive ? ' truck-subnav-link--active' : ''}`}>
          {t('truck.opsRouteNav.overview')}
        </NavLink>
        {OPERATIONS_ROUTE_IDS.map((itemId) => (
          <NavLink
            key={itemId}
            to={`/e-lkw/wirtschaftlichkeit-betrieb/${itemId}`}
            className={({ isActive }) => `truck-subnav-link${isActive ? ' truck-subnav-link--active' : ''}`}
          >
            {t(`truck.opsRouteNav.${itemId}`)}
          </NavLink>
        ))}
      </div>
    </section>
  )
}

function OperationsAreaOverviewSection({ t }) {
  return (
    <section id="truck-ops-overview" className="truck-section">
      <div className="truck-section-copy">
        <span className="truck-kicker">{t('truck.opsSplitPurpose')}</span>
        <h2>{t('truck.opsSplitTitle')}</h2>
        <p>{t('truck.opsSplitDescription')}</p>
      </div>

      <div className="truck-pillar-grid">
        {OPERATIONS_ROUTE_IDS.map((routeId) => {
          const RouteIcon = OPERATIONS_ROUTE_ICONS[routeId]

          return (
            <article key={routeId} className="truck-pillar-card truck-pillar-card--opsroute">
              <div className="truck-pillar-icon">
                <RouteIcon size={18} />
              </div>
              <span className="truck-card-kicker">{t(`truck.opsAreas.${routeId}.purpose`)}</span>
              <h3>{t(`truck.opsAreas.${routeId}.title`)}</h3>
              <p>{t(`truck.opsAreas.${routeId}.description`)}</p>
              <Link to={`/e-lkw/wirtschaftlichkeit-betrieb/${routeId}`} className="truck-inline-link">
                {t('truck.openSection')}
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SignalsSection({ t, expanded, onToggle }) {
  return (
    <TruckDisclosureSection
      id="truck-signals"
      kicker={t('truck.signalsPurpose')}
      title={t('truck.signalsTitle')}
      description={t('truck.signalsDescription')}
      quickFacts={SIGNAL_IDS.map((signalId) => ({
        id: signalId,
        label: t(`truck.signals.${signalId}.purpose`),
        value: t(`truck.signals.${signalId}.stat`),
      }))}
      expanded={expanded}
      onToggle={onToggle}
      expandLabel={t('truck.showDetails')}
      collapseLabel={t('truck.hideDetails')}
    >
      <div className="truck-signal-grid">
        {SIGNAL_IDS.map((signalId) => {
          const SignalIcon = SIGNAL_ICONS[signalId]
          return (
            <article key={signalId} className="truck-signal-card">
              <div className="truck-signal-head">
                <span className="truck-signal-icon">
                  <SignalIcon size={18} />
                </span>
                <span className="truck-card-kicker">{t(`truck.signals.${signalId}.purpose`)}</span>
              </div>
              <strong className="truck-signal-stat">{t(`truck.signals.${signalId}.stat`)}</strong>
              <h3>{t(`truck.signals.${signalId}.title`)}</h3>
              <p>{t(`truck.signals.${signalId}.description`)}</p>
            </article>
          )
        })}
      </div>
    </TruckDisclosureSection>
  )
}

function EconomicsSection({ t, expanded, onToggle }) {
  return (
    <TruckDisclosureSection
      id="truck-economics"
      kicker={t('truck.economicsPurpose')}
      title={t('truck.economicsTitle')}
      description={t('truck.economicsDescription')}
      quickFacts={ECONOMIC_IDS.map((itemId) => ({
        id: itemId,
        label: t(`truck.economics.${itemId}.purpose`),
        value: t(`truck.economics.${itemId}.stat`),
      }))}
      expanded={expanded}
      onToggle={onToggle}
      expandLabel={t('truck.showDetails')}
      collapseLabel={t('truck.hideDetails')}
    >
      <div className="truck-topic-grid">
        {ECONOMIC_IDS.map((itemId) => {
          const EconomicIcon = ECONOMIC_ICONS[itemId]
          return (
            <article key={itemId} className="truck-topic-card truck-topic-card--economics">
              <div className="truck-topic-head">
                <span className="truck-topic-icon">
                  <EconomicIcon size={18} />
                </span>
                <div>
                  <span className="truck-card-kicker">{t(`truck.economics.${itemId}.purpose`)}</span>
                  <h3>{t(`truck.economics.${itemId}.title`)}</h3>
                </div>
              </div>
              <strong className="truck-economics-stat">{t(`truck.economics.${itemId}.stat`)}</strong>
              <p>{t(`truck.economics.${itemId}.description`)}</p>
            </article>
          )
        })}
      </div>
    </TruckDisclosureSection>
  )
}

function RolloutSection({ t }) {
  return (
    <section id="truck-rollout" className="truck-section">
      <div className="truck-section-copy">
        <span className="truck-kicker">{t('truck.rolloutPurpose')}</span>
        <h2>{t('truck.rolloutTitle')}</h2>
        <p>{t('truck.rolloutDescription')}</p>
      </div>

      <div className="truck-rollout-grid">
        {['one', 'two', 'three', 'four'].map((stepId, index) => (
          <article key={stepId} className="truck-rollout-card">
            <span className="truck-rollout-step">{String(index + 1).padStart(2, '0')}</span>
            <h3>{t(`truck.rollout.steps.${stepId}.title`)}</h3>
            <p>{t(`truck.rollout.steps.${stepId}.description`)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function RegulationSection({ t, expanded, onToggle }) {
  return (
    <TruckDisclosureSection
      id="truck-regulation"
      kicker={t('truck.regulationPurpose')}
      title={t('truck.regulationTitle')}
      description={t('truck.regulationDescription')}
      quickFacts={REGULATION_IDS.map((itemId) => ({
        id: itemId,
        label: t(`truck.regulation.${itemId}.purpose`),
        value: t(`truck.regulation.${itemId}.stat`),
      }))}
      expanded={expanded}
      onToggle={onToggle}
      expandLabel={t('truck.showDetails')}
      collapseLabel={t('truck.hideDetails')}
    >
      <div className="truck-topic-grid">
        {REGULATION_IDS.map((itemId) => {
          const RegulationIcon = REGULATION_ICONS[itemId]
          return (
            <article key={itemId} className="truck-topic-card truck-topic-card--regulation">
              <div className="truck-topic-head">
                <span className="truck-topic-icon">
                  <RegulationIcon size={18} />
                </span>
                <div>
                  <span className="truck-card-kicker">{t(`truck.regulation.${itemId}.purpose`)}</span>
                  <h3>{t(`truck.regulation.${itemId}.title`)}</h3>
                </div>
              </div>
              <strong className="truck-economics-stat">{t(`truck.regulation.${itemId}.stat`)}</strong>
              <p>{t(`truck.regulation.${itemId}.description`)}</p>
            </article>
          )
        })}
      </div>
    </TruckDisclosureSection>
  )
}

function ChargingSection({ t, expanded, onToggle }) {
  return (
    <TruckDisclosureSection
      id="truck-charging"
      kicker={t('truck.chargingPurpose')}
      title={t('truck.chargingTitle')}
      description={t('truck.chargingDescription')}
      quickFacts={CHARGING_IDS.map((systemId) => ({
        id: systemId,
        label: t(`truck.charging.${systemId}.title`),
        value: t(`truck.charging.${systemId}.power`),
      }))}
      expanded={expanded}
      onToggle={onToggle}
      expandLabel={t('truck.showDetails')}
      collapseLabel={t('truck.hideDetails')}
    >
      <div className="truck-charging-grid">
        {CHARGING_IDS.map((systemId) => {
          const ChargingIcon = CHARGING_ICONS[systemId]
          return (
            <article key={systemId} className="truck-charging-card">
              <div className="truck-topic-head">
                <span className="truck-topic-icon">
                  <ChargingIcon size={18} />
                </span>
                <div>
                  <span className="truck-card-kicker">{t(`truck.charging.${systemId}.purpose`)}</span>
                  <h3>{t(`truck.charging.${systemId}.title`)}</h3>
                </div>
              </div>
              <strong className="truck-charging-stat">{t(`truck.charging.${systemId}.power`)}</strong>
              <p>{t(`truck.charging.${systemId}.description`)}</p>
              <ul className="truck-topic-list">
                <li>{t(`truck.charging.${systemId}.time`)}</li>
                <li>{t(`truck.charging.${systemId}.useCase`)}</li>
              </ul>
            </article>
          )
        })}
      </div>
    </TruckDisclosureSection>
  )
}

function UseCasesSection({ t, expanded, onToggle }) {
  return (
    <TruckDisclosureSection
      id="truck-usecases"
      kicker={t('truck.useCasesPurpose')}
      title={t('truck.useCasesTitle')}
      description={t('truck.useCasesDescription')}
      quickFacts={USE_CASE_IDS.map((useCaseId) => ({
        id: useCaseId,
        label: t(`truck.useCases.${useCaseId}.purpose`),
        value: t(`truck.useCases.${useCaseId}.title`),
      }))}
      expanded={expanded}
      onToggle={onToggle}
      expandLabel={t('truck.showDetails')}
      collapseLabel={t('truck.hideDetails')}
    >
      <div className="truck-topic-grid">
        {USE_CASE_IDS.map((useCaseId) => {
          const UseCaseIcon = USE_CASE_ICONS[useCaseId]
          return (
            <article key={useCaseId} className="truck-topic-card truck-topic-card--usecase">
              <div className="truck-topic-head">
                <span className="truck-topic-icon">
                  <UseCaseIcon size={18} />
                </span>
                <div>
                  <span className="truck-card-kicker">{t(`truck.useCases.${useCaseId}.purpose`)}</span>
                  <h3>{t(`truck.useCases.${useCaseId}.title`)}</h3>
                </div>
              </div>
              <p>{t(`truck.useCases.${useCaseId}.description`)}</p>
              <div className="truck-usecase-points">
                <span>{t(`truck.useCases.${useCaseId}.strength`)}</span>
                <span>{t(`truck.useCases.${useCaseId}.constraint`)}</span>
                <span>{t(`truck.useCases.${useCaseId}.focus`)}</span>
              </div>
            </article>
          )
        })}
      </div>
    </TruckDisclosureSection>
  )
}

function TechnologyCompareSection({ t }) {
  return (
    <section id="truck-comparison" className="truck-section">
      <div className="truck-section-copy">
        <span className="truck-kicker">{t('truck.comparisonPurpose')}</span>
        <h2>{t('truck.comparisonTitle')}</h2>
        <p>{t('truck.comparisonDescription')}</p>
      </div>

      <div className="truck-topic-grid">
        {['bev', 'diesel', 'hydrogen'].map((itemId) => (
          <article key={itemId} className="truck-topic-card truck-topic-card--comparison">
            <span className="truck-card-kicker">{t(`truck.comparison.cards.${itemId}.purpose`)}</span>
            <h3>{t(`truck.comparison.cards.${itemId}.title`)}</h3>
            <strong className="truck-economics-stat">{t(`truck.comparison.cards.${itemId}.stat`)}</strong>
            <p>{t(`truck.comparison.cards.${itemId}.description`)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function TruckFaqSection({ t }) {
  const items = FAQ_IDS.map((faqId) => ({
    id: faqId,
    purpose: t(`truck.faq.cards.${faqId}.purpose`),
    question: t(`truck.faq.cards.${faqId}.question`),
    answer: t(`truck.faq.cards.${faqId}.answer`),
  }))

  return (
    <TruckAccordionSection
      id="truck-faq"
      kicker={t('truck.faqPurpose')}
      title={t('truck.faqTitle')}
      description={t('truck.faqDescription')}
      items={items}
    />
  )
}

function TruckIllustrationSection({ t }) {
  return (
    <section className="truck-section truck-section--illustration">
      <div className="truck-illustration-copy">
        <span className="truck-kicker">{t('truck.findVisualPurpose')}</span>
        <h2>{t('truck.findVisualTitle')}</h2>
        <p>{t('truck.findVisualDescription')}</p>
        <div className="truck-topic-tags">
          {['route', 'charging', 'tco'].map((itemId) => (
            <span key={itemId}>{t(`truck.findVisual.tags.${itemId}`)}</span>
          ))}
        </div>
      </div>

      <div className="truck-illustration-stage" aria-hidden="true">
        <svg
          className="truck-illustration-svg"
          viewBox="0 0 620 320"
          role="img"
          aria-label={t('truck.findVisualAria')}
        >
          <defs>
            <linearGradient id="truckLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(74, 222, 128, 0.05)" />
              <stop offset="45%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="rgba(74, 222, 128, 0.05)" />
            </linearGradient>
            <linearGradient id="truckBodyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#17372d" />
              <stop offset="100%" stopColor="#0f1d19" />
            </linearGradient>
          </defs>

          <path className="truck-illustration-grid" d="M20 265 H600 M65 45 V275 M215 30 V275 M365 30 V275 M515 45 V275" />
          <path className="truck-illustration-route" d="M54 245 C145 195 222 170 314 180 C402 189 474 156 572 92" />

          <g className="truck-illustration-vehicle">
            <rect x="118" y="122" width="278" height="88" rx="26" className="truck-illustration-body" />
            <path d="M352 122 H432 C455 122 473 140 479 163 L489 210 H352 Z" className="truck-illustration-cab" />
            <path d="M388 142 H434 C446 142 455 149 460 163 L424 163 C411 163 398 157 388 142 Z" className="truck-illustration-window" />
            <rect x="150" y="138" width="78" height="18" rx="9" className="truck-illustration-deck" />
            <rect x="146" y="173" width="182" height="14" rx="7" className="truck-illustration-deck truck-illustration-deck--secondary" />
            <circle cx="190" cy="228" r="34" className="truck-illustration-wheelOuter" />
            <circle cx="190" cy="228" r="17" className="truck-illustration-wheelInner" />
            <circle cx="418" cy="228" r="34" className="truck-illustration-wheelOuter" />
            <circle cx="418" cy="228" r="17" className="truck-illustration-wheelInner" />
            <rect x="100" y="214" width="26" height="10" rx="5" className="truck-illustration-bumper" />
            <rect x="478" y="182" width="18" height="12" rx="6" className="truck-illustration-light" />
          </g>

          <g className="truck-illustration-nodeGroup">
            <circle cx="146" cy="84" r="10" className="truck-illustration-nodePulse" />
            <circle cx="146" cy="84" r="5" className="truck-illustration-nodeCore" />
            <path d="M146 94 V120 H198" className="truck-illustration-nodeLink" />
          </g>

          <g className="truck-illustration-nodeGroup" style={{ '--truck-delay': '0.25s' }}>
            <circle cx="314" cy="68" r="10" className="truck-illustration-nodePulse" />
            <circle cx="314" cy="68" r="5" className="truck-illustration-nodeCore" />
            <path d="M314 78 V110" className="truck-illustration-nodeLink" />
          </g>

          <g className="truck-illustration-nodeGroup" style={{ '--truck-delay': '0.45s' }}>
            <circle cx="514" cy="102" r="10" className="truck-illustration-nodePulse" />
            <circle cx="514" cy="102" r="5" className="truck-illustration-nodeCore" />
            <path d="M514 112 V170 H470" className="truck-illustration-nodeLink" />
          </g>
        </svg>

        <div className="truck-illustration-metrics">
          {['range', 'charging', 'decision'].map((itemId) => (
            <article key={itemId} className="truck-illustration-metric">
              <span className="truck-card-kicker">{t(`truck.findVisual.metrics.${itemId}.purpose`)}</span>
              <strong>{t(`truck.findVisual.metrics.${itemId}.value`)}</strong>
              <p>{t(`truck.findVisual.metrics.${itemId}.label`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function TruckInfographicSection({ t }) {
  return (
    <section className="truck-section">
      <div className="truck-section-copy">
        <span className="truck-kicker">{t('truck.findFlowPurpose')}</span>
        <h2>{t('truck.findFlowTitle')}</h2>
        <p>{t('truck.findFlowDescription')}</p>
      </div>

      <div className="truck-infographic-grid">
        {FIND_COMPARE_FLOW_IDS.map((itemId, index) => (
          <article key={itemId} className="truck-infographic-card">
            <span className="truck-rollout-step">{String(index + 1).padStart(2, '0')}</span>
            <span className="truck-card-kicker">{t(`truck.findFlow.steps.${itemId}.purpose`)}</span>
            <h3>{t(`truck.findFlow.steps.${itemId}.title`)}</h3>
            <strong className="truck-economics-stat">{t(`truck.findFlow.steps.${itemId}.value`)}</strong>
            <p>{t(`truck.findFlow.steps.${itemId}.description`)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function FindCompareRouteNav({ t }) {
  return (
    <section className="truck-section truck-section--subnav">
      <div className="truck-subnav">
        <NavLink end to="/e-lkw/finden-vergleichen" className={({ isActive }) => `truck-subnav-link${isActive ? ' truck-subnav-link--active' : ''}`}>
          {t('truck.findRouteNav.overview')}
        </NavLink>
        {FIND_COMPARE_ROUTE_IDS.map((itemId) => (
          <NavLink
            key={itemId}
            to={`/e-lkw/finden-vergleichen/${itemId}`}
            className={({ isActive }) => `truck-subnav-link${isActive ? ' truck-subnav-link--active' : ''}`}
          >
            {t(`truck.findRouteNav.${itemId}`)}
          </NavLink>
        ))}
      </div>
    </section>
  )
}

function FindCompareOverviewSection({ t }) {
  return (
    <section className="truck-section">
      <div className="truck-section-copy">
        <span className="truck-kicker">{t('truck.findComparePurpose')}</span>
        <h2>{t('truck.findCompareTitle')}</h2>
        <p>{t('truck.findCompareDescription')}</p>
      </div>

      <div className="truck-pillar-grid">
        {FIND_COMPARE_ROUTE_IDS.map((itemId) => {
          const ItemIcon = FIND_COMPARE_ICONS[itemId]
          return (
            <article key={itemId} className="truck-pillar-card truck-pillar-card--findroute">
              <div className="truck-pillar-icon">
                <ItemIcon size={18} />
              </div>
              <span className="truck-card-kicker">{t(`truck.findAreas.${itemId}.purpose`)}</span>
              <h3>{t(`truck.findAreas.${itemId}.title`)}</h3>
              <p>{t(`truck.findAreas.${itemId}.description`)}</p>
              <Link to={`/e-lkw/finden-vergleichen/${itemId}`} className="truck-inline-link">
                {t('truck.openSection')}
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function FindCompareHelpSection({ t }) {
  return (
    <TruckAccordionSection
      id="truck-find-help"
      kicker={t('truck.findHelpPurpose')}
      title={t('truck.findHelpTitle')}
      description={t('truck.findHelpDescription')}
      items={['advisor', 'models', 'tco'].map((itemId) => ({
        id: itemId,
        question: t(`truck.findHelp.items.${itemId}.question`),
        answer: t(`truck.findHelp.items.${itemId}.answer`),
      }))}
    />
  )
}

function TruckModelsSection({ t, language }) {
  const models = [...TRUCK_ADVISOR_MODELS].sort((a, b) =>
    `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, language === 'de' ? 'de' : 'en')
  )
  const brandCount = new Set(models.map((item) => item.brand)).size

  return (
    <section className="truck-section">
      <div className="truck-section-copy">
        <span className="truck-kicker">{t('truck.findModelsPurpose')}</span>
        <h2>{t('truck.findModelsTitle')}</h2>
        <p>{t('truck.findModelsDescription')}</p>
      </div>

      <div className="truck-workspace-statusbar truck-workspace-statusbar--models">
        <span className="truck-workspace-statuspill">
          {t('truck.findModelsNote', { models: models.length, brands: brandCount })}
        </span>
      </div>

      <div className="truck-pillar-grid">
        {models.map((model) => (
          <article key={model.id} className="truck-pillar-card truck-pillar-card--truckmodel">
            <span className="truck-card-kicker">{model.brand}</span>
            <h3>{model.model}</h3>
            <div className="truck-usecase-points">
              {model.useCases.map((itemId) => (
                <span key={itemId}>{getTruckUseCaseLabel(t, itemId)}</span>
              ))}
            </div>

            <div className="truck-workspace-result-specs">
              <span className="truck-workspace-result-spec">
                <BatteryCharging size={14} />
                <strong>{model.batteryKwh} kWh</strong>
              </span>
              <span className="truck-workspace-result-spec">
                <Zap size={14} />
                <strong>{model.dcChargeKw} kW DC</strong>
              </span>
              <span className="truck-workspace-result-spec">
                <CircleDollarSign size={14} />
                <strong>{formatCurrency(model.purchasePriceEur, language, true)}</strong>
              </span>
            </div>

            <div className="truck-workspace-result-metrics">
              <div className="truck-workspace-result-metric">
                <span>{t('truck.workspace.results.fields.range')}</span>
                <strong>{model.maxRangeKm} km</strong>
              </div>
              <div className="truck-workspace-result-metric">
                <span>{t('truck.workspace.results.fields.payload')}</span>
                <strong>{model.maxPayloadT} t</strong>
              </div>
              <div className="truck-workspace-result-metric">
                <span>{t('truck.workspace.results.fields.standard')}</span>
                <strong>{t(`truck.workspace.chargingStandard.${model.chargingStandard}`)}</strong>
              </div>
            </div>

            <div className="truck-topic-tags">
              <span>{model.vehicleFormats.map((itemId) => getTruckFormatLabel(t, itemId)).join(' / ')}</span>
              <span>
                {model.trailerCapable
                  ? t('truck.workspace.results.trailerStates.ready')
                  : t('truck.workspace.results.trailerStates.notReady')}
              </span>
            </div>

            <Link to="/e-lkw/finden-vergleichen/berater" className="truck-inline-link">
              {t('truck.findModelsOpenAdvisor')}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

function TruckAdvisorWorkspace({ t, language }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [draftState, setDraftState] = useState(INITIAL_TRUCK_WORKSPACE)
  const [appliedState, setAppliedState] = useState(INITIAL_TRUCK_WORKSPACE)

  const activeFilters = countTruckWorkspaceFilters(appliedState)
  const { requiredRangeKm, matches: rawResultCards, excludedCount } = evaluateTruckAdvisorMatches(appliedState)
  const normalizedQuery = appliedState.modelQuery.trim().toLowerCase()
  const matchesWithTco = rawResultCards.map((item) => ({
    ...item,
    tcoPreview: calculateTruckTcoPreview(appliedState, item),
  }))
  const filteredMatches = normalizedQuery
    ? matchesWithTco.filter((item) => `${item.brand} ${item.model}`.toLowerCase().includes(normalizedQuery))
    : matchesWithTco
  const bestFitMatches = sortTruckMatches(filteredMatches, 'fit', 'desc')
  const resultCards = sortTruckMatches(filteredMatches, appliedState.sortKey, appliedState.sortOrder)
  const hiddenBySearchCount = rawResultCards.length - filteredMatches.length
  const strongMatches = resultCards.filter((item) => item.tone === 'excellent' || item.tone === 'good').length
  const modelCatalogCount = rawResultCards.length + excludedCount
  const brandCatalogCount = new Set(TRUCK_ADVISOR_MODELS.map((item) => item.brand)).size
  const leadCard = bestFitMatches[0] ?? null
  const nextCard = bestFitMatches[1] ?? null
  const leadGap = leadCard && nextCard ? leadCard.score - nextCard.score : null
  const businessCase = evaluateTruckBusinessCase(appliedState, leadCard)
  const leadTco = leadCard?.tcoPreview ?? null
  const statusItems = [
    {
      id: 'useCase',
      label: t('truck.workspace.status.useCase'),
      value: t(`truck.workspace.useCases.${appliedState.useCase}`),
    },
    {
      id: 'dailyKm',
      label: t('truck.workspace.status.dailyKm'),
      value: `${appliedState.dailyKm} km`,
    },
    {
      id: 'requiredRange',
      label: t('truck.workspace.status.requiredRange'),
      value: `${requiredRangeKm} km`,
    },
    {
      id: 'chargeBase',
      label: t('truck.workspace.status.chargeBase'),
      value: appliedState.depotCharging ? t('truck.workspace.status.depotYes') : t('truck.workspace.status.depotNo'),
    },
    {
      id: 'chargeWindow',
      label: t('truck.workspace.status.chargeWindow'),
      value: t(`truck.workspace.chargeWindow.${appliedState.chargeWindow}`),
    },
    ...(appliedState.trailerUse !== 'optional'
      ? [{
        id: 'trailerUse',
        label: t('truck.workspace.status.trailerUse'),
        value: t(`truck.workspace.trailerUse.${appliedState.trailerUse}`),
      }]
      : []),
    ...(appliedState.vehicleFormat !== 'any'
      ? [{
        id: 'vehicleFormat',
        label: t('truck.workspace.status.vehicleFormat'),
        value: t(`truck.workspace.vehicleFormat.${appliedState.vehicleFormat}`),
      }]
      : []),
    ...(appliedState.chargingStandard !== 'ccs'
      ? [{
        id: 'chargingStandard',
        label: t('truck.workspace.status.chargingStandard'),
        value: t(`truck.workspace.chargingStandard.${appliedState.chargingStandard}`),
      }]
      : []),
    ...(appliedState.routePredictability !== 'stable'
      ? [{
        id: 'routePredictability',
        label: t('truck.workspace.status.routePredictability'),
        value: t(`truck.workspace.routePredictability.${appliedState.routePredictability}`),
      }]
      : []),
  ]

  function updateDraft(field, value) {
    setDraftState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetDraft() {
    setDraftState(INITIAL_TRUCK_WORKSPACE)
    setAppliedState(INITIAL_TRUCK_WORKSPACE)
  }

  function applyDraft() {
    setAppliedState(draftState)
  }

  return (
    <section className="truck-section truck-section--workspace">
      <div className="truck-workspace-header">
        <div className="truck-section-copy">
          <span className="truck-kicker">{t('truck.workspace.purpose')}</span>
          <h2>{t('truck.workspace.title')}</h2>
          <p>{t('truck.workspace.description')}</p>
        </div>
      </div>

      <div className={`truck-workspace${sidebarCollapsed ? ' truck-workspace--collapsed' : ''}`}>
          <aside className="truck-workspace-sidebar">
            <div className="truck-workspace-sidebar-head">
              <div className="truck-section-copy">
                <span className="truck-kicker">{t('truck.workspace.sidebarTitle')}</span>
                {!sidebarCollapsed ? <p>{t('truck.workspace.sidebarDescription')}</p> : null}
              </div>

              <button
                type="button"
                className="truck-workspace-toggle"
                onClick={() => setSidebarCollapsed((current) => !current)}
                aria-expanded={!sidebarCollapsed}
              >
                {sidebarCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                <span>{sidebarCollapsed ? t('truck.workspace.expandShort') : t('truck.workspace.collapse')}</span>
              </button>
            </div>

            {sidebarCollapsed ? (
              <div className="truck-workspace-mini">
                {TRUCK_WORKSPACE_STEP_IDS.map((stepId, index) => (
                  <div key={stepId} className="truck-workspace-mini-step">
                    <span className="truck-rollout-step">{String(index + 1).padStart(2, '0')}</span>
                    <span className="truck-card-kicker">{t(`truck.workspace.steps.${stepId}.short`)}</span>
                  </div>
                ))}
                <button type="button" className="truck-action truck-action--primary" onClick={applyDraft}>
                  <Search size={16} />
                  {t('truck.workspace.searchShort')}
                </button>
              </div>
            ) : (
              <>
                <div className="truck-workspace-group">
                  <div className="truck-workspace-group-head">
                    <span className="truck-rollout-step">01</span>
                    <div>
                      <h3>{t('truck.workspace.steps.useCase.title')}</h3>
                      <p>{t('truck.workspace.steps.useCase.description')}</p>
                    </div>
                  </div>
                  <div className="truck-workspace-choice-row">
                    {['urban', 'regional', 'longhaul'].map((itemId) => (
                      <button
                        key={itemId}
                        type="button"
                        className={`truck-workspace-choice${draftState.useCase === itemId ? ' is-active' : ''}`}
                        onClick={() => updateDraft('useCase', itemId)}
                      >
                        {t(`truck.workspace.useCases.${itemId}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="truck-workspace-group">
                  <div className="truck-workspace-group-head">
                    <span className="truck-rollout-step">02</span>
                    <div>
                      <h3>{t('truck.workspace.steps.route.title')}</h3>
                      <p>{t('truck.workspace.steps.route.description')}</p>
                    </div>
                  </div>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.dailyKm')}</span>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      step="10"
                      value={draftState.dailyKm}
                      onChange={(event) => updateDraft('dailyKm', Number(event.target.value))}
                    />
                  </label>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.rangeBuffer')}</span>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="5"
                      value={draftState.rangeBuffer}
                      onChange={(event) => updateDraft('rangeBuffer', Number(event.target.value))}
                    />
                  </label>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.routePredictability')}</span>
                    <select
                      value={draftState.routePredictability}
                      onChange={(event) => updateDraft('routePredictability', event.target.value)}
                    >
                      {['stable', 'mixed', 'volatile'].map((itemId) => (
                        <option key={itemId} value={itemId}>
                          {t(`truck.workspace.routePredictability.${itemId}`)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="truck-workspace-switch">
                    <input
                      type="checkbox"
                      checked={draftState.returnToDepot}
                      onChange={(event) => updateDraft('returnToDepot', event.target.checked)}
                    />
                    <span>{t('truck.workspace.fields.returnToDepot')}</span>
                  </label>
                </div>

                <div className="truck-workspace-group">
                  <div className="truck-workspace-group-head">
                    <span className="truck-rollout-step">03</span>
                    <div>
                      <h3>{t('truck.workspace.steps.charging.title')}</h3>
                      <p>{t('truck.workspace.steps.charging.description')}</p>
                    </div>
                  </div>

                  <label className="truck-workspace-switch">
                    <input
                      type="checkbox"
                      checked={draftState.depotCharging}
                      onChange={(event) => updateDraft('depotCharging', event.target.checked)}
                    />
                    <span>{t('truck.workspace.fields.depotCharging')}</span>
                  </label>

                  <label className="truck-workspace-switch">
                    <input
                      type="checkbox"
                      checked={draftState.publicFastCharge}
                      onChange={(event) => updateDraft('publicFastCharge', event.target.checked)}
                    />
                    <span>{t('truck.workspace.fields.publicFastCharge')}</span>
                  </label>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.chargeWindow')}</span>
                    <select
                      value={draftState.chargeWindow}
                      onChange={(event) => updateDraft('chargeWindow', event.target.value)}
                    >
                      {['overnight', 'between_shifts', 'tight'].map((itemId) => (
                        <option key={itemId} value={itemId}>
                          {t(`truck.workspace.chargeWindow.${itemId}`)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.gridStatus')}</span>
                    <select
                      value={draftState.gridStatus}
                      onChange={(event) => updateDraft('gridStatus', event.target.value)}
                    >
                      {['secured', 'unclear', 'none'].map((itemId) => (
                        <option key={itemId} value={itemId}>
                          {t(`truck.workspace.gridStatus.${itemId}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="truck-workspace-group">
                  <div className="truck-workspace-group-head">
                    <span className="truck-rollout-step">04</span>
                    <div>
                      <h3>{t('truck.workspace.steps.operations.title')}</h3>
                      <p>{t('truck.workspace.steps.operations.description')}</p>
                    </div>
                  </div>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.payloadNeed')}</span>
                    <input
                      type="number"
                      min="6"
                      max="30"
                      step="1"
                      value={draftState.payloadNeed}
                      onChange={(event) => updateDraft('payloadNeed', Number(event.target.value))}
                    />
                  </label>
                </div>

                <div className="truck-workspace-group">
                  <div className="truck-workspace-group-head">
                    <span className="truck-rollout-step">05</span>
                    <div>
                      <h3>{t('truck.workspace.steps.refinement.title')}</h3>
                      <p>{t('truck.workspace.steps.refinement.description')}</p>
                    </div>
                  </div>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.vehicleFormat')}</span>
                    <div className="truck-workspace-choice-row">
                      {['any', 'rigid', 'tractor'].map((itemId) => (
                        <button
                          key={itemId}
                          type="button"
                          className={`truck-workspace-choice${draftState.vehicleFormat === itemId ? ' is-active' : ''}`}
                          onClick={() => updateDraft('vehicleFormat', itemId)}
                        >
                          {t(`truck.workspace.vehicleFormat.${itemId}`)}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.trailerUse')}</span>
                    <div className="truck-workspace-choice-row">
                      {['not_required', 'optional', 'required'].map((itemId) => (
                        <button
                          key={itemId}
                          type="button"
                          className={`truck-workspace-choice${draftState.trailerUse === itemId ? ' is-active' : ''}`}
                          onClick={() => updateDraft('trailerUse', itemId)}
                        >
                          {t(`truck.workspace.trailerUse.${itemId}`)}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.chargingStandard')}</span>
                    <div className="truck-workspace-choice-row">
                      {['ccs', 'mcs'].map((itemId) => (
                        <button
                          key={itemId}
                          type="button"
                          className={`truck-workspace-choice${draftState.chargingStandard === itemId ? ' is-active' : ''}`}
                          onClick={() => updateDraft('chargingStandard', itemId)}
                        >
                          {t(`truck.workspace.chargingStandard.${itemId}`)}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>

                <div className="truck-workspace-group">
                  <div className="truck-workspace-group-head">
                    <span className="truck-rollout-step">06</span>
                    <div>
                      <h3>{t('truck.workspace.steps.results.title')}</h3>
                      <p>{t('truck.workspace.steps.results.description')}</p>
                    </div>
                  </div>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.modelQuery')}</span>
                    <div className="truck-workspace-inputwrap">
                      <Search size={16} />
                      <input
                        type="text"
                        value={draftState.modelQuery}
                        placeholder={t('truck.workspace.placeholders.modelQuery')}
                        onChange={(event) => updateDraft('modelQuery', event.target.value)}
                      />
                    </div>
                  </label>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.sortKey')}</span>
                    <select
                      value={draftState.sortKey}
                      onChange={(event) => updateDraft('sortKey', event.target.value)}
                    >
                      {['fit', 'range', 'payload', 'charging', 'model'].map((itemId) => (
                        <option key={itemId} value={itemId}>
                          {t(`truck.workspace.sortKey.${itemId}`)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="truck-workspace-field">
                    <span>{t('truck.workspace.fields.sortOrder')}</span>
                    <div className="truck-workspace-choice-row">
                      {['desc', 'asc'].map((itemId) => (
                        <button
                          key={itemId}
                          type="button"
                          className={`truck-workspace-choice${draftState.sortOrder === itemId ? ' is-active' : ''}`}
                          onClick={() => updateDraft('sortOrder', itemId)}
                        >
                          {t(`truck.workspace.sortOrder.${itemId}`)}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>

                <div className="truck-workspace-actions">
                  <button type="button" className="truck-action truck-action--primary" onClick={applyDraft}>
                    {t('truck.workspace.search')}
                  </button>
                  <button type="button" className="truck-action truck-action--secondary" onClick={resetDraft}>
                    {t('truck.workspace.reset')}
                  </button>
                </div>
              </>
            )}
          </aside>

          <div className="truck-workspace-results">
            <div className="truck-workspace-statusbar">
              <span className="truck-workspace-statuspill">
                {t('truck.workspace.status.applied')}: {activeFilters}
              </span>
              {statusItems.map((item) => (
                <span key={item.id} className="truck-workspace-statuspill">
                  {item.label}: {item.value}
                </span>
              ))}
            </div>

            <div className="truck-workspace-summary">
              <article className="truck-workspace-summary-card">
                <span className="truck-card-kicker">{t('truck.workspace.summary.filtersPurpose')}</span>
                <strong>{activeFilters}</strong>
                <p>{t('truck.workspace.summary.filtersText')}</p>
              </article>
              <article className="truck-workspace-summary-card">
                <span className="truck-card-kicker">{t('truck.workspace.summary.matchesPurpose')}</span>
                <strong>{strongMatches}</strong>
                <p>{t('truck.workspace.summary.matchesText')}</p>
              </article>
              <article className="truck-workspace-summary-card">
                <span className="truck-card-kicker">{t('truck.workspace.summary.catalogPurpose')}</span>
                <strong>{modelCatalogCount}</strong>
                <p>{t('truck.workspace.summary.catalogText', { brands: brandCatalogCount })}</p>
              </article>
            </div>

            <div className="truck-workspace-resultbar">
              <div className="truck-workspace-resultbar-summary">
                <span className="truck-card-kicker">{t('truck.workspace.results.toolbarPurpose')}</span>
                <p>
                  <strong>{resultCards.length}</strong> {t('truck.workspace.results.toolbarMatches')}
                </p>
              </div>
              <div className="truck-workspace-resultbar-pills">
                {excludedCount > 0 ? (
                  <span className="truck-workspace-resultpill">
                    {excludedCount} {t('truck.workspace.summary.nextValue')}
                  </span>
                ) : null}
                {appliedState.modelQuery.trim() ? (
                  <span className="truck-workspace-resultpill">
                    <Search size={14} />
                    <span>{appliedState.modelQuery}</span>
                  </span>
                ) : null}
                <span className="truck-workspace-resultpill">
                  <ArrowUpDown size={14} />
                  <span>
                    {t(`truck.workspace.sortKey.${appliedState.sortKey}`)} · {t(`truck.workspace.sortOrder.${appliedState.sortOrder}`)}
                  </span>
                </span>
                {hiddenBySearchCount > 0 ? (
                  <span className="truck-workspace-resultpill">
                    {t('truck.workspace.results.hiddenBySearch', { count: hiddenBySearchCount })}
                  </span>
                ) : null}
              </div>
            </div>

            {leadCard ? (
              <div className="truck-workspace-insight">
                <article className="truck-workspace-insight-card">
                  <span className="truck-card-kicker">{t('truck.workspace.results.leadPurpose')}</span>
                  <h3>{`${leadCard.brand} ${leadCard.model}`}</h3>
                  <p>
                    {leadGap !== null && leadGap > 0
                      ? t('truck.workspace.results.leadAhead', { gap: leadGap })
                      : t('truck.workspace.results.leadSolo')}
                  </p>
                </article>
                <article className="truck-workspace-insight-card">
                  <span className="truck-card-kicker">{t('truck.workspace.results.whyFit')}</span>
                  <ul className="truck-topic-list">
                    {leadCard.strengths.map((reason) => (
                      <li key={reason}>{t(`truck.workspace.results.reasons.${reason}`)}</li>
                    ))}
                  </ul>
                </article>
                <article className="truck-workspace-insight-card">
                  <span className="truck-card-kicker">{t('truck.workspace.results.watchouts')}</span>
                  {leadCard.watchouts.length > 0 ? (
                    <ul className="truck-topic-list">
                      {leadCard.watchouts.map((reason) => (
                        <li key={reason}>{t(`truck.workspace.results.reasons.${reason}`)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{t('truck.workspace.results.noWatchouts')}</p>
                  )}
                </article>
              </div>
            ) : null}

            <section className="truck-section truck-section--workspace-results">
              <div className="truck-section-copy">
                <span className="truck-kicker">{t('truck.workspace.resultsPurpose')}</span>
                <h2>{t('truck.workspace.resultsTitle')}</h2>
                <p>{t('truck.workspace.resultsDescription')}</p>
              </div>

              {resultCards.length > 0 ? (
                <>
                  <div className="truck-workspace-result-grid">
                    {resultCards.map((card) => (
                      <article key={card.id} className={`truck-workspace-result-card is-${card.tone}`}>
                        <div className="truck-workspace-result-head">
                          <div>
                            <span className="truck-card-kicker">{card.brand}</span>
                            <h3>{card.model}</h3>
                          </div>
                          <div className="truck-workspace-result-score">
                            <strong>{card.score}</strong>
                            <span>{t(`truck.workspace.results.states.${card.tone}`)}</span>
                          </div>
                        </div>
                        <div className="truck-workspace-result-specs">
                          <span className="truck-workspace-result-spec">
                            <BatteryCharging size={14} />
                            <strong>{card.batteryKwh} kWh</strong>
                          </span>
                          <span className="truck-workspace-result-spec">
                            <Zap size={14} />
                            <strong>{card.dcChargeKw} kW DC</strong>
                          </span>
                          <span className="truck-workspace-result-spec">
                            <CircleDollarSign size={14} />
                            <strong>{formatCurrency(card.purchasePriceEur, language, true)}</strong>
                          </span>
                        </div>
                        <div className="truck-workspace-result-metrics">
                          <div className="truck-workspace-result-metric">
                            <span>{t('truck.workspace.results.fields.range')}</span>
                            <strong>{card.maxRangeKm} km</strong>
                          </div>
                          <div className="truck-workspace-result-metric">
                            <span>{t('truck.workspace.results.fields.payload')}</span>
                            <strong>{card.maxPayloadT} t</strong>
                          </div>
                          <div className="truck-workspace-result-metric">
                            <span>{t('truck.workspace.results.fields.charging')}</span>
                            <strong>{t(`truck.workspace.results.charging.${card.chargingMode}`)}</strong>
                          </div>
                          <div className="truck-workspace-result-metric">
                            <span>{t('truck.workspace.results.fields.standard')}</span>
                            <strong>{t(`truck.workspace.chargingStandard.${card.chargingStandard}`)}</strong>
                          </div>
                        </div>
                        <div className="truck-workspace-result-tags">
                          <span className="truck-workspace-result-tag">
                            {card.vehicleFormats.map((item) => t(`truck.workspace.vehicleFormat.${item}`)).join(' / ')}
                          </span>
                          <span className="truck-workspace-result-tag">
                            {card.trailerCapable
                              ? t('truck.workspace.results.trailerStates.ready')
                              : t('truck.workspace.results.trailerStates.notReady')}
                          </span>
                        </div>
                        <div className="truck-workspace-result-sections">
                          <div className="truck-workspace-result-section">
                            <span className="truck-card-kicker">{t('truck.workspace.results.whyFit')}</span>
                            <ul className="truck-topic-list">
                              {card.strengths.map((reason) => (
                                <li key={reason}>{t(`truck.workspace.results.reasons.${reason}`)}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="truck-workspace-result-section">
                            <span className="truck-card-kicker">{t('truck.workspace.results.watchouts')}</span>
                            {card.watchouts.length > 0 ? (
                              <ul className="truck-topic-list">
                                {card.watchouts.map((reason) => (
                                  <li key={reason}>{t(`truck.workspace.results.reasons.${reason}`)}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>{t('truck.workspace.results.noWatchouts')}</p>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  {excludedCount > 0 ? (
                    <div className="truck-note">
                      <ShieldCheck size={16} />
                      <p>{t('truck.workspace.results.excludedNote', { count: excludedCount })}</p>
                    </div>
                  ) : null}

                  {leadTco ? (
                    <div className="truck-workspace-tco">
                      <div className="truck-section-copy">
                        <span className="truck-kicker">{t('truck.workspace.tco.purpose')}</span>
                        <h2>{t('truck.workspace.tco.title')}</h2>
                        <p>{t('truck.workspace.tco.description')}</p>
                      </div>

                      <div className="truck-workspace-tco-hero">
                        <article className={`truck-workspace-tco-card is-${leadTco.tone}`}>
                          <span className="truck-card-kicker">{t('truck.workspace.tco.leadPurpose')}</span>
                          <h3>{`${leadCard.brand} ${leadCard.model}`}</h3>
                          <strong className="truck-workspace-tco-balance">
                            {formatCurrency(Math.abs(leadTco.fiveYearDelta), language)}
                          </strong>
                          <p>
                            {leadTco.fiveYearDelta <= 0
                              ? t('truck.workspace.tco.advantageText')
                              : t('truck.workspace.tco.extraCostText')}
                          </p>
                          <p className="truck-workspace-tco-caption">
                            {leadTco.breakEvenYears && leadTco.breakEvenYears <= leadTco.years
                              ? t('truck.workspace.tco.breakEvenBefore', {
                                years: formatDecimal(leadTco.breakEvenYears, language),
                              })
                              : t('truck.workspace.tco.breakEvenAfter')}
                          </p>
                        </article>

                        <div className="truck-workspace-tco-summary">
                          <article className="truck-workspace-tco-mini">
                            <span className="truck-card-kicker">{t('truck.workspace.tco.summary.annualBenefit')}</span>
                            <strong>{formatCurrency(leadTco.annualOperatingBenefit, language)}</strong>
                            <p>{t('truck.workspace.tco.summary.annualBenefitText')}</p>
                          </article>
                          <article className="truck-workspace-tco-mini">
                            <span className="truck-card-kicker">{t('truck.workspace.tco.summary.capexDelta')}</span>
                            <strong>{formatCurrency(leadTco.acquisitionDelta, language)}</strong>
                            <p>{t('truck.workspace.tco.summary.capexDeltaText')}</p>
                          </article>
                          <article className="truck-workspace-tco-mini">
                            <span className="truck-card-kicker">{t('truck.workspace.tco.summary.chargingMix')}</span>
                            <strong>
                              {formatPercent(leadTco.chargingMix.depotShare, language)} / {formatPercent(leadTco.chargingMix.publicShare, language)}
                            </strong>
                            <p>{t('truck.workspace.tco.summary.chargingMixText')}</p>
                          </article>
                          <article className="truck-workspace-tco-mini">
                            <span className="truck-card-kicker">{t('truck.workspace.tco.summary.yearlyDistance')}</span>
                            <strong>{`${formatDecimal(leadTco.annualKm, language, 0)} km`}</strong>
                            <p>{t('truck.workspace.tco.summary.yearlyDistanceText')}</p>
                          </article>
                        </div>
                      </div>

                      <div className="truck-workspace-tco-grid">
                        <article className="truck-workspace-tco-detail">
                          <span className="truck-card-kicker">{t('truck.workspace.tco.fields.energyCost')}</span>
                          <strong>{formatCurrency(leadTco.annualEnergyCost, language)}</strong>
                          <p>{t('truck.workspace.tco.fields.energyCostText')}</p>
                        </article>
                        <article className="truck-workspace-tco-detail">
                          <span className="truck-card-kicker">{t('truck.workspace.tco.fields.tollBenefit')}</span>
                          <strong>{formatCurrency(leadTco.annualTollBenefit, language)}</strong>
                          <p>{t('truck.workspace.tco.fields.tollBenefitText')}</p>
                        </article>
                        <article className="truck-workspace-tco-detail">
                          <span className="truck-card-kicker">{t('truck.workspace.tco.fields.thg')}</span>
                          <strong>{formatCurrency(leadTco.annualThgBonus, language)}</strong>
                          <p>{t('truck.workspace.tco.fields.thgText')}</p>
                        </article>
                        <article className="truck-workspace-tco-detail">
                          <span className="truck-card-kicker">{t('truck.workspace.tco.fields.maintenance')}</span>
                          <strong>{formatCurrency(leadTco.annualMaintenanceBenefit, language)}</strong>
                          <p>{t('truck.workspace.tco.fields.maintenanceText')}</p>
                        </article>
                      </div>

                      <div className="truck-note">
                        <CircleDollarSign size={16} />
                        <p>
                          {t('truck.workspace.tco.assumptions', {
                            years: leadTco.years,
                            depotShare: formatPercent(leadTco.chargingMix.depotShare, language),
                            publicShare: formatPercent(leadTco.chargingMix.publicShare, language),
                          })}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="truck-workspace-business">
                    <div className="truck-section-copy">
                      <span className="truck-kicker">{t('truck.workspace.business.purpose')}</span>
                      <h2>{t('truck.workspace.business.title')}</h2>
                      <p>{t('truck.workspace.business.description')}</p>
                    </div>

                    <div className="truck-workspace-business-grid">
                      <article className={`truck-workspace-business-card is-${businessCase.stage}`}>
                        <span className="truck-card-kicker">{t('truck.workspace.business.stagePurpose')}</span>
                        <h3>{t(`truck.workspace.business.stage.${businessCase.stage}.title`)}</h3>
                        <p>{t(`truck.workspace.business.stage.${businessCase.stage}.description`)}</p>
                        <Link className="truck-action truck-action--secondary" to="/e-lkw/wirtschaftlichkeit-betrieb">
                          {t('truck.workspace.business.openEconomics')}
                        </Link>
                      </article>

                      <article className="truck-workspace-business-card">
                        <span className="truck-card-kicker">{t('truck.workspace.business.leveragePurpose')}</span>
                        <h3>{t(`truck.workspace.business.leverage.${businessCase.leverage}.title`)}</h3>
                        <p>{t(`truck.workspace.business.leverage.${businessCase.leverage}.description`)}</p>
                      </article>

                      <article className="truck-workspace-business-card">
                        <span className="truck-card-kicker">{t('truck.workspace.business.riskPurpose')}</span>
                        <h3>{t(`truck.workspace.business.risk.${businessCase.risk}.title`)}</h3>
                        <p>{t(`truck.workspace.business.risk.${businessCase.risk}.description`)}</p>
                      </article>

                      <article className="truck-workspace-business-card">
                        <span className="truck-card-kicker">{t('truck.workspace.business.nextPurpose')}</span>
                        <h3>{t(`truck.workspace.business.next.${businessCase.next}.title`)}</h3>
                        <p>{t(`truck.workspace.business.next.${businessCase.next}.description`)}</p>
                      </article>
                    </div>
                  </div>
                </>
              ) : (
                <div className="truck-workspace-empty">
                  <h3>
                    {rawResultCards.length > 0
                      ? t('truck.workspace.results.emptySearchTitle')
                      : t('truck.workspace.results.emptyTitle')}
                  </h3>
                  <p>
                    {rawResultCards.length > 0
                      ? t('truck.workspace.results.emptySearchDescription')
                      : t('truck.workspace.results.emptyDescription')}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
    </section>
  )
}

function OperationsChecklistSection({ t }) {
  return (
    <section id="truck-checklist" className="truck-section">
      <div className="truck-section-copy">
        <span className="truck-kicker">{t('truck.checklistPurpose')}</span>
        <h2>{t('truck.checklistTitle')}</h2>
        <p>{t('truck.checklistDescription')}</p>
      </div>

      <div className="truck-rollout-grid">
        {['route', 'charging', 'grid', 'economics'].map((itemId, index) => (
          <article key={itemId} className="truck-rollout-card">
            <span className="truck-rollout-step">{String(index + 1).padStart(2, '0')}</span>
            <h3>{t(`truck.checklist.items.${itemId}.title`)}</h3>
            <p>{t(`truck.checklist.items.${itemId}.description`)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function OperationsFaqSection({ t }) {
  return (
    <TruckAccordionSection
      id="truck-ops-faq"
      kicker={t('truck.opsFaqPurpose')}
      title={t('truck.opsFaqTitle')}
      description={t('truck.opsFaqDescription')}
      items={['timing', 'chargingBase', 'pricing'].map((itemId) => ({
        id: itemId,
        question: t(`truck.opsFaq.items.${itemId}.question`),
        answer: t(`truck.opsFaq.items.${itemId}.answer`),
      }))}
    />
  )
}

export default function TruckPage() {
  const { t, i18n } = useTranslation()
  const { truckSection, truckSubsection } = useParams()
  const [expandedSections, setExpandedSections] = useState({
    signals: false,
    economics: false,
    regulation: false,
    charging: false,
    useCases: false,
  })

  if (truckSection && !TRUCK_SECTION_IDS.includes(truckSection)) {
    return <Navigate to="/e-lkw" replace />
  }

  if (
    truckSection === 'wirtschaftlichkeit-betrieb' &&
    truckSubsection &&
    !OPERATIONS_ROUTE_IDS.includes(truckSubsection)
  ) {
    return <Navigate to="/e-lkw/wirtschaftlichkeit-betrieb" replace />
  }

  if (
    truckSection === 'finden-vergleichen' &&
    truckSubsection &&
    !FIND_COMPARE_ROUTE_IDS.includes(truckSubsection)
  ) {
    return <Navigate to="/e-lkw/finden-vergleichen" replace />
  }

  if (
    truckSubsection &&
    truckSection !== 'wirtschaftlichkeit-betrieb' &&
    truckSection !== 'finden-vergleichen'
  ) {
    return <Navigate to={`/e-lkw/${truckSection}`} replace />
  }

  const isHub = !truckSection
  const operationsView =
    truckSection === 'wirtschaftlichkeit-betrieb' ? truckSubsection ?? 'overview' : null
  const findCompareView =
    truckSection === 'finden-vergleichen' ? truckSubsection ?? 'overview' : null

  function toggleSection(sectionId) {
    setExpandedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }))
  }

  return (
    <div className="truck-site">
      <header className="truck-masthead">
        <Link to="/" className="truck-masthead-back">
          <ArrowLeft size={16} />
          {t('truck.backHome')}
        </Link>
        <div className="truck-masthead-brand">
          <TruckElectric size={18} />
          <span>{t('truck.mastheadBrand')}</span>
        </div>
      </header>

      <main className="truck-layout">
        {isHub ? (
          <section className="truck-hero truck-hero--hub">
            <div className="truck-hero-copy">
              <span className="truck-kicker">{t('truck.heroPurpose')}</span>
              <h1 className="truck-title">
                <>
                  {t('truck.titlePrimary')}
                  <br />
                  <span>{t('truck.titleAccent')}</span>
                </>
              </h1>
              <p className="truck-subtitle">{t('truck.subtitle')}</p>
              <div className="truck-hero-actions">
                <Link to="/e-lkw/verstehen" className="truck-action truck-action--primary">
                  {t('truck.heroPrimaryAction')}
                </Link>
                <Link to="/e-lkw/finden-vergleichen" className="truck-action truck-action--secondary">
                  {t('truck.heroSecondaryAction')}
                </Link>
              </div>
            </div>

            <div className="truck-hero-panel">
              <div className="truck-hero-panel-badge">{t('truck.heroPanelBadge')}</div>
              <strong>{t('truck.heroPanelTitle')}</strong>
              <p>{t('truck.heroPanelDescription')}</p>
              <div className="truck-hero-panel-points">
                {['pointOne', 'pointTwo', 'pointThree'].map((pointId) => (
                  <span key={pointId}>{t(`truck.heroPanel.${pointId}`)}</span>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {!isHub ? (
        <section className="truck-hero truck-hero--section">
          <div className="truck-hero-copy">
            <span className="truck-kicker">{t(`truck.sections.${truckSection}.purpose`)}</span>
            <h1 className="truck-title">
              <>
                {t(`truck.sections.${truckSection}.titlePrimary`)}
                <br />
                <span>{t(`truck.sections.${truckSection}.titleAccent`)}</span>
              </>
            </h1>
            <p className="truck-subtitle">{t(`truck.sections.${truckSection}.description`)}</p>
            <div className="truck-hero-actions">
              <>
                <Link to="/e-lkw" className="truck-action truck-action--primary">
                  {t('truck.backToOverview')}
                </Link>
                <a href="#truck-section-content" className="truck-action truck-action--secondary">
                  {t('truck.jumpToContent')}
                </a>
              </>
            </div>
          </div>

          <div className="truck-hero-panel">
            <div className="truck-hero-panel-badge">{t(`truck.sections.${truckSection}.panelBadge`)}</div>
            <strong>{t(`truck.sections.${truckSection}.panelTitle`)}</strong>
            <p>{t(`truck.sections.${truckSection}.panelDescription`)}</p>
            <div className="truck-hero-panel-points">
              {['pointOne', 'pointTwo', 'pointThree'].map((pointId) => (
                <span key={pointId}>{t(`truck.sections.${truckSection}.panel.${pointId}`)}</span>
              ))}
            </div>
            <TruckVisualRail icons={SECTION_VISUAL_ICONS[truckSection]} />
          </div>
        </section>
        ) : null}

        {isHub ? (
          <section className="truck-section truck-section--hubcards" id="truck-groups">
            <div className="truck-pillar-grid">
              {TRUCK_SECTION_IDS.map((sectionId) => {
                const SectionIcon = HUB_ICONS[sectionId]

                return (
                  <article key={sectionId} className="truck-pillar-card truck-pillar-card--hub">
                    <div className="truck-pillar-icon">
                      <SectionIcon size={18} />
                    </div>
                    <span className="truck-card-kicker">{t(`truck.sections.${sectionId}.purpose`)}</span>
                    <h3>{t(`truck.sections.${sectionId}.cardTitle`)}</h3>
                    <p>{t(`truck.sections.${sectionId}.cardDescription`)}</p>
                    <Link to={`/e-lkw/${sectionId}`} className="truck-inline-link">
                      {t('truck.openSection')}
                    </Link>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        {!isHub ? (
          <div id="truck-section-content" className="truck-section-stack">
            {truckSection === 'verstehen' ? (
              <>
                <UnderstandingSubnav t={t} />
                <SignalsSection
                  t={t}
                  expanded={expandedSections.signals}
                  onToggle={() => toggleSection('signals')}
                />
                <UseCasesSection
                  t={t}
                  expanded={expandedSections.useCases}
                  onToggle={() => toggleSection('useCases')}
                />
                <TechnologyCompareSection t={t} />
                <TruckFaqSection t={t} />
              </>
            ) : null}

            {truckSection === 'wirtschaftlichkeit-betrieb' ? (
              <>
                <OperationsOverviewSection t={t} />
                <OperationsRouteNav t={t} />
                {operationsView === 'overview' ? <OperationsAreaOverviewSection t={t} /> : null}
                {operationsView === 'business-case' ? (
                  <>
                    <EconomicsSection
                      t={t}
                      expanded={expandedSections.economics}
                      onToggle={() => toggleSection('economics')}
                    />
                    <OperationsChecklistSection t={t} />
                    <OperationsFaqSection t={t} />
                  </>
                ) : null}
                {operationsView === 'laden-betrieb' ? (
                  <>
                    <RolloutSection t={t} />
                    <ChargingSection
                      t={t}
                      expanded={expandedSections.charging}
                      onToggle={() => toggleSection('charging')}
                    />
                    <OperationsFaqSection t={t} />
                  </>
                ) : null}
                {operationsView === 'regulatorik' ? (
                  <>
                    <RegulationSection
                      t={t}
                      expanded={expandedSections.regulation}
                      onToggle={() => toggleSection('regulation')}
                    />
                    <OperationsFaqSection t={t} />
                  </>
                ) : null}
              </>
            ) : null}

            {truckSection === 'finden-vergleichen' ? (
              <>
                <FindCompareRouteNav t={t} />
                {findCompareView === 'overview' ? (
                  <>
                    <TruckIllustrationSection t={t} />
                    <TruckInfographicSection t={t} />
                    <FindCompareOverviewSection t={t} />
                    <FindCompareHelpSection t={t} />
                  </>
                ) : null}
                {findCompareView === 'berater' ? (
                  <TruckAdvisorWorkspace t={t} language={i18n.resolvedLanguage} />
                ) : null}
                {findCompareView === 'modelle' ? (
                  <TruckModelsSection t={t} language={i18n.resolvedLanguage} />
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}

      </main>
    </div>
  )
}
