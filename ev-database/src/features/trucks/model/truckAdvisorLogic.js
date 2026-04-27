import { TRUCK_ADVISOR_MODELS } from './truckAdvisorModels.js'

const USE_CASE_ADJACENCY = Object.freeze({
  urban: ['regional'],
  regional: ['urban', 'longhaul'],
  longhaul: ['regional'],
})

function getRequiredRangeKm(state) {
  return Math.round(state.dailyKm * (1 + state.rangeBuffer / 100))
}

function getTone(score) {
  if (score >= 9) return 'excellent'
  if (score >= 6) return 'good'
  if (score >= 3) return 'limited'
  return 'poor'
}

export function evaluateTruckAdvisorMatches(state) {
  const requiredRangeKm = getRequiredRangeKm(state)
  const matches = []
  const excluded = []

  TRUCK_ADVISOR_MODELS.forEach((model) => {
    let score = 0
    const strengths = []
    const watchouts = []
    const exclusionReasons = []

    if (!state.depotCharging && !state.publicFastCharge) {
      exclusionReasons.push('noChargingBase')
    }

    if (state.vehicleFormat !== 'any') {
      if (model.vehicleFormats.includes(state.vehicleFormat)) {
        score += 1
        strengths.push('vehicleFormatFit')
      } else {
        exclusionReasons.push('vehicleFormatMismatch')
      }
    }

    if (state.trailerUse === 'required') {
      if (model.trailerCapable) {
        score += 1
        strengths.push('trailerReady')
      } else {
        exclusionReasons.push('trailerMissing')
      }
    } else if (state.trailerUse === 'optional') {
      if (model.trailerCapable) {
        score += 1
        strengths.push('trailerReady')
      } else {
        watchouts.push('trailerOptionalMissing')
      }
    }

    if (state.chargingStandard === 'mcs') {
      if (model.chargingStandard === 'mcs') {
        score += 1
        strengths.push('mcsReady')
      } else {
        watchouts.push('mcsMissing')
      }
    }

    if (model.useCases.includes(state.useCase)) {
      score += 3
      strengths.push('directUseCase')
    } else if (USE_CASE_ADJACENCY[state.useCase]?.includes(model.useCases[0]) || USE_CASE_ADJACENCY[state.useCase]?.some((item) => model.useCases.includes(item))) {
      score += 1
      strengths.push('adjacentUseCase')
    } else {
      score -= 2
      watchouts.push('useCaseTension')
    }

    if (requiredRangeKm > model.maxRangeKm * 1.12) {
      exclusionReasons.push('rangeExceeded')
    } else if (requiredRangeKm > model.maxRangeKm) {
      score -= 1
      watchouts.push('rangeTight')
    } else if (requiredRangeKm <= model.maxRangeKm * 0.78) {
      score += 2
      strengths.push('rangeStrong')
    } else {
      score += 1
      strengths.push('rangeOkay')
    }

    if (state.payloadNeed > model.maxPayloadT * 1.05) {
      exclusionReasons.push('payloadExceeded')
    } else if (state.payloadNeed > model.maxPayloadT) {
      score -= 1
      watchouts.push('payloadTight')
    } else if (state.payloadNeed <= model.maxPayloadT * 0.8) {
      score += 2
      strengths.push('payloadStrong')
    } else {
      score += 1
      strengths.push('payloadOkay')
    }

    if (model.routeFit.includes(state.routePredictability)) {
      score += 1
      strengths.push('routeFit')
    } else {
      score -= 1
      watchouts.push('routeChallenge')
    }

    if (state.returnToDepot && model.returnToDepotFriendly) {
      score += 1
      strengths.push('returnDepot')
    } else if (!state.returnToDepot && !model.returnToDepotFriendly) {
      score += 1
      strengths.push('openOperation')
    }

    if (model.chargeWindows.includes(state.chargeWindow)) {
      score += 1
      strengths.push('chargeWindowFit')
    } else if (state.chargeWindow === 'tight' && !model.publicFastChargeCapable) {
      exclusionReasons.push('chargeWindowTooTight')
    } else {
      score -= 1
      watchouts.push('chargeWindowWeak')
    }

    if (state.depotCharging && model.requiresDepotCharging) {
      score += 1
      strengths.push('depotReady')
    }

    if (state.publicFastCharge && model.publicFastChargeCapable) {
      score += 1
      strengths.push('fastChargeReady')
    }

    if (state.gridStatus === 'secured' && state.depotCharging) {
      score += 1
      strengths.push('gridSecured')
    } else if (state.gridStatus === 'none' && state.depotCharging) {
      score -= 1
      watchouts.push('gridMissing')
    }

    if (exclusionReasons.length > 0) {
      excluded.push({
        ...model,
        exclusionReasons,
      })
      return
    }

    matches.push({
      ...model,
      requiredRangeKm,
      score,
      tone: getTone(score),
      strengths: strengths.slice(0, 2),
      watchouts: watchouts.slice(0, 2),
    })
  })

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.maxRangeKm !== a.maxRangeKm) return b.maxRangeKm - a.maxRangeKm
    return b.maxPayloadT - a.maxPayloadT
  })

  return {
    requiredRangeKm,
    matches,
    excluded,
    excludedCount: excluded.length,
  }
}
