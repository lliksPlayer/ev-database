import { lazy, startTransition, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react'
import { useCarsCollection } from '../hooks/useCars'
import UserModeToggle from '../components/calculator/UserModeToggle'
import VehicleSlot from '../components/calculator/VehicleSlot'
import { normalizeVehicle } from '../entities/vehicle/vehicleSchema.js'
import {
  applyVehicleDefaultsToAssumptions,
  applyFormPatchToAssumptions,
  COMPARISON_DETAIL_LEVELS,
  createSlotAssumptions,
  getSlotFormValues,
  setAssumptionsDetailLevel,
} from '../features/comparison/model/comparisonState.js'
import { validateCalculatorInputs } from '../features/comparison/model/validation.js'
import './Calculator.css'

const COMPARISON_MODES = new Set(['ev-ice', 'ev-ev'])
const SHARED_PROFILE_KEYS = new Set(['jahresKm', 'jahre', 'profileMode', 'cityShare', 'ruralShare', 'highwayShare'])
const ResultsPanel = lazy(() => import('../components/calculator/ResultsPanel'))

export default function Calculator() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialModeParam = searchParams.get('mode') || ''
  const initialEv1Id = searchParams.get('ev1') || ''
  const initialEv2Id = searchParams.get('ev2') || ''
  const initialIce1Id = searchParams.get('ice1') || ''
  const [compModeOverride, setCompModeOverride] = useState(null)
  const [expertMode, setExpertMode] = useState(false)
  const [vehicleAId, setVehicleAId] = useState(initialEv1Id)
  const [vehicleBEvId, setVehicleBEvId] = useState(initialEv2Id)
  const [vehicleBIceId, setVehicleBIceId] = useState(initialIce1Id)
  const [useManualIce, setUseManualIce] = useState(false)
  const [manualIceVehicle, setManualIceVehicle] = useState(null)
  const [assumptionsA, setAssumptionsA] = useState(() => createSlotAssumptions('ev'))
  const [assumptionsB, setAssumptionsB] = useState(() => createSlotAssumptions(initialEv2Id ? 'ev' : 'ice'))
  const { cars: evCars, loading: evLoading } = useCarsCollection('ev_cars')
  const { cars: iceCars, loading: iceLoading } = useCarsCollection('ice_cars')
  const routeCompMode = COMPARISON_MODES.has(initialModeParam)
    ? initialModeParam
    : initialEv2Id
      ? 'ev-ev'
      : 'ev-ice'
  const routeSelectionKey = [routeCompMode, initialEv1Id, initialEv2Id, initialIce1Id].join('|')
  const lastSyncedRouteKey = useRef('')
  const lastInternalRouteKey = useRef('')
  const compMode = compModeOverride?.routeKey === routeSelectionKey
    ? compModeOverride.mode
    : routeCompMode

  const vehicleA = useMemo(
    () => evCars.find((car) => car.id === vehicleAId) ?? null,
    [evCars, vehicleAId]
  )
  const vehicleB = useMemo(() => {
    if (compMode === 'ev-ev') {
      return evCars.find((car) => car.id === vehicleBEvId) ?? null
    }

    if (useManualIce && manualIceVehicle) {
      return normalizeVehicle(manualIceVehicle, 'ice')
    }

    return iceCars.find((car) => car.id === vehicleBIceId) ?? null
  }, [compMode, evCars, iceCars, manualIceVehicle, useManualIce, vehicleBEvId, vehicleBIceId])
  const vehicleBType = compMode === 'ev-ev' ? 'ev' : 'ice'
  const detailLevel = expertMode ? COMPARISON_DETAIL_LEVELS.EXPERT : COMPARISON_DETAIL_LEVELS.STANDARD
  const effectiveAssumptionsA = useMemo(
    () => setAssumptionsDetailLevel('ev', assumptionsA, detailLevel),
    [assumptionsA, detailLevel]
  )
  const effectiveAssumptionsB = useMemo(
    () => setAssumptionsDetailLevel(vehicleBType, assumptionsB, detailLevel),
    [assumptionsB, detailLevel, vehicleBType]
  )
  const validationA = useMemo(
    () => validateCalculatorInputs('ev', effectiveAssumptionsA),
    [effectiveAssumptionsA]
  )
  const validationB = useMemo(
    () => validateCalculatorInputs(vehicleBType, effectiveAssumptionsB),
    [effectiveAssumptionsB, vehicleBType]
  )

  const updateAssumptionsA = (patch) => {
    const [sharedPatch, localPatch] = splitSharedProfilePatch(patch)

    if (Object.keys(sharedPatch).length > 0) {
      setAssumptionsA((previous) => applyFormPatchToAssumptions('ev', previous, sharedPatch))
      setAssumptionsB((previous) => applyFormPatchToAssumptions(vehicleBType, previous, sharedPatch))
    }

    if (Object.keys(localPatch).length > 0) {
      setAssumptionsA((previous) => applyFormPatchToAssumptions('ev', previous, localPatch))
    }
  }

  const updateAssumptionsB = (patch) => {
    const [sharedPatch, localPatch] = splitSharedProfilePatch(patch)

    if (Object.keys(sharedPatch).length > 0) {
      setAssumptionsA((previous) => applyFormPatchToAssumptions('ev', previous, sharedPatch))
      setAssumptionsB((previous) => applyFormPatchToAssumptions(vehicleBType, previous, sharedPatch))
    }

    if (Object.keys(localPatch).length > 0) {
      setAssumptionsB((previous) => applyFormPatchToAssumptions(vehicleBType, previous, localPatch))
    }
  }

  const handleExpertMode = (on) => {
    setExpertMode(on)
    const nextDetailLevel = on ? COMPARISON_DETAIL_LEVELS.EXPERT : COMPARISON_DETAIL_LEVELS.STANDARD
    setAssumptionsA((previous) => setAssumptionsDetailLevel('ev', previous, nextDetailLevel))
    setAssumptionsB((previous) =>
      setAssumptionsDetailLevel(compMode === 'ev-ev' ? 'ev' : 'ice', previous, nextDetailLevel)
    )
  }

  const handleCompMode = (mode) => {
    setCompModeOverride({ routeKey: routeSelectionKey, mode })
    setVehicleBEvId('')
    setVehicleBIceId('')
    setUseManualIce(false)
    setManualIceVehicle(null)
    const nextVehicleBType = mode === 'ev-ev' ? 'ev' : 'ice'
    const nextSharedProfile = {
      jahresKm: assumptionsA.profile.annualKm,
      jahre: assumptionsA.profile.years,
      profileMode: assumptionsA.profile.profileMode,
      cityShare: assumptionsA.profile.cityShare,
      ruralShare: assumptionsA.profile.ruralShare,
      highwayShare: assumptionsA.profile.highwayShare,
    }
    setAssumptionsB(
      applyFormPatchToAssumptions(
        nextVehicleBType,
        createSlotAssumptions(
          nextVehicleBType,
          expertMode ? COMPARISON_DETAIL_LEVELS.EXPERT : COMPARISON_DETAIL_LEVELS.STANDARD
        ),
        nextSharedProfile
      )
    )
  }

  const handleVehicleAChange = (vehicle) => {
    const nextVehicle = normalizeVehicle(vehicle, 'ev')
    setVehicleAId(nextVehicle?.id || '')
    setAssumptionsA((previous) => applyVehicleDefaultsToAssumptions('ev', previous, nextVehicle))
  }

  const handleVehicleBChange = (vehicle) => {
    const vehicleType = compMode === 'ev-ev' ? 'ev' : 'ice'
    const nextVehicle = normalizeVehicle(vehicle, vehicleType)

    if (compMode === 'ev-ev') {
      setVehicleBEvId(nextVehicle?.id || '')
      setUseManualIce(false)
      setManualIceVehicle(null)
    } else if (nextVehicle?.id) {
      setVehicleBIceId(nextVehicle.id)
      setUseManualIce(false)
      setManualIceVehicle(null)
    } else {
      setUseManualIce(true)
      setManualIceVehicle(nextVehicle)
    }

    setAssumptionsB((previous) => applyVehicleDefaultsToAssumptions(vehicleType, previous, nextVehicle))
  }

  const handleManualIceModeChange = (enabled) => {
    setUseManualIce(enabled)

    if (enabled) {
      if (manualIceVehicle) {
        const normalizedManualVehicle = normalizeVehicle(manualIceVehicle, 'ice')
        setManualIceVehicle(normalizedManualVehicle)
        setAssumptionsB((previous) => applyVehicleDefaultsToAssumptions('ice', previous, normalizedManualVehicle))
        return
      }

      const selectedDatabaseVehicle = iceCars.find((car) => car.id === vehicleBIceId) ?? null
      if (selectedDatabaseVehicle) {
        const normalizedDatabaseVehicle = normalizeVehicle(selectedDatabaseVehicle, 'ice')
        setManualIceVehicle(normalizedDatabaseVehicle)
        setAssumptionsB((previous) =>
          applyVehicleDefaultsToAssumptions('ice', previous, normalizedDatabaseVehicle)
        )
      }
      return
    }

    const selectedDatabaseVehicle = iceCars.find((car) => car.id === vehicleBIceId) ?? null
    if (selectedDatabaseVehicle) {
      setAssumptionsB((previous) =>
        applyVehicleDefaultsToAssumptions('ice', previous, selectedDatabaseVehicle)
      )
    }
  }

  const hasBlockingValidationErrors = validationA.hasBlockingErrors || validationB.hasBlockingErrors
  const canShowResults = vehicleA && vehicleB && !hasBlockingValidationErrors

  useEffect(() => {
    const nextParams = new URLSearchParams()
    nextParams.set('mode', compMode)

    if (vehicleAId) {
      nextParams.set('ev1', vehicleAId)
    }

    if (compMode === 'ev-ev') {
      if (vehicleBEvId) {
        nextParams.set('ev2', vehicleBEvId)
      }
    } else if (!useManualIce && vehicleBIceId) {
      nextParams.set('ice1', vehicleBIceId)
    }

    const nextRouteKey = [
      nextParams.get('mode') || 'ev-ice',
      nextParams.get('ev1') || '',
      nextParams.get('ev2') || '',
      nextParams.get('ice1') || '',
    ].join('|')

    if (nextRouteKey === routeSelectionKey) {
      return
    }

    lastInternalRouteKey.current = nextRouteKey
    setSearchParams(nextParams, { replace: true })
  }, [compMode, routeSelectionKey, setSearchParams, useManualIce, vehicleAId, vehicleBEvId, vehicleBIceId])

  useEffect(() => {
    const hasRouteSelection = Boolean(initialEv1Id || initialEv2Id || initialIce1Id)
    if (!hasRouteSelection) return
    if (routeSelectionKey === lastInternalRouteKey.current) {
      lastSyncedRouteKey.current = routeSelectionKey
      return
    }

    const needsFallbackVehicleA = Boolean((initialEv2Id || initialIce1Id) && !initialEv1Id)
    const hasRequiredVehicles =
      (!initialEv1Id || evCars.length > 0) &&
      (!initialEv2Id || evCars.length > 0) &&
      (!initialIce1Id || iceCars.length > 0) &&
      (!needsFallbackVehicleA || evCars.length > 0)

    if (!hasRequiredVehicles || lastSyncedRouteKey.current === routeSelectionKey) return
    const nextVehicleA = initialEv1Id
      ? evCars.find((car) => car.id === initialEv1Id) ?? null
      : null
    const nextVehicleBEv = initialEv2Id
      ? evCars.find((car) => car.id === initialEv2Id) ?? null
      : null
    const nextVehicleBIce = initialIce1Id
      ? iceCars.find((car) => car.id === initialIce1Id) ?? null
      : null
    const fallbackVehicleA = (initialEv2Id || initialIce1Id) && !initialEv1Id && evCars.length > 0
      ? evCars[0]
      : null

    startTransition(() => {
      if (nextVehicleA) {
        setVehicleAId(nextVehicleA.id)
        setAssumptionsA((previous) => applyVehicleDefaultsToAssumptions('ev', previous, nextVehicleA))
      } else if (fallbackVehicleA) {
        setVehicleAId(fallbackVehicleA.id)
        setAssumptionsA((previous) => applyVehicleDefaultsToAssumptions('ev', previous, fallbackVehicleA))
      }

      if (nextVehicleBEv) {
        setVehicleBEvId(nextVehicleBEv.id)
        setUseManualIce(false)
        setManualIceVehicle(null)
        setAssumptionsB((previous) => applyVehicleDefaultsToAssumptions('ev', previous, nextVehicleBEv))
      }

      if (nextVehicleBIce) {
        setVehicleBIceId(nextVehicleBIce.id)
        setUseManualIce(false)
        setManualIceVehicle(null)
        setAssumptionsB((previous) => applyVehicleDefaultsToAssumptions('ice', previous, nextVehicleBIce))
      }
    })

    lastSyncedRouteKey.current = routeSelectionKey
  }, [routeSelectionKey, initialEv1Id, initialEv2Id, initialIce1Id, evCars, iceCars])

  return (
    <div className="calculator-page">
      <section className="calc-hero">
        <div className="calc-hero-copy">
          <span className="calc-kicker">{t('calc.heroPurpose')}</span>
          <h1 className="calc-header-title">{t('calc.title')}</h1>
          <p className="calc-header-subtitle">{t('calc.pageSubtitle')}</p>
        </div>
        <div className="calc-controls">
          <div className="calc-control-group">
            <span className="calc-control-label">{t('calc.compareModeLabel')}</span>
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
          </div>
          <div className="calc-control-group">
            <span className="calc-control-label">{t('calc.detailModeLabel')}</span>
            <UserModeToggle expertMode={expertMode} onChange={handleExpertMode} />
          </div>
        </div>
      </section>

      <section className="calc-stage calc-stage--setup">
        <div className="calc-stage-header">
          <div className="calc-stage-copy">
            <span className="calc-stage-kicker">{t('calc.setupPurpose')}</span>
            <h2 className="calc-stage-title">{t('calc.setupTitle')}</h2>
            <p className="calc-stage-description">{t('calc.setupDescription')}</p>
          </div>
        </div>
        <div className="calc-slots">
          <VehicleSlot
            label={t('calc.vehicleA')}
            type="ev"
            vehicle={vehicleA}
            vehicles={evCars}
            loading={evLoading}
            params={getSlotFormValues('ev', effectiveAssumptionsA, vehicleA)}
            validation={validationA}
            expertMode={expertMode}
            onVehicleChange={handleVehicleAChange}
            onParamsChange={updateAssumptionsA}
          />
          <VehicleSlot
            label={t('calc.vehicleB')}
            type={vehicleBType}
            vehicle={vehicleB}
            vehicles={vehicleBType === 'ev' ? evCars : iceCars}
            loading={vehicleBType === 'ev' ? evLoading : iceLoading}
            params={getSlotFormValues(vehicleBType, effectiveAssumptionsB, vehicleB)}
            validation={validationB}
            expertMode={expertMode}
            manualEntryEnabled={vehicleBType === 'ice' ? useManualIce : false}
            onManualEntryChange={vehicleBType === 'ice' ? handleManualIceModeChange : undefined}
            onVehicleChange={handleVehicleBChange}
            onParamsChange={updateAssumptionsB}
          />
        </div>
      </section>

      <section className="calc-stage calc-stage--results">
        <div className="calc-stage-header calc-stage-header--quiet">
          <div className="calc-stage-copy">
            <span className="calc-stage-kicker">{t('calc.resultsPurpose')}</span>
            <h2 className="calc-stage-title">{t('calc.resultsTitle')}</h2>
            <p className="calc-stage-description">{t('calc.resultsDescription')}</p>
          </div>
        </div>
        {canShowResults
          ? (
              <Suspense fallback={<div className="calc-results-loading">{t('calc.loadingResults')}</div>}>
                <ResultsPanel
                  vehicleA={vehicleA}
                  assumptionsA={effectiveAssumptionsA}
                  vehicleB={vehicleB}
                  assumptionsB={effectiveAssumptionsB}
                />
              </Suspense>
            )
          : <div className="calc-placeholder">
              <Zap className="calc-placeholder-icon" size={40} />
              {vehicleA && vehicleB && hasBlockingValidationErrors
                ? t('calc.fixInputs')
                : t('calc.selectBoth')
              }
            </div>
        }
      </section>
    </div>
  )
}

function splitSharedProfilePatch(patch) {
  return Object.entries(patch).reduce(
    ([shared, local], [key, value]) => {
      if (SHARED_PROFILE_KEYS.has(key)) {
        shared[key] = value
      } else {
        local[key] = value
      }

      return [shared, local]
    },
    [{}, {}]
  )
}
