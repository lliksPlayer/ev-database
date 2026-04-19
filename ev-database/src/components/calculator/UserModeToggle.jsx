import { useTranslation } from 'react-i18next'

export default function UserModeToggle({ expertMode, onChange }) {
  const { t } = useTranslation()
  return (
    <div className="mode-toggle">
      <button
        className={`mode-btn${!expertMode ? ' active' : ''}`}
        onClick={() => onChange(false)}
      >
        {t('calc.modeNormal')}
      </button>
      <button
        className={`mode-btn${expertMode ? ' active' : ''}`}
        onClick={() => onChange(true)}
      >
        {t('calc.modeExpert')}
      </button>
    </div>
  )
}
