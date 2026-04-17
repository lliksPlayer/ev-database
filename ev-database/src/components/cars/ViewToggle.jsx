import { useTranslation } from 'react-i18next'
import './ViewToggle.css'

export default function ViewToggle({ view, setView, size, setSize }) {
  const { t } = useTranslation()

  return (
    <div className="view-toggle">
      <div className="toggle-group">
        <button className={`toggle-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
          {t('viewToggle.grid')}
        </button>
        <button className={`toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
          {t('viewToggle.list')}
        </button>
      </div>
      {view === 'grid' && (
        <div className="toggle-group">
          {['small', 'medium', 'large'].map(s => (
            <button key={s} className={`toggle-btn ${size === s ? 'active' : ''}`} onClick={() => setSize(s)}>
              {t(`viewToggle.${s}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
