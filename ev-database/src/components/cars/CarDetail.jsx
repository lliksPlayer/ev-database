import { useTranslation } from 'react-i18next'
import './CarDetail.css'

export default function CarDetail({ car, onClose }) {
  const { t } = useTranslation()
  if (!car) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{car.marke} {car.modell}</div>
        <p className="modal-coming-soon">{t('detail.comingSoon')}</p>
      </div>
    </div>
  )
}
