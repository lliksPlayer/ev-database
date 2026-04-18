import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../hooks/useSettings'
import { saveSettings } from '../../firebase/settings'
import CarForm from './CarForm'
import CarImport from './CarImport'
import FieldToggle from './FieldToggle'
import './AdminPanel.css'

const EV_DEFAULT_FIELDS = [
  { key: 'marke', label_de: 'Marke', label_en: 'Brand', visible: true, order: 0 },
  { key: 'modell', label_de: 'Modell', label_en: 'Model', visible: true, order: 1 },
  { key: 'batterie_netto', label_de: 'Batterie Netto', label_en: 'Battery Net', visible: true, order: 2 },
  { key: 'laden_10_80_min', label_de: '10%–80% (min)', label_en: '10%–80% (min)', visible: true, order: 3 },
  { key: 'kwh_nach_70', label_de: 'kWh nach 70%', label_en: 'kWh after 70%', visible: true, order: 4 },
  { key: 'kwh_pro_min', label_de: 'kWh/min', label_en: 'kWh/min', visible: true, order: 5 },
  { key: 'max_ladeleistung', label_de: 'Max. Ladeleistung', label_en: 'Max. Charge Power', visible: true, order: 6 },
  { key: 'anhaengelast', label_de: 'Anhängelast', label_en: 'Towing Capacity', visible: false, order: 7 },
  { key: 'wltp_reichweite', label_de: 'WLTP Reichweite', label_en: 'WLTP Range', visible: true, order: 8 },
  { key: 'wltp_verbrauch', label_de: 'WLTP Verbrauch', label_en: 'WLTP Consumption', visible: false, order: 9 },
  { key: 'basis_preis', label_de: 'Basispreis', label_en: 'Base Price', visible: true, order: 10 },
  { key: 'hoechster_preis', label_de: 'Höchster Preis', label_en: 'Max Price', visible: false, order: 11 },
  { key: 'null_hundert', label_de: '0–100 (s)', label_en: '0–100 (s)', visible: true, order: 12 },
  { key: 'ps', label_de: 'PS', label_en: 'HP', visible: false, order: 13 },
  { key: 'top_speed', label_de: 'Top Speed', label_en: 'Top Speed', visible: false, order: 14 },
  { key: 'volt', label_de: 'Volt', label_en: 'Volt', visible: false, order: 15 },
  { key: 'markteinfuehrung', label_de: 'Markteinführung', label_en: 'Market Launch', visible: false, order: 16 },
]

export default function AdminPanel({
  cars,
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
    await saveSettings(EV_DEFAULT_FIELDS)
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
              fields={formFields}
              addFn={addFn}
              updateFn={updateFn}
              car={view === 'edit' ? editCar : null}
              onDone={() => { setView('list'); setEditCar(null) }}
            />
          )}
          {view === 'import' && (
            <CarImport
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
