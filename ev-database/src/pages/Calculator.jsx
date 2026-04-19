import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useTranslation } from 'react-i18next'
import UserModeToggle from '../components/calculator/UserModeToggle'
import VehicleSlot from '../components/calculator/VehicleSlot'
import ResultsPanel from '../components/calculator/ResultsPanel'
import { DEFAULT_PARAMS_NORMAL, DEFAULT_PARAMS_EXPERT } from '../utils/tcoCalculation'
import './Calculator.css'

export default function Calculator() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [compMode, setCompMode] = useState('ev-ice')
  const [expertMode, setExpertMode] = useState(false)
  const [vehicleA, setVehicleA] = useState(null)
  const [vehicleB, setVehicleB] = useState(null)
  const [paramsA, setParamsA] = useState({ ...DEFAULT_PARAMS_NORMAL })
  const [paramsB, setParamsB] = useState({ ...DEFAULT_PARAMS_NORMAL })

  useEffect(() => {
    const ev1 = searchParams.get('ev1')
    const ev2 = searchParams.get('ev2')
    if (ev1) loadVehicle(ev1, 'ev_cars', setVehicleA)
    if (ev2) {
      setCompMode('ev-ev')
      loadVehicle(ev2, 'ev_cars', setVehicleB)
    }
  }, [])

  const loadVehicle = async (id, collection, setter) => {
    try {
      const snap = await getDoc(doc(db, collection, id))
      if (snap.exists()) setter({ id: snap.id, ...snap.data(), vehicleType: 'ev' })
    } catch (e) {
      console.error('Fahrzeug laden fehlgeschlagen:', e)
    }
  }

  const updateParamsA = (patch) => setParamsA(p => ({ ...p, ...patch }))
  const updateParamsB = (patch) => setParamsB(p => ({ ...p, ...patch }))

  const handleExpertMode = (on) => {
    setExpertMode(on)
    const defaults = on ? DEFAULT_PARAMS_EXPERT : DEFAULT_PARAMS_NORMAL
    setParamsA(p => ({ ...defaults, ...p }))
    setParamsB(p => ({ ...defaults, ...p }))
  }

  const handleCompMode = (mode) => {
    setCompMode(mode)
    setVehicleB(null)
    setParamsB({ ...DEFAULT_PARAMS_NORMAL })
  }

  const canShowResults = vehicleA && vehicleB

  return (
    <div className="calculator-page">
      <div className="calc-header">
        <h1>{t('calc.title')}</h1>
        <div className="calc-controls">
          <div className="comp-mode-toggle">
            <button
              className={compMode === 'ev-ice' ? 'active' : ''}
              onClick={() => handleCompMode('ev-ice')}
            >
              {t('calc.modeEvIce')}
            </button>
            <button
              className={compMode === 'ev-ev' ? 'active' : ''}
              onClick={() => handleCompMode('ev-ev')}
            >
              {t('calc.modeEvEv')}
            </button>
          </div>
          <UserModeToggle expertMode={expertMode} onChange={handleExpertMode} />
        </div>
      </div>

      <div className="calc-slots">
        <VehicleSlot
          label={t('calc.vehicleA')}
          type="ev"
          vehicle={vehicleA}
          params={paramsA}
          expertMode={expertMode}
          onVehicleChange={v => { setVehicleA(v); updateParamsA({ kaufpreis: v.basis_preis }) }}
          onParamsChange={updateParamsA}
        />
        <VehicleSlot
          label={t('calc.vehicleB')}
          type={compMode === 'ev-ev' ? 'ev' : 'ice'}
          vehicle={vehicleB}
          params={paramsB}
          expertMode={expertMode}
          onVehicleChange={v => { setVehicleB(v); updateParamsB({ kaufpreis: v.basis_preis }) }}
          onParamsChange={updateParamsB}
        />
      </div>

      {canShowResults
        ? <ResultsPanel vehicleA={vehicleA} paramsA={paramsA} vehicleB={vehicleB} paramsB={paramsB} />
        : <div className="calc-placeholder">{t('calc.selectBoth')}</div>
      }
    </div>
  )
}
