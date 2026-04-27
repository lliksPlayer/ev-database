const YEARS = 5
const DIESEL_PRICE_EUR_PER_L = 1.58
const EV_TOLL_PER_KM = 0.09
const EV_MAINTENANCE_PER_KM = 0.13
const DIESEL_MAINTENANCE_PER_KM = 0.2

const PROFILE_ASSUMPTIONS = Object.freeze({
  urban: {
    operatingDays: 250,
    dieselConsumptionLPer100km: 34,
    dieselTollPerKm: 0.3,
  },
  regional: {
    operatingDays: 235,
    dieselConsumptionLPer100km: 31,
    dieselTollPerKm: 0.33,
  },
  longhaul: {
    operatingDays: 220,
    dieselConsumptionLPer100km: 29,
    dieselTollPerKm: 0.348,
  },
})

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getDepotPowerPrice(gridStatus) {
  if (gridStatus === 'secured') return 0.21
  if (gridStatus === 'none') return 0.28
  return 0.24
}

function getPublicChargePrice(chargingStandard) {
  return chargingStandard === 'mcs' ? 0.69 : 0.61
}

function getChargingMix(state) {
  let publicShare = 0

  if (state.publicFastCharge) {
    publicShare = state.depotCharging ? 0.2 : 1
  }

  if (state.useCase === 'regional') {
    publicShare = Math.max(publicShare, state.depotCharging ? 0.3 : 1)
  }

  if (state.useCase === 'longhaul') {
    publicShare = Math.max(publicShare, state.depotCharging ? 0.55 : 1)
  }

  if (state.chargeWindow === 'between_shifts') {
    publicShare = Math.max(publicShare, state.depotCharging ? 0.35 : 1)
  }

  if (state.chargeWindow === 'tight') {
    publicShare = Math.max(publicShare, state.depotCharging ? 0.55 : 1)
  }

  if (!state.depotCharging) {
    publicShare = state.publicFastCharge ? 1 : 0
  }

  publicShare = clamp(publicShare, 0, 1)

  return {
    publicShare,
    depotShare: clamp(1 - publicShare, 0, 1),
  }
}

function getThgBonus(model) {
  if (model.maxPayloadT >= 24) return 3900
  if (model.maxPayloadT >= 20) return 3400
  return 2500
}

function getLargestLever(components) {
  const ordered = Object.entries(components).sort((a, b) => b[1] - a[1])
  return ordered[0]?.[0] ?? 'toll'
}

function getRiskKey(state, model, chargingMix, breakEvenYears) {
  if (state.depotCharging && state.gridStatus === 'none') return 'grid'
  if (chargingMix.publicShare >= 0.55) return 'publicCharging'
  if (state.chargingStandard === 'mcs' && model.chargingStandard !== 'mcs') return 'chargingStandard'
  if (breakEvenYears === null || breakEvenYears > YEARS) return 'timeline'
  return 'balanced'
}

function getTone(fiveYearDelta) {
  if (fiveYearDelta <= 0) return 'advantage'
  if (fiveYearDelta <= 60000) return 'close'
  return 'pressure'
}

export function calculateTruckTcoPreview(state, model) {
  if (!state || !model) return null

  const profile = PROFILE_ASSUMPTIONS[state.useCase] ?? PROFILE_ASSUMPTIONS.regional
  const annualKm = state.dailyKm * profile.operatingDays
  const chargingMix = getChargingMix(state)
  const depotPowerPrice = getDepotPowerPrice(state.gridStatus)
  const publicChargePrice = getPublicChargePrice(state.chargingStandard)
  const blendedPowerPrice =
    chargingMix.depotShare * depotPowerPrice + chargingMix.publicShare * publicChargePrice

  const annualEnergyKwh = annualKm * model.energyConsumptionKwhPer100km / 100
  const annualEnergyCost = annualEnergyKwh * blendedPowerPrice
  const annualDieselLiters = annualKm * profile.dieselConsumptionLPer100km / 100
  const annualDieselCost = annualDieselLiters * DIESEL_PRICE_EUR_PER_L
  const annualEvToll = annualKm * EV_TOLL_PER_KM
  const annualDieselToll = annualKm * profile.dieselTollPerKm
  const annualEvMaintenance = annualKm * EV_MAINTENANCE_PER_KM
  const annualDieselMaintenance = annualKm * DIESEL_MAINTENANCE_PER_KM
  const annualThgBonus = getThgBonus(model)
  const acquisitionDelta = model.purchasePriceEur - model.dieselEquivalentPriceEur

  const annualEnergyBenefit = annualDieselCost - annualEnergyCost
  const annualTollBenefit = annualDieselToll - annualEvToll
  const annualMaintenanceBenefit = annualDieselMaintenance - annualEvMaintenance
  const annualOperatingBenefit =
    annualEnergyBenefit + annualTollBenefit + annualMaintenanceBenefit + annualThgBonus

  const fiveYearEvTco =
    model.purchasePriceEur +
    YEARS * (annualEnergyCost + annualEvToll + annualEvMaintenance) -
    YEARS * annualThgBonus
  const fiveYearDieselTco =
    model.dieselEquivalentPriceEur +
    YEARS * (annualDieselCost + annualDieselToll + annualDieselMaintenance)
  const fiveYearDelta = fiveYearEvTco - fiveYearDieselTco
  const breakEvenYears = annualOperatingBenefit > 0 ? acquisitionDelta / annualOperatingBenefit : null

  return {
    years: YEARS,
    annualKm,
    chargingMix,
    depotPowerPrice,
    publicChargePrice,
    blendedPowerPrice,
    annualEnergyKwh,
    annualEnergyCost,
    annualDieselCost,
    annualTollBenefit,
    annualMaintenanceBenefit,
    annualThgBonus,
    annualOperatingBenefit,
    acquisitionDelta,
    fiveYearEvTco,
    fiveYearDieselTco,
    fiveYearDelta,
    breakEvenYears,
    tone: getTone(fiveYearDelta),
    leverage: getLargestLever({
      toll: annualTollBenefit,
      energy: annualEnergyBenefit,
      maintenance: annualMaintenanceBenefit,
      thg: annualThgBonus,
    }),
    risk: getRiskKey(state, model, chargingMix, breakEvenYears),
  }
}
