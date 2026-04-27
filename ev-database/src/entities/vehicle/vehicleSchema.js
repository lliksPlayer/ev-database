import { VEHICLE_FIELD_ALIASES, getCanonicalFieldDefinitions } from './vehicleFields.js'

function hasValue(value) {
  return value !== undefined && value !== null && value !== ''
}

const NUMERIC_FIELD_KEYS = new Set(
  getCanonicalFieldDefinitions()
    .filter((field) => field.type === 'number')
    .map((field) => field.key)
)

function pickFirstValue(vehicle, keys) {
  for (const key of keys) {
    if (hasValue(vehicle[key])) {
      return vehicle[key]
    }
  }
  return undefined
}

function deriveVehicleType(vehicle, fallbackType) {
  if (hasValue(vehicle.vehicleType)) return vehicle.vehicleType
  if (fallbackType) return fallbackType
  if (hasValue(vehicle.kraftstoff) || hasValue(vehicle.verbrauch_l_100km) || hasValue(vehicle.verbrauch_l100km)) {
    return 'ice'
  }
  return 'ev'
}

function derivePs(vehicle) {
  if (hasValue(vehicle.ps)) return Number(vehicle.ps)
  if (!hasValue(vehicle.leistung_kw)) return undefined
  return Math.round(Number(vehicle.leistung_kw) * 1.35962)
}

function normalizeFieldValue(key, value) {
  if (!hasValue(value)) return value

  if (!NUMERIC_FIELD_KEYS.has(key)) {
    return typeof value === 'string' ? value.trim() : value
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  const normalized = Number(String(value).replace(',', '.'))
  return Number.isFinite(normalized) ? normalized : undefined
}

export function normalizeVehicle(vehicle, fallbackType) {
  if (!vehicle) return null

  const normalized = { ...vehicle }
  normalized.vehicleType = deriveVehicleType(normalized, fallbackType)

  for (const [canonicalKey, aliases] of Object.entries(VEHICLE_FIELD_ALIASES)) {
    const value = pickFirstValue(normalized, aliases)
    if (hasValue(value)) {
      normalized[canonicalKey] = normalizeFieldValue(canonicalKey, value)
    }
  }

  if (!hasValue(normalized.ps)) {
    const derivedPs = derivePs(normalized)
    if (hasValue(derivedPs)) normalized.ps = derivedPs
  }

  for (const key of NUMERIC_FIELD_KEYS) {
    if (hasValue(normalized[key])) {
      normalized[key] = normalizeFieldValue(key, normalized[key])
    }
  }

  return normalized
}

export function normalizeVehicles(vehicles, fallbackType) {
  return vehicles.map((vehicle) => normalizeVehicle(vehicle, fallbackType))
}

export function prepareVehicleForStorage(vehicle, fallbackType, { includeNulls = false } = {}) {
  const normalized = normalizeVehicle(vehicle, fallbackType)
  if (!normalized) return null

  const payload = { vehicleType: normalized.vehicleType }

  for (const field of getCanonicalFieldDefinitions(normalized.vehicleType)) {
    const value = normalizeFieldValue(field.key, normalized[field.key])

    if (hasValue(value)) {
      payload[field.key] = value
    } else if (includeNulls) {
      payload[field.key] = null
    }
  }

  return payload
}

export function getCollectionVehicleType(collectionName) {
  return collectionName === 'ice_cars' ? 'ice' : 'ev'
}
