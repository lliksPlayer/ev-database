import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { logout } from '../firebase/auth'
import { useCarsCollection } from '../hooks/useCars'
import { addCar, updateCar, deleteCar, importCars } from '../firebase/cars'
import { addIceCar, updateIceCar, deleteIceCar, importIceCars } from '../firebase/ice-cars'
import { applyCalculations } from '../utils/calculations'
import { EV_FIELDS, ICE_FIELDS } from '../config/fields'
import AdminPanel from '../components/admin/AdminPanel'
import './AdminPage.css'

const EV_CONFIG = {
  collectionName: 'ev_cars',
  formFields: EV_FIELDS,
  addFn: addCar,
  updateFn: updateCar,
  deleteFn: deleteCar,
  importFn: importCars,
  transformFn: applyCalculations,
  summaryKeys: ['batterie_netto', 'basis_preis'],
  showFieldSettings: true,
}

const ICE_CONFIG = {
  collectionName: 'ice_cars',
  formFields: ICE_FIELDS,
  addFn: addIceCar,
  updateFn: updateIceCar,
  deleteFn: deleteIceCar,
  importFn: importIceCars,
  transformFn: (car) => car,
  summaryKeys: ['kraftstoff', 'basis_preis'],
  showFieldSettings: false,
}

function AdminContent({ config }) {
  const { cars } = useCarsCollection(config.collectionName)
  return (
    <AdminPanel
      cars={cars}
      formFields={config.formFields}
      addFn={config.addFn}
      updateFn={config.updateFn}
      deleteFn={config.deleteFn}
      importFn={config.importFn}
      transformFn={config.transformFn}
      summaryKeys={config.summaryKeys}
      showFieldSettings={config.showFieldSettings}
    />
  )
}

export default function AdminPage() {
  const { t } = useTranslation()
  const [type, setType] = useState('ev')

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-type-tabs">
          <button
            className={`admin-tab ${type === 'ev' ? 'active' : ''}`}
            onClick={() => setType('ev')}
          >
            {t('nav.evDatabase')}
          </button>
          <button
            className={`admin-tab ${type === 'ice' ? 'active' : ''}`}
            onClick={() => setType('ice')}
          >
            {t('nav.iceDatabase')}
          </button>
        </div>
        <button className="btn btn-secondary btn-small admin-logout" onClick={logout}>
          {t('admin.logout')}
        </button>
      </div>
      <AdminContent key={type} config={type === 'ev' ? EV_CONFIG : ICE_CONFIG} />
    </div>
  )
}
