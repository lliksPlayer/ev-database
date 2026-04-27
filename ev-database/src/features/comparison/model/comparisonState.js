import {
  applyDetailLevelToAssumptions,
  COMPARISON_DETAIL_LEVELS,
  createSlotAssumptions,
} from './defaultAssumptions.js'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : null
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== ''
}

const PROFILE_MODE_PRESETS = Object.freeze({
  normal: { cityShare: 35, ruralShare: 40, highwayShare: 25 },
  city: { cityShare: 70, ruralShare: 20, highwayShare: 10 },
  rural: { cityShare: 20, ruralShare: 65, highwayShare: 15 },
  highway: { cityShare: 10, ruralShare: 15, highwayShare: 75 },
})

export { COMPARISON_DETAIL_LEVELS, createSlotAssumptions }

export function setAssumptionsDetailLevel(vehicleType, assumptions, detailLevel) {
  return applyDetailLevelToAssumptions(vehicleType, assumptions, detailLevel)
}

export function applyVehicleDefaultsToAssumptions(vehicleType, assumptions, vehicle) {
  if (!vehicle) return assumptions

  const next = clone(assumptions)
  next.acquisition.purchasePrice = normalizeNumber(vehicle.basis_preis)

  if (vehicleType === 'ev') {
    if (hasValue(vehicle.wltp_verbrauch)) {
      next.ev.consumptionKwhPer100km = normalizeNumber(vehicle.wltp_verbrauch)
    }
  } else {
    if (hasValue(vehicle.verbrauch_l_100km)) {
      next.ice.fuelConsumptionLPer100km = normalizeNumber(vehicle.verbrauch_l_100km)
    }
    if (hasValue(vehicle.kraftstoff)) {
      next.ice.fuelType = vehicle.kraftstoff
    }
  }

  return next
}

export function getSlotFormValues(vehicleType, assumptions, vehicle = null) {
  const base = {
    kaufpreis: assumptions.acquisition.purchasePrice ?? vehicle?.basis_preis ?? '',
    jahresKm: assumptions.profile.annualKm,
    jahre: assumptions.profile.years,
    profileMode: assumptions.profile.profileMode ?? 'normal',
    cityShare: assumptions.profile.cityShare,
    ruralShare: assumptions.profile.ruralShare,
    highwayShare: assumptions.profile.highwayShare,
    financingType: assumptions.acquisition.financingType,
    wartung: assumptions.operating.maintenanceAnnual,
    versicherung: assumptions.operating.insuranceAnnual,
    steuer: assumptions.operating.taxAnnual,
    restwertProzent: assumptions.acquisition.residualValuePercent,
    foerderung: assumptions.acquisition.grant,
    zinsSatz: assumptions.acquisition.interestRate,
    leaseMonthlyRate: assumptions.acquisition.leaseMonthlyRate,
    leaseDownPayment: assumptions.acquisition.leaseDownPayment,
  }

  if (vehicleType === 'ev') {
    return {
      ...base,
      verbrauchKwh: assumptions.ev.consumptionKwhPer100km ?? vehicle?.wltp_verbrauch ?? '',
      homePrice: assumptions.ev.charging.homePricePerKwh,
      publicPrice: assumptions.ev.charging.publicAcPricePerKwh,
      fastPrice: assumptions.ev.charging.fastChargePricePerKwh,
      homeShare: assumptions.ev.charging.homeChargeShare,
      publicShare: assumptions.ev.charging.publicAcChargeShare,
      fastShare: assumptions.ev.charging.fastChargeShare,
      thgQuote: assumptions.ev.thgAnnual,
      homeLoss: assumptions.ev.charging.homeLossPercent,
      publicLoss: assumptions.ev.charging.publicAcLossPercent,
      fastLoss: assumptions.ev.charging.fastChargeLossPercent,
      wallboxPurchaseCost: assumptions.ev.wallboxPurchaseCost,
      wallboxInstallationCost: assumptions.ev.wallboxInstallationCost,
      acPreis: assumptions.ev.charging.homePricePerKwh,
      dcPreis: assumptions.ev.charging.fastChargePricePerKwh,
      acProzent: assumptions.ev.charging.homeChargeShare + assumptions.ev.charging.publicAcChargeShare,
      acLadeverlust: assumptions.ev.charging.homeLossPercent,
      dcLadeverlust: assumptions.ev.charging.fastChargeLossPercent,
    }
  }

  return {
    ...base,
    verbrauchL: assumptions.ice.fuelConsumptionLPer100km ?? vehicle?.verbrauch_l_100km ?? '',
    kraftstoffPreis: assumptions.ice.fuelPricePerLiter,
  }
}

