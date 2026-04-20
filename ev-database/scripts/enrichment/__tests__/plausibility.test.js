import { describe, it, expect } from 'vitest'
import { isEmpty, mergeEnrichment } from '../plausibility.js'

describe('isEmpty', () => {
  it('returns true for null', () => expect(isEmpty(null)).toBe(true))
  it('returns true for undefined', () => expect(isEmpty(undefined)).toBe(true))
  it('returns true for 0', () => expect(isEmpty(0)).toBe(true))
  it('returns true for empty string', () => expect(isEmpty('')).toBe(true))
  it('returns true for whitespace string', () => expect(isEmpty('  ')).toBe(true))
  it('returns false for 100', () => expect(isEmpty(100)).toBe(false))
  it('returns false for non-empty string', () => expect(isEmpty('Yes')).toBe(false))
  it('returns false for negative number', () => expect(isEmpty(-1)).toBe(false))
})

describe('mergeEnrichment', () => {
  it('fills 0-value field and marks action as corrected', () => {
    const car = { id: '1', reichweite_wltp: 0, modell: 'Model 3' }
    const updates = mergeEnrichment(car, { reichweite_wltp: 487 }, 'ev-database.org', 'high')
    expect(updates.reichweite_wltp).toBe(487)
    expect(updates._enriched.reichweite_wltp.source).toBe('ev-database.org')
    expect(updates._enriched.reichweite_wltp.confidence).toBe('high')
    expect(updates._enriched.reichweite_wltp.action).toBe('corrected')
    expect(updates._enriched.reichweite_wltp.at).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('uses action "filled" for null field', () => {
    const car = { id: '1', reichweite_wltp: null }
    const updates = mergeEnrichment(car, { reichweite_wltp: 300 }, 'claude', 'low')
    expect(updates._enriched.reichweite_wltp.action).toBe('filled')
  })

  it('does not overwrite existing non-empty values', () => {
    const car = { id: '1', reichweite_wltp: 400 }
    const updates = mergeEnrichment(car, { reichweite_wltp: 500 }, 'ev-database.org', 'high')
    expect(updates.reichweite_wltp).toBeUndefined()
  })

  it('returns empty object when nothing to update', () => {
    const car = { id: '1', reichweite_wltp: 400 }
    const updates = mergeEnrichment(car, { reichweite_wltp: 500 }, 'ev-database.org', 'high')
    expect(Object.keys(updates)).toHaveLength(0)
  })

  it('preserves existing _enriched meta when adding new field', () => {
    const car = {
      id: '1',
      reichweite_wltp: 400,
      leistung_kw: 0,
      _enriched: { reichweite_wltp: { source: 'ev-database.org', confidence: 'high', action: 'filled', at: '2026-01-01' } }
    }
    const updates = mergeEnrichment(car, { leistung_kw: 180 }, 'claude', 'low')
    expect(updates._enriched.reichweite_wltp).toBeDefined()
    expect(updates._enriched.leistung_kw.source).toBe('claude')
  })

  it('skips fields starting with underscore', () => {
    const car = { id: '1', _enriched: {} }
    const updates = mergeEnrichment(car, { _internal: 'x' }, 'ev-database.org', 'high')
    expect(updates._internal).toBeUndefined()
  })
})
