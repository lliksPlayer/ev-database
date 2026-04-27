function addFieldIssue(fieldIssues, field, tone, code, values = {}) {
  const previous = fieldIssues[field]
  if (!previous || (previous.tone !== 'error' && tone === 'error')) {
    fieldIssues[field] = { tone, code, values }
  }
}

function addNotice(notices, tone, code, values = {}) {
  notices.push({ tone, code, values })
}

function isNil(value) {
  return value === null || value === undefined || value === ''
}

function isPositive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function validateCalculatorInputs(vehicleType, assumptions) {
  const fieldIssues = {}
  const notices = []

  const {
    annualKm,
    years,
    cityShare,
    ruralShare,
    highwayShare,
  } = assumptions.profile

  const {
    purchasePrice,
    grant,
    financingType,
    interestRate,
    residualValuePercent,
    leaseMonthlyRate,
    leaseDownPayment,
  } = assumptions.acquisition

  const {
    maintenanceAnnual,
    insuranceAnnual,
    taxAnnual,
  } = assumptions.operating

  if (!isPositive(annualKm)) {
    addFieldIssue(fieldIssues, 'jahresKm', 'error', 'positiveRequired')
  }

  if (!isPositive(years)) {
    addFieldIssue(fieldIssues, 'jahre', 'error', 'positiveRequired')
  }

  const drivingShares = [
    { key: 'cityShare', value: cityShare },
    { key: 'ruralShare', value: ruralShare },
    { key: 'highwayShare', value: highwayShare },
  ]

  drivingShares.forEach(({ key, value }) => {
    if (!isNil(value) && (!isNonNegative(value) || value > 100)) {
      addFieldIssue(fieldIssues, key, 'error', 'percentRange')
    }
  })

  const drivingShareTotal = drivingShares.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
  if (drivingShareTotal <= 0) {
    addFieldIssue(fieldIssues, 'drivingProfile', 'error', 'profileShareTotalZero')
  } else if (drivingShareTotal !== 100) {
    addFieldIssue(fieldIssues, 'drivingProfile', 'warning', 'profileShareNormalized', { total: drivingShareTotal })
  }

  if (financingType !== 'lease' && !isPositive(purchasePrice)) {
    addFieldIssue(fieldIssues, 'kaufpreis', 'error', 'positiveRequired')
  }

  if (!isNil(grant) && !isNonNegative(grant)) {
    addFieldIssue(fieldIssues, 'foerderung', 'error', 'nonNegativeRequired')
  }

  if (isNonNegative(grant) && isPositive(purchasePrice) && grant > purchasePrice) {
    addFieldIssue(fieldIssues, 'foerderung', 'warning', 'grantExceedsPurchasePrice')
  }

  if (!isNil(maintenanceAnnual) && !isNonNegative(maintenanceAnnual)) {
    addFieldIssue(fieldIssues, 'wartung', 'error', 'nonNegativeRequired')
  }

  if (!isNil(insuranceAnnual) && !isNonNegative(insuranceAnnual)) {
    addFieldIssue(fieldIssues, 'versicherung', 'error', 'nonNegativeRequired')
  }

  if (!isNil(taxAnnual) && !isNonNegative(taxAnnual)) {
    addFieldIssue(fieldIssues, 'steuer', 'error', 'nonNegativeRequired')
  }

  if (financingType !== 'lease' && (
    !isNonNegative(residualValuePercent) || residualValuePercent > 100
  )) {
    addFieldIssue(fieldIssues, 'restwertProzent', 'error', 'percentRange')
  }

  if (financingType === 'loan' && (!isNil(interestRate) && !isNonNegative(interestRate))) {
    addFieldIssue(fieldIssues, 'zinsSatz', 'error', 'nonNegativeRequired')
  }

  if (financingType === 'lease') {
    if (!isPositive(leaseMonthlyRate)) {
      addFieldIssue(fieldIssues, 'leaseMonthlyRate', 'error', 'positiveRequired')
    }

    if (!isNil(leaseDownPayment) && !isNonNegative(leaseDownPayment)) {
      addFieldIssue(fieldIssues, 'leaseDownPayment', 'error', 'nonNegativeRequired')
    }

    if (isNonNegative(residualValuePercent) && residualValuePercent > 0) {
      addNotice(notices, 'info', 'leaseIgnoresResidual')
    }
  }

  if (vehicleType === 'ev') {
    const charging = assumptions.ev.charging
    if (!isPositive(assumptions.ev.consumptionKwhPer100km)) {
      addFieldIssue(fieldIssues, 'verbrauchKwh', 'error', 'positiveRequired')
    }

    const shares = [
      { key: 'homeShare', value: charging.homeChargeShare },
      { key: 'publicShare', value: charging.publicAcChargeShare },
      { key: 'fastShare', value: charging.fastChargeShare },
    ]

    shares.forEach(({ key, value }) => {
      if (!isNil(value) && (!isNonNegative(value) || value > 100)) {
        addFieldIssue(fieldIssues, key, 'error', 'percentRange')
      }
    })

    const shareTotal = shares.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
    if (shareTotal <= 0) {
      addFieldIssue(fieldIssues, 'chargeProfile', 'error', 'chargeShareTotalZero')
    } else if (shareTotal !== 100) {
      addFieldIssue(fieldIssues, 'chargeProfile', 'warning', 'chargeShareNormalized', { total: shareTotal })
    }

    ;[
      ['homePrice', charging.homePricePerKwh],
      ['publicPrice', charging.publicAcPricePerKwh],
      ['fastPrice', charging.fastChargePricePerKwh],
    ].forEach(([key, value]) => {
      if (!isPositive(value)) {
        addFieldIssue(fieldIssues, key, 'error', 'positiveRequired')
      }
    })

    ;[
      ['homeLoss', charging.homeLossPercent],
      ['publicLoss', charging.publicAcLossPercent],
      ['fastLoss', charging.fastChargeLossPercent],
    ].forEach(([key, value]) => {
      if (!isNil(value) && (!isNonNegative(value) || value > 50)) {
        addFieldIssue(fieldIssues, key, 'error', 'lossRange')
      }
    })

    ;[
      ['wallboxPurchaseCost', assumptions.ev.wallboxPurchaseCost],
      ['wallboxInstallationCost', assumptions.ev.wallboxInstallationCost],
    ].forEach(([key, value]) => {
      if (!isNil(value) && !isNonNegative(value)) {
        addFieldIssue(fieldIssues, key, 'error', 'nonNegativeRequired')
      }
    })
  } else {
    if (!isPositive(assumptions.ice.fuelConsumptionLPer100km)) {
      addFieldIssue(fieldIssues, 'verbrauchL', 'error', 'positiveRequired')
    }

    if (!isPositive(assumptions.ice.fuelPricePerLiter)) {
      addFieldIssue(fieldIssues, 'kraftstoffPreis', 'error', 'positiveRequired')
    }
  }

  const hasBlockingErrors = Object.values(fieldIssues).some((issue) => issue.tone === 'error')

  return {
    hasBlockingErrors,
    fieldIssues,
    notices,
  }
}
