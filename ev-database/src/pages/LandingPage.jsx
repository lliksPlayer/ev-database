import { Link } from 'react-router-dom'
import { ArrowRight, Calculator } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './LandingPage.css'

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-content">
          <div className="landing-badge">{t('landing.badge')}</div>
          <h1 className="landing-headline">
            {t('landing.headline').split('. ')[0]}.<br />
            <span className="landing-headline-accent">
              {t('landing.headline').split('. ')[1]}
            </span>
          </h1>
          <p className="landing-sub">{t('landing.sub')}</p>
          <div className="landing-ctas">
            <Link to="/autos" className="landing-cta-primary">
              {t('landing.ctaAutos')} <ArrowRight size={18} />
            </Link>
            <Link to="/rechner" className="landing-cta-outline">
              {t('landing.ctaRechner')} <Calculator size={18} />
            </Link>
          </div>
        </div>
        <div
          className="landing-illustration"
          style={{ backgroundImage: 'url(/hero-sketch.jpg)' }}
          role="img"
          aria-label="Illustration verschiedener Elektroautos"
        />
      </div>
    </div>
  )
}
