const DEFAULT_EV_VERBRAUCH = 20   // kWh/100km
const DEFAULT_ICE_VERBRAUCH = 7   // L/100km
const DEFAULT_FUEL_PRICE = 1.75   // EUR/L
const DEFAULT_DRIVING_PROFILE = [0.35, 0.4, 0.25]
const DRIVING_PROFILE_PRESETS = Object.freeze({
  normal: DEFAULT_DRIVING_PROFILE,
  city: [0.7, 0.2, 0.1],
  rural: [0.2, 0.65, 0.15],
  highway: [0.1, 0.15, 0.75],
})

const DRIVING_PROFILE_MULTIPLIERS = {
  ev: {
    city: 0.88,
    rural: 1,
    highway: 1.18,
  },
  ice: {
    city: 1.22,
    rural: 0.94,
    highway: 1.08,
  },
}

// Berechnet effektive Ladekosten für ein EV unter Berücksichtigung von
// AC/DC-Split, Ladeverlust und separaten Preisen pro kWh.
function calcEvEnergiekosten(verbrauch, params, years, jahresKm) {
  const acProzent = Number(params.acProzent ?? 80)
  const dcProzent = 100 - acProzent
  const acLadeverlust = Number(params.acLadeverlust ?? 15)  // % Verlust
  const dcLadeverlust = Number(params.dcLadeverlust ?? 8)   // % Verlust
  const acPreis = Number(params.acPreis ?? 0.28)
  const dcPreis = Number(params.dcPreis ?? 0.55)

  // Für 1 kWh im Akku werden 1/Effizienz kWh aus dem Netz gezogen
  const acEffizienz = 1 - acLadeverlust / 100
  const dcEffizienz = 1 - dcLadeverlust / 100

  const acKwhNetz = verbrauch * (acProzent / 100) / acEffizienz
  const dcKwhNetz = verbrauch * (dcProzent / 100) / dcEffizienz

  return (jahresKm / 100) * (acKwhNetz * acPreis + dcKwhNetz * dcPreis) * years
}

function calcStructuredEvEnergiekosten(consumption, charging, years, annualKm) {
  const shares = [
    Number(charging.homeChargeShare ?? 0),
    Number(charging.publicAcChargeShare ?? 0),
    Number(charging.fastChargeShare ?? 0),
  ]
  const totalShare = shares.reduce((sum, value) => sum + value, 0)
  const normalizedShares = totalShare > 0
    ? shares.map((value) => value / totalShare)
    : [0.8, 0, 0.2]

  const channels = [
    {
      share: normalizedShares[0],
      lossPercent: Number(charging.homeLossPercent ?? 15),
      pricePerKwh: Number(charging.homePricePerKwh ?? 0.28),
    },
    {
      share: normalizedShares[1],
      lossPercent: Number(charging.publicAcLossPercent ?? 15),
      pricePerKwh: Number(charging.publicAcPricePerKwh ?? 0.45),
    },
    {
      share: normalizedShares[2],
      lossPercent: Number(charging.fastChargeLossPercent ?? 8),
      pricePerKwh: Number(charging.fastChargePricePerKwh ?? 0.55),
    },
  ]

  const totalEnergyCostPer100km = channels.reduce((sum, channel) => {
    const efficiency = 1 - channel.lossPercent / 100
    const gridKwh = efficiency > 0 ? (consumption * channel.share) / efficiency : 0
    return sum + gridKwh * channel.pricePerKwh
  }, 0)

  return (annualKm / 100) * totalEnergyCostPer100km * years
}

