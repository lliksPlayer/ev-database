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
        EV Vergleich
      </Link>
      <div className="nav-links">
        <NavLink to="/autos" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          {t('nav.evDatabase')}
        </NavLink>
        <NavLink
          to="/verbrenner"
          className={({ isActive }) => `nav-link nav-link-ice${isActive ? ' active' : ''}`}
        >
          {t('nav.iceDatabase')}
        </NavLink>
        <NavLink to="/rechner" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          {t('nav.calculator')}
        </NavLink>
      </div>
      <div className="nav-right">
        <LanguageSwitch />
        {user && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {t('nav.admin')}
          </NavLink>
        )}
      </div>
    </nav>
  )
}
