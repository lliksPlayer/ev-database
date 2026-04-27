function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function resolveVehicleType(vehicle, assumptions) {
  if (vehicle?.vehicleType) return vehicle.vehicleType
  return assumptions?.ev ? 'ev' : 'ice'
}

function normalizeAnnualKm(value) {
  if (!Number.isFinite(value)) return 15000
  return clamp(Math.round(value / 500) * 500, 5000, 50000)
}

export function createScenarioDefaults(assumptionsA, assumptionsB) {
  const annualKmValues = [
    Number(assumptionsA?.profile?.annualKm),
    Number(assumptionsB?.profile?.annualKm),
  ].filter((value) => Number.isFinite(value) && value > 0)

  const averageAnnualKm = annualKmValues.length
    ? annualKmValues.reduce((sum, value) => sum + value, 0) / annualKmValues.length
    : 15000

  return {
    annualKm: normalizeAnnualKm(averageAnnualKm),
    electricityDeltaPercent: 0,
    fuelDeltaPercent: 0,
  }
}

export function applyScenarioToAssumptions(vehicle, assumptions, scenario) {
  const next = clone(assumptions)
  const vehicleType = resolveVehicleType(vehicle, assumptions)
  const annualKm = Number(scenario?.annualKm)

  if (Number.isFinite(annualKm) && annualKm > 0) {
    next.profile.annualKm = annualKm
  }

  if (vehicleType === 'ev') {
    const factor = 1 + (Number(scenario?.electricityDeltaPercent ?? 0) / 100)
    next.ev.charging.homePricePerKwh = Number(next.ev.charging.homePricePerKwh ?? 0) * factor
    next.ev.charging.publicAcPricePerKwh = Number(next.ev.charging.publicAcPricePerKwh ?? 0) * factor
    next.ev.charging.fastChargePricePerKwh = Number(next.ev.charging.fastChargePricePerKwh ?? 0) * factor
    return next
  }

  const fuelFactor = 1 + (Number(scenario?.fuelDeltaPercent ?? 0) / 100)
  next.ice.fuelPricePerLiter = Number(next.ice.fuelPricePerLiter ?? 0) * fuelFactor
  return next
}

export function hasEvInScenario(vehicleA, assumptionsA, vehicleB, assumptionsB) {
  return [resolveVehicleType(vehicleA, assumptionsA), resolveVehicleType(vehicleB, assumptionsB)].includes('ev')
}

export function hasIceInScenario(vehicleA, assumptionsA, vehicleB, assumptionsB) {
  return [resolveVehicleType(vehicleA, assumptionsA), resolveVehicleType(vehicleB, assumptionsB)].includes('ice')
}
