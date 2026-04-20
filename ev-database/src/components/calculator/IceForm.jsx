import { useTranslation } from 'react-i18next'
import { ICE_TEMPLATES } from '../../utils/tcoCalculation'
import './IceForm.css'

export default function IceForm({ vehicle, onChange }) {
  const { t } = useTranslation()

  const handleTemplate = (key) => {
    if (!key) return
    onChange({ ...ICE_TEMPLATES[key] })
  }

  const handleField = (field, value) => {
    onChange({
      ...vehicle,
      [field]: field === 'verbrauch_l_100km' || field === 'basis_preis' ? Number(value) : value,
    })
  }

  return (
    <div className="ice-form">
      <div className="ice-form-section">
        <label htmlFor="ice-template" className="ice-form-label">
          {t('calc.ice.templateLabel')}
        </label>
        <select
          id="ice-template"
          className="ice-form-select"
          onChange={(e) => handleTemplate(e.target.value)}
          defaultValue=""
        >
          <option value="">{t('calc.ice.templateNone')}</option>
          <option value="golf">{t('calc.ice.templateGolf')}</option>
          <option value="bmw">{t('calc.ice.templateBmw')}</option>
          <option value="passat">{t('calc.ice.templatePassat')}</option>
        </select>
      </div>

      <div className="ice-form-grid">
        <div className="ice-form-section">
          <label htmlFor="ice-make" className="ice-form-label">
            {t('calc.ice.make')}
          </label>
          <input
            id="ice-make"
            className="ice-form-input"
            type="text"
            value={vehicle?.marke || ''}
            onChange={(e) => handleField('marke', e.target.value)}
            placeholder="z.B. VW"
          />
        </div>

        <div className="ice-form-section">
          <label htmlFor="ice-model" className="ice-form-label">
            {t('calc.ice.model')}
          </label>
          <input
            id="ice-model"
            className="ice-form-input"
            type="text"
            value={vehicle?.modell || ''}
            onChange={(e) => handleField('modell', e.target.value)}
            placeholder="z.B. Golf 2.0 TDI"
          />
        </div>

        <div className="ice-form-section">
          <label htmlFor="ice-price" className="ice-form-label">
            {t('calc.params.kaufpreis')}
          </label>
          <input
            id="ice-price"
            className="ice-form-input"
            type="number"
            value={vehicle?.basis_preis || ''}
            onChange={(e) => handleField('basis_preis', e.target.value)}
            placeholder="€"
            min="0"
          />
        </div>

        <div className="ice-form-section">
          <label htmlFor="ice-consumption" className="ice-form-label">
            {t('calc.params.verbrauchL')}
          </label>
          <input
            id="ice-consumption"
            className="ice-form-input"
            type="number"
            step="0.1"
            value={vehicle?.verbrauch_l_100km || ''}
            onChange={(e) => handleField('verbrauch_l_100km', e.target.value)}
            placeholder="L/100km"
            min="0"
          />
        </div>
      </div>
    </div>
  )
}
