export const COMPARISON_DETAIL_LEVELS = Object.freeze({
  STANDARD: 'standard',
  EXPERT: 'expert',
})

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

const BASE_ASSUMPTIONS = Object.freeze({
  profile: {
    annualKm: 15000,
    years: 8,
    profileMode: 'normal',
    cityShare: 35,
    ruralShare: 40,
    highwayShare: 25,
  },
  acquisition: {
    purchasePrice: null,
    grant: 0,
    financingType: 'cash',
    interestRate: 0,
    residualValuePercent: 30,
    leaseMonthlyRate: 0,
    leaseDownPayment: 0,
  },
  operating: {
    maintenanceAnnual: 800,
    insuranceAnnual: 1200,
    taxAnnual: 200,
  },
})

const VEHICLE_ASSUMPTIONS = Object.freeze({
  ev: {
    ev: {
      consumptionKwhPer100km: null,
      charging: {
        homeChargeShare: 80,
        publicAcChargeShare: 0,
        fastChargeShare: 20,
        homePricePerKwh: 0.28,
        publicAcPricePerKwh: 0.45,
        fastChargePricePerKwh: 0.55,
        homeLossPercent: 15,
        publicAcLossPercent: 15,
        fastChargeLossPercent: 8,
      },
      thgAnnual: 250,
      wallboxPurchaseCost: 0,
      wallboxInstallationCost: 0,
    },
  },
  ice: {
    ice: {
      fuelConsumptionLPer100km: null,
      fuelPricePerLiter: 1.75,
      fuelType: null,
    },
  },
})

function expertResetKeys(vehicleType) {
  const commonKeys = {
    acquisition: [
      'grant',
      'interestRate',
      'financingType',
      'residualValuePercent',
      'leaseMonthlyRate',
      'leaseDownPayment',
    ],
    operating: ['maintenanceAnnual', 'insuranceAnnual', 'taxAnnual'],
  }

  if (vehicleType === 'ev') {
    return {
      ...commonKeys,
      ev: ['thgAnnual', 'wallboxPurchaseCost', 'wallboxInstallationCost'],
      charging: ['homeLossPercent', 'publicAcLossPercent', 'fastChargeLossPercent'],
    }
  }

  return commonKeys
}

export function createDefaultAssumptions(vehicleType) {
  return {
    ...clone(BASE_ASSUMPTIONS),
    ...clone(VEHICLE_ASSUMPTIONS[vehicleType] ?? {}),
  }
}

export function applyDetailLevelToAssumptions(vehicleType, assumptions, detailLevel = COMPARISON_DETAIL_LEVELS.STANDARD) {
  const next = clone(assumptions)

  if (detailLevel === COMPARISON_DETAIL_LEVELS.EXPERT) {
    return next
  }

  const defaults = createDefaultAssumptions(vehicleType)
  const resetKeys = expertResetKeys(vehicleType)

  resetKeys.acquisition?.forEach((key) => {
    next.acquisition[key] = defaults.acquisition[key]
  })

  resetKeys.operating?.forEach((key) => {
    next.operating[key] = defaults.operating[key]
  })

  if (vehicleType === 'ev') {
    resetKeys.ev?.forEach((key) => {
      next.ev[key] = defaults.ev[key]
    })

    resetKeys.charging?.forEach((key) => {
      next.ev.charging[key] = defaults.ev.charging[key]
    })
  }

  return next
}

export function createSlotAssumptions(vehicleType, detailLevel = COMPARISON_DETAIL_LEVELS.STANDARD) {
  return applyDetailLevelToAssumptions(
    vehicleType,
    createDefaultAssumptions(vehicleType),
    detailLevel
  )
}