export function normalizeDrivingProfile(profile = {}) {
  const selectedMode = typeof profile.profileMode === 'string' ? profile.profileMode : 'normal'
  const preset = DRIVING_PROFILE_PRESETS[selectedMode]
  if (preset) {
    return {
      city: preset[0],
      rural: preset[1],
      highway: preset[2],
      mode: selectedMode,
    }
  }

  const shares = [
    Number(profile.cityShare ?? 0),
    Number(profile.ruralShare ?? 0),
    Number(profile.highwayShare ?? 0),
  ]
  const total = shares.reduce((sum, value) => sum + value, 0)
  const normalizedShares = total > 0
    ? shares.map((value) => value / total)
    : DEFAULT_DRIVING_PROFILE

  return {
    city: normalizedShares[0],
    rural: normalizedShares[1],
    highway: normalizedShares[2],
    mode: selectedMode,
  }
}

function applyDrivingProfileToConsumption(vehicleType, baseConsumption, profile) {
  const multiplierSet = DRIVING_PROFILE_MULTIPLIERS[vehicleType]
  if (!multiplierSet) return baseConsumption
  if (profile?.profileMode === 'normal') return baseConsumption

  const normalizedProfile = normalizeDrivingProfile(profile)
  const weightedMultiplier =
    normalizedProfile.city * multiplierSet.city +
    normalizedProfile.rural * multiplierSet.rural +
    normalizedProfile.highway * multiplierSet.highway

  return baseConsumption * weightedMultiplier
}

export function getProfileAdjustedConsumption(vehicle, assumptions) {
  const vehicleType = vehicle?.vehicleType === 'ice' ? 'ice' : 'ev'
  const baseConsumption = Number(
    vehicleType === 'ev'
      ? (
          assumptions.ev?.consumptionKwhPer100km ??
          vehicle?.wltp_verbrauch ??
          vehicle?.verbrauch_kwh_100km ??
          DEFAULT_EV_VERBRAUCH
        )
      : (
          assumptions.ice?.fuelConsumptionLPer100km ??
          vehicle?.verbrauch_l_100km ??
          vehicle?.verbrauch_l100km ??
          DEFAULT_ICE_VERBRAUCH
        )
  )

  const adjustedConsumption = applyDrivingProfileToConsumption(
    vehicleType,
    baseConsumption,
    assumptions?.profile
  )

  return {
    vehicleType,
    unit: vehicleType === 'ev' ? 'kWh/100 km' : 'L/100 km',
    baseConsumption,
    adjustedConsumption,
    deltaPercent: baseConsumption > 0
      ? ((adjustedConsumption / baseConsumption) - 1) * 100
      : 0,
    profile: normalizeDrivingProfile(assumptions?.profile),
    mode: assumptions?.profile?.profileMode ?? 'normal',
  }
}

function isStructuredAssumptions(input) {
  return Boolean(input?.profile && input?.acquisition && input?.operating)
}

function buildStructuredAcquisition(assumptions, years, fallbackPurchasePrice) {
  const financingType = assumptions.acquisition.financingType ?? 'cash'
  const purchasePrice = Number(assumptions.acquisition.purchasePrice ?? fallbackPurchasePrice ?? 0)
  const grant = Number(assumptions.acquisition.grant ?? 0)
  const residualValuePercent = Number(assumptions.acquisition.residualValuePercent ?? 0)
  const interestRate = Number(assumptions.acquisition.interestRate ?? 0)
  const leaseMonthlyRate = Number(assumptions.acquisition.leaseMonthlyRate ?? 0)
  const leaseDownPayment = Number(assumptions.acquisition.leaseDownPayment ?? 0)

  if (financingType === 'lease') {
    return {
      acquisitionTotal: Math.max(leaseDownPayment - grant, 0) + (leaseMonthlyRate * years * 12),
      financingTotal: 0,
      residualValueTotal: 0,
      financingType,
    }
  }

  const acquisitionTotal = Math.max(purchasePrice - grant, 0)
  const financingTotal = financingType === 'loan'
    ? acquisitionTotal * (interestRate / 100) * years
    : 0

  return {
    acquisitionTotal,
    financingTotal,
    residualValueTotal: purchasePrice * (residualValuePercent / 100),
    financingType,
  }
}

