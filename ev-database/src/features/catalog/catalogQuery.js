import { getCanonicalFieldDefinitions } from '../../entities/vehicle/fields.js'

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function getCatalogSortOptions(vehicleType, language = 'de') {
  const definitions = getCanonicalFieldDefinitions(vehicleType)
    .filter((field) => field.key !== 'bild_url')

  return [
    { value: 'default', label: language === 'de' ? 'Standard' : 'Default', type: 'default' },
    ...definitions.map((field) => ({
      value: field.key,
      label: field.labels?.[language] ?? field.key,
      type: field.type,
    })),
  ]
}

export function filterCarsByQuery(cars, query) {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return cars

  return cars.filter((car) => {
    const haystack = [
      car.marke,
      car.modell,
      car.segment,
      car.karosserie,
      car.kraftstoff,
      car.plattform,
    ]
      .map(normalizeText)
      .join(' ')

    return haystack.includes(normalizedQuery)
  })
}

function compareValues(a, b, direction, type) {
  const multiplier = direction === 'desc' ? -1 : 1

  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1

  if (type === 'number') {
    return (Number(a) - Number(b)) * multiplier
  }

  return String(a).localeCompare(String(b), 'de', { sensitivity: 'base' }) * multiplier
}

export function sortCars(cars, sortKey, direction, vehicleType) {
  if (!sortKey || sortKey === 'default') return cars

  const definition = getCanonicalFieldDefinitions(vehicleType).find((field) => field.key === sortKey)
  const type = definition?.type === 'number' ? 'number' : 'text'

  return [...cars].sort((left, right) =>
    compareValues(left[sortKey], right[sortKey], direction, type)
  )
}
