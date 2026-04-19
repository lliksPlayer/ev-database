const DEFAULT_EV_VERBRAUCH = 20   // kWh/100km
const DEFAULT_ICE_VERBRAUCH = 7   // L/100km

export function calculateTCO(vehicle, params, years) {
  const kaufpreis = Number(vehicle.basis_preis || vehicle.kaufpreis || 0)
  const foerderung = Number(params.foerderung || 0)
  const zinsSatz = Number(params.zinsSatz || 0)
  const effectiveKaufpreis = kaufpreis - foerderung
  const finanzierungskosten = effectiveKaufpreis * (zinsSatz / 100) * years

  let energiekosten = 0
  if (vehicle.vehicleType === 'ev') {
    const verbrauch = Number(vehicle.verbrauch_kwh_100km || DEFAULT_EV_VERBRAUCH)
    energiekosten = (params.jahresKm / 100) * verbrauch * params.stromPreis * years
  } else {
    const verbrauch = Number(vehicle.verbrauch_l_100km || DEFAULT_ICE_VERBRAUCH)
    energiekosten = (params.jahresKm / 100) * verbrauch * params.kraftstoffPreis * years
  }

  const wartungsTotal = Number(params.wartung || 0) * years
  const versicherungTotal = Number(params.versicherung || 0) * years
  const steuerTotal = Number(params.steuer || 0) * years
  const restwert = kaufpreis * (Number(params.restwertProzent || 0) / 100)
  const gesamt = effectiveKaufpreis + energiekosten + wartungsTotal +
    versicherungTotal + steuerTotal + finanzierungskosten - restwert

  return {
    kaufpreis: effectiveKaufpreis,
    energie: energiekosten,
    wartung: wartungsTotal,
    versicherung: versicherungTotal,
    steuer: steuerTotal,
    finanzierung: finanzierungskosten,
    restwert: -restwert,
    gesamt,
    monatlich: gesamt / (years * 12),
  }
}

export function buildYearlySeries(vehicle, params, maxYears) {
  return Array.from({ length: maxYears }, (_, i) => ({
    year: i + 1,
    gesamt: calculateTCO(vehicle, params, i + 1).gesamt,
  }))
}

export function findBreakeven(vehicleA, paramsA, vehicleB, paramsB, maxYears = 15) {
  for (let y = 1; y <= maxYears; y++) {
    if (calculateTCO(vehicleA, paramsA, y).gesamt <= calculateTCO(vehicleB, paramsB, y).gesamt) {
      return y
    }
  }
  return null
}

export const DEFAULT_PARAMS_NORMAL = {
  jahresKm: 15000,
  stromPreis: 0.30,
  kraftstoffPreis: 1.75,
  jahre: 8,
}

export const DEFAULT_PARAMS_EXPERT = {
  ...DEFAULT_PARAMS_NORMAL,
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
