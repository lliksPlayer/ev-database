import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateTCO, buildYearlySeries, findBreakeven } from '../../utils/tcoCalculation'
import { TotalCostChart, MonthlyCostChart } from './CostChart'
import './ResultsPanel.css'

export default function ResultsPanel({ vehicleA, paramsA, vehicleB, paramsB }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState('monthly')

  const years = Math.max(paramsA.jahre || 8, paramsB.jahre || 8)
  const tcoA = calculateTCO(vehicleA, paramsA, years)
  const tcoB = calculateTCO(vehicleB, paramsB, years)
  const seriesA = buildYearlySeries(vehicleA, paramsA, years)
  const seriesB = buildYearlySeries(vehicleB, paramsB, years)
  const breakevenYear = findBreakeven(vehicleA, paramsA, vehicleB, paramsB, years)

  const labelA = `${vehicleA.marke} ${vehicleA.modell}`
  const labelB = `${vehicleB.marke} ${vehicleB.modell}`

  const formatEur = (v) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

  const costKeys = ['kaufpreis', 'energie', 'wartung', 'versicherung', 'steuer', 'finanzierung', 'restwert', 'thg']

  const tabs = [
    { id: 'monthly', label: t('calc.results.tabMonthly') },
    { id: 'total',   label: t('calc.results.tabTotal') },
    { id: 'breakeven', label: t('calc.results.tabBreakeven') },
  ]

  return (
    <div className="results-panel">
      {/* ── Tab bar ── */}
      <div className="results-tabs" role="tablist">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`results-tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="results-content">

        {/* Monthly tab */}
        {tab === 'monthly' && (
          <div>
            <div className="results-summary">
              <div className="summary-card summary-card--a">
                <div className="summary-label">{labelA}</div>
                <div className="summary-value">{formatEur(tcoA.monatlich)}<span className="summary-unit">/Monat</span></div>
              </div>
              <div className="summary-card summary-card--b">
                <div className="summary-label">{labelB}</div>
                <div className="summary-value">{formatEur(tcoB.monatlich)}<span className="summary-unit">/Monat</span></div>
              </div>
            </div>
            <MonthlyCostChart tcoA={tcoA} tcoB={tcoB} labelA={labelA} labelB={labelB} years={years} />
          </div>
        )}

        {/* Total tab */}
        {tab === 'total' && (
          <div>
            <TotalCostChart
              seriesA={seriesA}
              seriesB={seriesB}
              labelA={labelA}
              labelB={labelB}
              breakevenYear={breakevenYear}
            />
            <table className="cost-table">
              <thead>
                <tr>
                  <th>Kostenposition</th>
                  <th>{labelA}</th>
                  <th>{labelB}</th>
                </tr>
              </thead>
              <tbody>
                {costKeys.map((key, i) => (
                  <tr key={key} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td>{t(`calc.results.cost${key.charAt(0).toUpperCase() + key.slice(1)}`)}</td>
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
        )}

        {/* Break-even tab */}
        {tab === 'breakeven' && (
          <div className="breakeven-section">
            {breakevenYear ? (
              <>
                <div className="breakeven-badge">
                  {t('calc.results.breakevenAt', { years: breakevenYear })}
                </div>
                <p className="breakeven-desc">{t('calc.results.cheaper', { name: labelA })}</p>
              </>
            ) : (
              <div className="breakeven-badge breakeven-badge--none">
                {t('calc.results.noBreakeven')}
              </div>
            )}
            <div className="breakeven-chart">
              <TotalCostChart
                seriesA={seriesA}
                seriesB={seriesB}
                labelA={labelA}
                labelB={labelB}
                breakevenYear={breakevenYear}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
