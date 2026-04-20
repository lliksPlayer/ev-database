export function isEmpty(val) {
  if (val === null || val === undefined) return true
  if (typeof val === 'number') return val === 0
  if (typeof val === 'string') return val.trim() === ''
  return false
}

export function mergeEnrichment(car, newData, source, confidence) {
  const updates = {}
  const enrichedMeta = { ...(car._enriched || {}) }
  const today = new Date().toISOString().split('T')[0]

  for (const [key, value] of Object.entries(newData)) {
    if (key.startsWith('_')) continue
    if (!isEmpty(car[key])) continue
    if (isEmpty(value)) continue

    updates[key] = value
    enrichedMeta[key] = {
      source,
      confidence,
      action: car[key] === 0 ? 'corrected' : 'filled',
      at: today,
    }
  }

  if (Object.keys(updates).length > 0) {
    updates._enriched = enrichedMeta
  }

  return updates
}
