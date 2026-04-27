import { Link } from 'react-router-dom'
import { ArrowRight, ArrowRightLeft, BadgeCheck, Search } from 'lucide-react'

const FLOW_ICONS = {
  search: Search,
  compare: ArrowRightLeft,
  decide: BadgeCheck,
}

export default function CatalogFlowIntro({
  kicker = 'Produktfluss',
  title,
  subtitle,
  count,
  countLabel,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  flowHint,
  steps,
}) {
  return (
    <section className="catalog-intro">
      <div className="catalog-intro-grid">
        <div className="catalog-intro-copy">
          <span className="catalog-kicker">{kicker}</span>
          <h1 className="catalog-title">{title}</h1>
          <p className="catalog-intro-subtitle">{subtitle}</p>

          <div className="catalog-intro-meta">
            <div className="catalog-intro-count">
              <strong>{count}</strong>
              <span>{countLabel}</span>
            </div>
            <div className="catalog-intro-note">{flowHint}</div>
          </div>

          <div className="catalog-intro-actions">
            <Link to={primaryHref} className="catalog-cta catalog-cta--primary">
              {primaryLabel}
              <ArrowRight size={16} />
            </Link>
            <Link to={secondaryHref} className="catalog-cta catalog-cta--secondary">
              {secondaryLabel}
            </Link>
          </div>
        </div>

        <div className="catalog-step-grid">
          {steps.map((step, index) => {
            const Icon = FLOW_ICONS[step.icon] ?? Search

            return (
              <div key={step.title} className="catalog-step-card">
                <div className="catalog-step-head">
                  <span className="catalog-step-index">0{index + 1}</span>
                  <span className="catalog-step-icon">
                    <Icon size={16} />
                  </span>
                </div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
