import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitch from './LanguageSwitch'
import './TopNav.css'

export default function TopNav() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">⚡ EV Database</Link>
      <div className="nav-links">
        <NavLink to="/" className="nav-link">{t('nav.evDatabase')}</NavLink>
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
