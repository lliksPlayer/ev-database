import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCars } from '../hooks/useCars'
import { useSettings } from '../hooks/useSettings'
import ViewToggle from '../components/cars/ViewToggle'
import CarGrid from '../components/cars/CarGrid'
import CarList from '../components/cars/CarList'
import CarDetail from '../components/cars/CarDetail'
import './HomePage.css'

export default function HomePage() {
  const { t } = useTranslation()
  const { cars, loading: carsLoading } = useCars()
  const { fields, loading: fieldsLoading } = useSettings()

  const [view, setView] = useState(() => localStorage.getItem('view') || 'grid')
  const [size, setSize] = useState(() => localStorage.getItem('gridSize') || 'medium')
  const [selectedCar, setSelectedCar] = useState(null)

  const handleSetView = (v) => { setView(v); localStorage.setItem('view', v) }
  const handleSetSize = (s) => { setSize(s); localStorage.setItem('gridSize', s) }

  if (carsLoading || fieldsLoading) return <div className="home-page"><p className="home-loading">{t('home.loading')}</p></div>

  return (
    <div className="home-page">
      <h1>{t('home.title')}</h1>
      <ViewToggle view={view} setView={handleSetView} size={size} setSize={handleSetSize} />
      {cars.length === 0
        ? <p className="home-empty">{t('home.noCars')}</p>
        : view === 'grid'
          ? <CarGrid cars={cars} fields={fields} size={size} onCarClick={setSelectedCar} />
          : <CarList cars={cars} fields={fields} onCarClick={setSelectedCar} />
      }
      {selectedCar && <CarDetail car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  )
}
