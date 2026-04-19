import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { Zap } from 'lucide-react'
import LanguageSwitch from './LanguageSwitch'
import './TopNav.css'

export default function TopNav() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        <Zap className="nav-brand-icon" fill="currentColor" strokeWidth={0} />
        EV Database
      </Link>
      <div className="nav-links">
        <NavLink to="/" end className="nav-link">{t('nav.evDatabase')}</NavLink>
        <NavLink to="/verbrenner" className="nav-link">{t('nav.iceDatabase')}</NavLink>
        <NavLink to="/rechner" className="nav-link">{t('nav.calculator')}</NavLink>
      </div>
      <div className="nav-right">
        <LanguageSwitch />
        {user && (
          <NavLink to="/admin" className="nav-link">{t('nav.admin')}</NavLink>
        )}
      </div>
    </nav>
  )
}
