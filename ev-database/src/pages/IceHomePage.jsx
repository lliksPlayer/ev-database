import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCarsCollection } from '../hooks/useCars'
import { ICE_FIELDS } from '../config/fields'
import ViewToggle from '../components/cars/ViewToggle'
import CarGrid from '../components/cars/CarGrid'
import CarList from '../components/cars/CarList'
import CarDetail from '../components/cars/CarDetail'
import './HomePage.css'

const ICE_SETTINGS = ICE_FIELDS.map((f, i) => ({
  key: f.key,
  label_de: f.label,
  label_en: f.label,
  visible: i < 6,
  order: i,
}))

export default function IceHomePage() {
  const { t } = useTranslation()
  const { cars, loading } = useCarsCollection('ice_cars')

  const [view, setView] = useState(() => localStorage.getItem('ice-view') || 'grid')
  const [size, setSize] = useState(() => localStorage.getItem('ice-gridSize') || 'medium')
  const [selectedCar, setSelectedCar] = useState(null)

  const handleSetView = (v) => { setView(v); localStorage.setItem('ice-view', v) }
  const handleSetSize = (s) => { setSize(s); localStorage.setItem('ice-gridSize', s) }

  if (loading) return <div className="home-page"><p className="home-loading">{t('home.loading')}</p></div>

  return (
    <div className="home-page">
      <h1>{t('home.iceTitle')}</h1>
      <ViewToggle view={view} setView={handleSetView} size={size} setSize={handleSetSize} />
      {cars.length === 0
        ? <p className="home-empty">{t('home.noCars')}</p>
        : view === 'grid'
          ? <CarGrid cars={cars} fields={ICE_SETTINGS} size={size} onCarClick={setSelectedCar} />
          : <CarList cars={cars} fields={ICE_SETTINGS} onCarClick={setSelectedCar} />
      }
      {selectedCar && <CarDetail car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  )
}