function buildLegacyScenario(vehicle, params, yearsOverride) {
  const years = Number(yearsOverride ?? params?.jahre ?? 0)
  const kaufpreis = Number(vehicle?.basis_preis ?? vehicle?.kaufpreis ?? 0)
  const foerderung = Number(params?.foerderung ?? 0)
  const zinsSatz = Number(params?.zinsSatz ?? 0)
  const jahresKm = Number(params?.jahresKm ?? 0)

  let energiekosten = 0
  let thgTotal = 0
  let infrastruktur = 0

  if (vehicle?.vehicleType === 'ev') {
    const verbrauch = Number(vehicle?.wltp_verbrauch ?? vehicle?.verbrauch_kwh_100km ?? DEFAULT_EV_VERBRAUCH)
    energiekosten = calcEvEnergiekosten(verbrauch, params, years, jahresKm)
    thgTotal = Number(params?.thgQuote ?? 0) * years
  } else {
    const verbrauch = Number(vehicle?.verbrauch_l_100km ?? vehicle?.verbrauch_l100km ?? DEFAULT_ICE_VERBRAUCH)
    energiekosten = (jahresKm / 100) * verbrauch * Number(params?.kraftstoffPreis ?? 0) * years
  }

  return {
    years,
    kaufpreis,
    foerderung,
    zinsSatz,
    energiekosten,
    wartungsTotal: Number(params?.wartung ?? 0) * years,
    versicherungTotal: Number(params?.versicherung ?? 0) * years,
    steuerTotal: Number(params?.steuer ?? 0) * years,
    restwert: kaufpreis * (Number(params?.restwertProzent ?? 0) / 100),
    thgTotal,
    infrastruktur,
  }
}

function buildStructuredScenario(vehicle, assumptions, yearsOverride) {
  const years = Number(yearsOverride ?? assumptions.profile.years ?? 0)
  const annualKm = Number(assumptions.profile.annualKm ?? 0)
  const acquisition = buildStructuredAcquisition(assumptions, years, vehicle?.basis_preis)

  let energiekosten = 0
  let thgTotal = 0
  let infrastruktur = 0

  if (vehicle?.vehicleType === 'ev') {
    const baseConsumption = Number(
      assumptions.ev?.consumptionKwhPer100km ??
      vehicle?.wltp_verbrauch ??
      vehicle?.verbrauch_kwh_100km ??
      DEFAULT_EV_VERBRAUCH
    )
    const consumption = applyDrivingProfileToConsumption('ev', baseConsumption, assumptions.profile)
    energiekosten = calcStructuredEvEnergiekosten(
      consumption,
      assumptions.ev?.charging ?? {},
      years,
      annualKm
    )
    thgTotal = Number(assumptions.ev?.thgAnnual ?? 0) * years
    infrastruktur =
      Number(assumptions.ev?.wallboxPurchaseCost ?? 0) +
      Number(assumptions.ev?.wallboxInstallationCost ?? 0)
  } else {
    const baseConsumption = Number(
      assumptions.ice?.fuelConsumptionLPer100km ??
      vehicle?.verbrauch_l_100km ??
      vehicle?.verbrauch_l100km ??
      DEFAULT_ICE_VERBRAUCH
    )
    const consumption = applyDrivingProfileToConsumption('ice', baseConsumption, assumptions.profile)
    energiekosten =
      (annualKm / 100) *
      consumption *
      Number(assumptions.ice?.fuelPricePerLiter ?? DEFAULT_FUEL_PRICE) *
      years
  }

  return {
    years,
    acquisitionTotal: acquisition.acquisitionTotal,
    finanzierungskosten: acquisition.financingTotal,
    energiekosten,
    wartungsTotal: Number(assumptions.operating.maintenanceAnnual ?? 0) * years,
    versicherungTotal: Number(assumptions.operating.insuranceAnnual ?? 0) * years,
    steuerTotal: Number(assumptions.operating.taxAnnual ?? 0) * years,
    restwert: acquisition.residualValueTotal,
    thgTotal,
    infrastruktur,
  }
}

