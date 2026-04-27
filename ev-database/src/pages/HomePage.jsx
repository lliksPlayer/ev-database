import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCars } from '../hooks/useCars'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { EV_CARD_FIELDS, getFieldDefinition } from '../entities/vehicle/fields.js'
import ViewToggle from '../components/cars/ViewToggle'
import CarGrid from '../components/cars/CarGrid'
import CarList from '../components/cars/CarList'
import CarDetail from '../components/cars/CarDetail'
import { filterCarsByQuery, getCatalogSortOptions, sortCars } from '../features/catalog/catalogQuery.js'
import './HomePage.css'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const { cars, loading: carsLoading } = useCars()
  const { fields, loading: fieldsLoading } = useSettings()

  const [view, setView] = useState(() => localStorage.getItem('view') || 'grid')
  const [size, setSize] = useState(() => localStorage.getItem('gridSize') || 'medium')
  const [selectedCar, setSelectedCar] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState('default')
  const [sortDirection, setSortDirection] = useState('desc')
  const displayFields = fields.length > 0 ? fields : EV_CARD_FIELDS
  const language = i18n.resolvedLanguage?.startsWith('de') ? 'de' : 'en'
  const sortOptions = useMemo(() => getCatalogSortOptions('ev', language), [language])
  const filteredCars = useMemo(() => {
    const matchingCars = filterCarsByQuery(cars, searchQuery)
    return sortCars(matchingCars, sortKey, sortDirection, 'ev')
  }, [cars, searchQuery, sortDirection, sortKey])
  const selectedSortDefinition = sortKey === 'default' ? null : getFieldDefinition(sortKey)

  const handleSetView = (v) => { setView(v); localStorage.setItem('view', v) }
  const handleSetSize = (s) => { setSize(s); localStorage.setItem('gridSize', s) }

  if (carsLoading || fieldsLoading) {
    return (
      <div className="catalog-page">
        <div className="catalog-shell">
          <p className="home-loading">{t('home.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="catalog-page">
      <div className="catalog-shell">
        <section className="catalog-results-stage">
          <header className="catalog-header">
            <div className="catalog-results-copy">
              <span className="catalog-section-kicker">{t('home.resultsPurpose')}</span>
              <h2 className="catalog-section-title">{t('home.resultsTitleEv')}</h2>
              <p className="catalog-section-description">{t('home.resultsDescriptionEv')}</p>
            </div>
            <div className="catalog-toolbar">
              <div className="catalog-count-pill">{filteredCars.length} {t('home.vehicles', 'Fahrzeuge')}</div>
              <ViewToggle view={view} setView={handleSetView} size={size} setSize={handleSetSize} />
            </div>
          </header>
          <div className="catalog-query-bar">
            <label className="catalog-search-field">
              <Search size={16} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('home.searchPlaceholder')}
              />
            </label>
            <div className="catalog-sort-panel">
              <div className="catalog-sort-head">
                <SlidersHorizontal size={16} />
                <span>{t('home.sortLabel')}</span>
              </div>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="catalog-sort-direction"
                onClick={() => setSortDirection((current) => current === 'desc' ? 'asc' : 'desc')}
              >
                {t(sortDirection === 'desc' ? 'home.sortDesc' : 'home.sortAsc')}
              </button>
            </div>
          </div>
          <main className="catalog-content">
            {filteredCars.length === 0
              ? <p className="home-empty">{t('home.noCars')}</p>
              : view === 'grid'
                ? <CarGrid cars={filteredCars} fields={displayFields} size={size} onCarClick={setSelectedCar} variant="ev" />
                : <CarList cars={filteredCars} fields={displayFields} onCarClick={setSelectedCar} variant="ev" />
            }
          </main>
          {selectedSortDefinition && (
            <p className="catalog-sort-note">
              {t('home.sortingBy', {
                field: selectedSortDefinition.labels?.[language] ?? selectedSortDefinition.key,
                direction: t(sortDirection === 'desc' ? 'home.sortDescLabel' : 'home.sortAscLabel'),
              })}
            </p>
          )}
        </section>
      </div>
      {selectedCar && <CarDetail car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  )
}
