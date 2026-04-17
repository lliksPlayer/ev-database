import { useTranslation } from 'react-i18next'

export default function LanguageSwitch() {
  const { i18n } = useTranslation()

  const toggle = () => {
    const next = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <button
      onClick={toggle}
      style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
               padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
    >
      {i18n.language === 'de' ? 'EN' : 'DE'}
    </button>
  )
}
