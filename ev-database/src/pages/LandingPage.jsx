import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, Compass, SlidersHorizontal, Sparkles, TruckElectric } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './LandingPage.css'

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-content">
          <div className="landing-copy-shell">
            <div className="landing-badge">{t('landing.heroPurpose')}</div>
            <div className="landing-meta">{t('landing.meta')}</div>
            <h1 className="landing-headline">
              {t('landing.headlinePrimary')}<br />
              <span className="landing-headline-accent">{t('landing.headlineAccent')}</span>
            </h1>
            <p className="landing-sub">{t('landing.sub')}</p>
            <div className="landing-ctas">
              <Link to="/kaufberater" className="landing-cta-primary">
                {t('landing.ctaAdvisor')} <ArrowRight size={18} />
              </Link>
              <Link to="/rechner" className="landing-cta-outline">
                {t('landing.ctaRechner')} <Calculator size={18} />
              </Link>
            </div>
          </div>
        </div>
        <div
          className="landing-illustration"
          style={{ backgroundImage: 'url(/hero-sketch.jpg)' }}
          role="img"
          aria-label="Illustration verschiedener Elektroautos"
        />
      </div>
      <section className="landing-journey">
        <div className="landing-journey-shell">
          <div className="landing-paths-copy">
            <span className="landing-paths-kicker">{t('landing.pathsPurpose')}</span>
            <h2 className="landing-paths-title">{t('landing.pathsTitle')}</h2>
          </div>
          <div className="landing-path-grid">
            <article className="landing-path-card landing-path-card--primary">
              <div className="landing-path-icon"><Sparkles size={18} /></div>
              <span className="landing-path-purpose">{t('landing.advisorCardPurpose')}</span>
              <strong>{t('landing.advisorCardTitle')}</strong>
              <p>{t('landing.advisorCardDescription')}</p>
              <Link to="/kaufberater" className="landing-path-action">
                {t('landing.advisorCardAction')} <ArrowRight size={16} />
              </Link>
            </article>
            <article className="landing-path-card">
              <div className="landing-path-icon"><SlidersHorizontal size={18} /></div>
              <span className="landing-path-purpose">{t('landing.calculatorCardPurpose')}</span>
              <strong>{t('landing.calculatorCardTitle')}</strong>
              <p>{t('landing.calculatorCardDescription')}</p>
              <Link to="/rechner" className="landing-path-action">
                {t('landing.calculatorCardAction')} <ArrowRight size={16} />
              </Link>
            </article>
            <article className="landing-path-card">
              <div className="landing-path-icon"><Compass size={18} /></div>
              <span className="landing-path-purpose">{t('landing.browseCardPurpose')}</span>
              <strong>{t('landing.browseCardTitle')}</strong>
              <p>{t('landing.browseCardDescription')}</p>
              <div className="landing-path-actions">
                <Link to="/autos" className="landing-path-chip">{t('landing.browseCardActionEv')}</Link>
                <Link to="/verbrenner" className="landing-path-chip">{t('landing.browseCardActionIce')}</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-truck-feature">
        <div className="landing-truck-shell">
          <div className="landing-truck-copy">
            <div className="landing-truck-badge">
              <TruckElectric size={18} />
              {t('landing.truckFeaturePurpose')}
            </div>
            <div className="landing-truck-meta">{t('landing.truckFeatureMeta')}</div>
            <h2 className="landing-truck-title">
              {t('landing.truckFeatureTitlePrimary')}<br />
              <span>{t('landing.truckFeatureTitleAccent')}</span>
            </h2>
            <p className="landing-truck-sub">{t('landing.truckFeatureDescription')}</p>
            <div className="landing-truck-points">
              <span className="landing-truck-point">{t('landing.truckFeaturePointOne')}</span>
              <span className="landing-truck-point">{t('landing.truckFeaturePointTwo')}</span>
              <span className="landing-truck-point">{t('landing.truckFeaturePointThree')}</span>
            </div>
            <Link to="/e-lkw" className="landing-truck-cta">
              {t('landing.truckFeatureAction')} <ArrowRight size={18} />
            </Link>
          </div>
          <div
            className="landing-truck-illustration"
            style={{ backgroundImage: 'url(/hero-sketch.jpg)' }}
            role="img"
            aria-label={t('landing.truckFeatureAria')}
          />
        </div>
      </section>
    </div>
  )
}
