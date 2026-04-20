const DEFAULT_EV_VERBRAUCH = 20   // kWh/100km
const DEFAULT_ICE_VERBRAUCH = 7   // L/100km

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

export function calculateTCO(vehicle, params, years) {
  const kaufpreis = Number(vehicle.basis_preis || vehicle.kaufpreis || 0)
  const foerderung = Number(params.foerderung || 0)
  const zinsSatz = Number(params.zinsSatz || 0)
  const effectiveKaufpreis = kaufpreis - foerderung
  const finanzierungskosten = effectiveKaufpreis * (zinsSatz / 100) * years

  let energiekosten = 0
  if (vehicle.vehicleType === 'ev') {
    const verbrauch = Number(vehicle.verbrauch_kwh_100km || DEFAULT_EV_VERBRAUCH)
    energiekosten = calcEvEnergiekosten(verbrauch, params, years, params.jahresKm)
  } else {
    const verbrauch = Number(vehicle.verbrauch_l_100km || DEFAULT_ICE_VERBRAUCH)
    energiekosten = (params.jahresKm / 100) * verbrauch * params.kraftstoffPreis * years
  }

  const wartungsTotal = Number(params.wartung || 0) * years
  const versicherungTotal = Number(params.versicherung || 0) * years
  const steuerTotal = Number(params.steuer || 0) * years
  const restwert = kaufpreis * (Number(params.restwertProzent || 0) / 100)
  const thgTotal = vehicle.vehicleType === 'ev' ? Number(params.thgQuote || 0) * years : 0

  const gesamt =
    effectiveKaufpreis +
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
    restwert: -restwert,
    thg: -thgTotal,   // negativ = Einnahmen
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
