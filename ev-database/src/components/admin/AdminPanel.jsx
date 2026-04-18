import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCars } from '../../hooks/useCars'
import { useSettings } from '../../hooks/useSettings'
import { deleteCar } from '../../firebase/cars'
import CarForm from './CarForm'
import CarImport from './CarImport'
import FieldToggle from './FieldToggle'
import './AdminPanel.css'

export default function AdminPanel() {
  const { t } = useTranslation()
  const { cars } = useCars()
  const { fields } = useSettings()
  const [tab, setTab] = useState('vehicles')
  const [view, setView] = useState('list') // 'list' | 'add' | 'edit' | 'import'
  const [editCar, setEditCar] = useState(null)

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.deleteConfirm'))) return
    await deleteCar(id)
  }

  return (
    <div className="admin-panel">
      <h1>{t('admin.title')}</h1>
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'vehicles' ? 'active' : ''}`} onClick={() => { setTab('vehicles'); setView('list') }}>
          {t('admin.vehicles')} ({cars.length})
        </button>
        <button className={`admin-tab ${tab === 'fields' ? 'active' : ''}`} onClick={() => setTab('fields')}>
          {t('admin.fields')}
        </button>
      </div>

      {tab === 'vehicles' && (
        <>
          {view === 'list' && (
            <>
              <div className="admin-actions">
                <button className="btn btn-primary" onClick={() => setView('add')}>{t('admin.addVehicle')}</button>
                <button className="btn btn-secondary" onClick={() => setView('import')}>{t('admin.importVehicles')}</button>
              </div>
              <table className="car-table">
                <thead>
                  <tr><th>Marke</th><th>Modell</th><th>Batterie</th><th>Preis</th><th></th></tr>
                </thead>
                <tbody>
                  {cars.map(car => (
                    <tr key={car.id}>
                      <td>{car.marke}</td>
                      <td>{car.modell}</td>
                      <td>{car.batterie_netto} kWh</td>
                      <td>{car.basis_preis ? `${car.basis_preis.toLocaleString('de-DE')} €` : '–'}</td>
                      <td>
                        <button className="btn btn-secondary btn-small" style={{ marginRight: 6 }}
                          onClick={() => { setEditCar(car); setView('edit') }}>
                          {t('admin.edit')}
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDelete(car.id)}>
                          {t('admin.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {(view === 'add' || view === 'edit') && (
            <CarForm car={view === 'edit' ? editCar : null} onDone={() => { setView('list'); setEditCar(null) }} />
          )}
          {view === 'import' && <CarImport onDone={() => setView('list')} />}
        </>
      )}

      {tab === 'fields' && fields.length > 0 && <FieldToggle fields={fields} />}
    </div>
  )
}