export function calculateTCO(vehicle, params, years) {
  const scenario = isStructuredAssumptions(params)
    ? buildStructuredScenario(vehicle, params, years)
    : buildLegacyScenario(vehicle, params, years)

  const {
    years: effectiveYears,
    kaufpreis,
    foerderung,
    zinsSatz,
    energiekosten,
    wartungsTotal,
    versicherungTotal,
    steuerTotal,
    restwert,
    thgTotal,
    infrastruktur,
  } = scenario

  const effectiveKaufpreis = scenario.acquisitionTotal ?? (kaufpreis - foerderung)
  const finanzierungskosten = scenario.finanzierungskosten ?? (
    effectiveKaufpreis * (zinsSatz / 100) * effectiveYears
  )

  const gesamt =
    effectiveKaufpreis +
    infrastruktur +
    energiekosten +
    wartungsTotal +
    versicherungTotal +
    steuerTotal +
    finanzierungskosten -
    restwert -
    thgTotal

  return {
    kaufpreis: effectiveKaufpreis,
    energie: energiekosten,
    wartung: wartungsTotal,
    versicherung: versicherungTotal,
    steuer: steuerTotal,
    finanzierung: finanzierungskosten,
    infrastruktur,
    restwert: -restwert,
    thg: -thgTotal,   // negativ = Einnahmen
    gesamt,
    monatlich: effectiveYears > 0 ? gesamt / (effectiveYears * 12) : 0,
  }
}

export function buildYearlySeries(vehicle, params, maxYears) {
  return Array.from({ length: maxYears }, (_, i) => ({
    year: i + 1,
    gesamt: calculateTCO(vehicle, params, i + 1).gesamt,
  }))
}

export function findBreakeven(vehicleA, paramsA, vehicleB, paramsB, maxYears = 15) {
  const initialTotalA = calculateTCO(vehicleA, paramsA, 1).gesamt
  const initialTotalB = calculateTCO(vehicleB, paramsB, 1).gesamt
  const initialWinner = initialTotalA <= initialTotalB ? 'a' : 'b'

  for (let y = 2; y <= maxYears; y++) {
    const totalA = calculateTCO(vehicleA, paramsA, y).gesamt
    const totalB = calculateTCO(vehicleB, paramsB, y).gesamt
    const currentWinner = totalA <= totalB ? 'a' : 'b'

    if (currentWinner !== initialWinner) {
      return {
        year: y,
        winner: currentWinner,
        previousWinner: initialWinner,
      }
    }
  }

  return null
}

export const DEFAULT_PARAMS_NORMAL = {
  jahresKm: 15000,
  // EV-Laden
  acPreis: 0.28,
  dcPreis: 0.55,
  acProzent: 80,
  thgQuote: 250,
  // ICE
  kraftstoffPreis: 1.75,
  jahre: 8,
}

export const DEFAULT_PARAMS_EXPERT = {
  ...DEFAULT_PARAMS_NORMAL,
  acLadeverlust: 15,
  dcLadeverlust: 8,
  wartung: 800,
  versicherung: 1200,
  steuer: 200,
  restwertProzent: 30,
  foerderung: 0,
  zinsSatz: 0,
}

export const ICE_TEMPLATES = {
  golf: {
    marke: 'VW', modell: 'Golf 2.0 TDI',
    vehicleType: 'ice',
    basis_preis: 32000,
    verbrauch_l_100km: 5.5,
  },
  bmw: {
    marke: 'BMW', modell: '320d',
    vehicleType: 'ice',
    basis_preis: 45000,
    verbrauch_l_100km: 5.2,
  },
  passat: {
    marke: 'VW', modell: 'Passat TDI',
    vehicleType: 'ice',
    basis_preis: 40000,
    verbrauch_l_100km: 5.8,
  },
}