export function applyFormPatchToAssumptions(vehicleType, assumptions, patch) {
  const next = clone(assumptions)

  Object.entries(patch).forEach(([key, rawValue]) => {
    switch (key) {
      case 'financingType':
        next.acquisition.financingType = rawValue
        break
      case 'kaufpreis':
        next.acquisition.purchasePrice = normalizeNumber(rawValue)
        break
      case 'jahresKm':
        next.profile.annualKm = normalizeNumber(rawValue)
        break
      case 'jahre':
        next.profile.years = normalizeNumber(rawValue)
        break
      case 'profileMode': {
        const nextMode = typeof rawValue === 'string' ? rawValue : 'normal'
        next.profile.profileMode = nextMode
        const preset = PROFILE_MODE_PRESETS[nextMode]
        if (preset) {
          next.profile.cityShare = preset.cityShare
          next.profile.ruralShare = preset.ruralShare
          next.profile.highwayShare = preset.highwayShare
        }
        break
      }
      case 'cityShare':
        next.profile.cityShare = normalizeNumber(rawValue)
        break
      case 'ruralShare':
        next.profile.ruralShare = normalizeNumber(rawValue)
        break
      case 'highwayShare':
        next.profile.highwayShare = normalizeNumber(rawValue)
        break
      case 'wartung':
        next.operating.maintenanceAnnual = normalizeNumber(rawValue)
        break
      case 'versicherung':
        next.operating.insuranceAnnual = normalizeNumber(rawValue)
        break
      case 'steuer':
        next.operating.taxAnnual = normalizeNumber(rawValue)
        break
      case 'restwertProzent':
        next.acquisition.residualValuePercent = normalizeNumber(rawValue)
        break
      case 'foerderung':
        next.acquisition.grant = normalizeNumber(rawValue)
        break
      case 'zinsSatz':
        next.acquisition.interestRate = normalizeNumber(rawValue)
        break
      case 'leaseMonthlyRate':
        next.acquisition.leaseMonthlyRate = normalizeNumber(rawValue)
        break
      case 'leaseDownPayment':
        next.acquisition.leaseDownPayment = normalizeNumber(rawValue)
        break
      case 'verbrauchKwh':
        next.ev.consumptionKwhPer100km = normalizeNumber(rawValue)
        break
      case 'verbrauchL':
        next.ice.fuelConsumptionLPer100km = normalizeNumber(rawValue)
        break
      case 'acPreis':
      case 'homePrice':
        next.ev.charging.homePricePerKwh = normalizeNumber(rawValue)
        break
      case 'publicPrice':
        next.ev.charging.publicAcPricePerKwh = normalizeNumber(rawValue)
        break
      case 'dcPreis':
      case 'fastPrice':
        next.ev.charging.fastChargePricePerKwh = normalizeNumber(rawValue)
        break
      case 'acProzent': {
        const value = normalizeNumber(rawValue)
        const acShare = Math.min(Math.max(value ?? 0, 0), 100)
        next.ev.charging.homeChargeShare = acShare
        next.ev.charging.publicAcChargeShare = 0
        next.ev.charging.fastChargeShare = 100 - acShare
        break
      }
      case 'homeShare':
        next.ev.charging.homeChargeShare = normalizeNumber(rawValue)
        break
      case 'publicShare':
        next.ev.charging.publicAcChargeShare = normalizeNumber(rawValue)
        break
      case 'fastShare':
        next.ev.charging.fastChargeShare = normalizeNumber(rawValue)
        break
      case 'thgQuote':
        next.ev.thgAnnual = normalizeNumber(rawValue)
        break
      case 'acLadeverlust':
      case 'homeLoss':
        next.ev.charging.homeLossPercent = normalizeNumber(rawValue)
        if (key === 'acLadeverlust') {
          next.ev.charging.publicAcLossPercent = normalizeNumber(rawValue)
        }
        break
      case 'publicLoss':
        next.ev.charging.publicAcLossPercent = normalizeNumber(rawValue)
        break
      case 'dcLadeverlust':
      case 'fastLoss':
        next.ev.charging.fastChargeLossPercent = normalizeNumber(rawValue)
        break
      case 'wallboxPurchaseCost':
        next.ev.wallboxPurchaseCost = normalizeNumber(rawValue)
        break
      case 'wallboxInstallationCost':
        next.ev.wallboxInstallationCost = normalizeNumber(rawValue)
        break
      case 'kraftstoffPreis':
        next.ice.fuelPricePerLiter = normalizeNumber(rawValue)
        break
      default:
        break
    }
  })

  return next
}
