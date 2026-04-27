import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../hooks/useSettings'
import { saveSettings } from '../../firebase/settings'
import { EV_CARD_FIELDS } from '../../entities/vehicle/fields.js'
import CarForm from './CarForm'
import CarImport from './CarImport'
import FieldToggle from './FieldToggle'
import './AdminPanel.css'

export default function AdminPanel({
  cars,
  vehicleType,
  formFields,
  addFn,
  updateFn,
  deleteFn,
  importFn,
  transformFn,
  summaryKeys,
  showFieldSettings = false,
}) {
  const { t } = useTranslation()
  const { fields } = useSettings()
  const [tab, setTab] = useState('vehicles')
  const [view, setView] = useState('list')
  const [editCar, setEditCar] = useState(null)

  const summaryLabels = summaryKeys.map(key => {
    const field = formFields.find(f => f.key === key)
    return { key, label: field?.label || key }
  })

  const handleSeedFields = async () => {
    await saveSettings(EV_CARD_FIELDS)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.deleteConfirm'))) return
    await deleteFn(id)
  }

  return (
    <div className="admin-panel">
      <h1>{t('admin.title')}</h1>
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'vehicles' ? 'active' : ''}`} onClick={() => { setTab('vehicles'); setView('list') }}>
          {t('admin.vehicles')} ({cars.length})
        </button>
        {showFieldSettings && (
          <button className={`admin-tab ${tab === 'fields' ? 'active' : ''}`} onClick={() => setTab('fields')}>
            {t('admin.fields')}
          </button>
        )}
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
                  <tr>
                    <th>{t('admin.tableMake')}</th>
                    <th>{t('admin.tableModel')}</th>
                    {summaryLabels.map(s => <th key={s.key}>{s.label}</th>)}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map(car => (
                    <tr key={car.id}>
                      <td>{car.marke}</td>
                      <td>{car.modell}</td>
                      {summaryLabels.map(s => (
                        <td key={s.key}>{car[s.key] ?? '–'}</td>
                      ))}
                      <td>
                        <button className="btn btn-secondary btn-small car-table-edit"
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
            <CarForm
              key={view === 'edit' ? editCar?.id || 'edit' : 'add'}
              fields={formFields}
              addFn={addFn}
              updateFn={updateFn}
              car={view === 'edit' ? editCar : null}
              onDone={() => { setView('list'); setEditCar(null) }}
            />
          )}
          {view === 'import' && (
            <CarImport
              vehicleType={vehicleType}
              fields={formFields}
              importFn={importFn}
              transformFn={transformFn}
              onDone={() => setView('list')}
            />
          )}
        </>
      )}

      {showFieldSettings && tab === 'fields' && fields.length === 0 && (
        <div className="seed-prompt">
          <p>Konfiguration noch nicht angelegt.</p>
          <button className="btn btn-primary" onClick={handleSeedFields}>Standard-Felder anlegen</button>
        </div>
      )}
      {showFieldSettings && tab === 'fields' && fields.length > 0 && <FieldToggle fields={fields} />}
    </div>
  )
}
