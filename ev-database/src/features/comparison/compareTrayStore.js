const STORAGE_KEY = 'compare-tray-v1'
const CHANGE_EVENT = 'compare-tray-change'
const EMPTY_TRAY = Object.freeze({
  primaryEv: null,
  secondary: null,
})

let cachedRaw = null
let cachedTray = EMPTY_TRAY

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createEmptyTray() {
  return { ...EMPTY_TRAY }
}

function sanitizeEntry(vehicle) {
  if (!vehicle?.id) return null

  return {
    id: vehicle.id,
    marke: vehicle.marke ?? '',
    modell: vehicle.modell ?? '',
    vehicleType: vehicle.vehicleType === 'ice' ? 'ice' : 'ev',
    basis_preis: vehicle.basis_preis ?? null,
    markteinfuehrung: vehicle.markteinfuehrung ?? null,
  }
}

function normalizeTray(rawValue) {
  const base = createEmptyTray()
  if (!rawValue || typeof rawValue !== 'object') return base

  return {
    primaryEv: sanitizeEntry(rawValue.primaryEv),
    secondary: sanitizeEntry(rawValue.secondary),
  }
}

export function readCompareTray() {
  if (!canUseStorage()) return cachedTray

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw) {
      return cachedTray
    }

    cachedRaw = raw
    cachedTray = raw ? normalizeTray(JSON.parse(raw)) : createEmptyTray()
    return cachedTray
  } catch {
    cachedRaw = null
    cachedTray = createEmptyTray()
    return cachedTray
  }
}

function emitTrayChange() {
  if (!canUseStorage()) return
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeCompareTray(listener) {
  if (!canUseStorage()) return () => {}

  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      listener()
    }
  }

  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener('storage', handleStorage)
  }
}

export function writeCompareTray(nextTray) {
  if (!canUseStorage()) return

  const normalizedTray = normalizeTray(nextTray)
  const serializedTray = JSON.stringify(normalizedTray)

  cachedRaw = serializedTray
  cachedTray = normalizedTray

  window.localStorage.setItem(STORAGE_KEY, serializedTray)
  emitTrayChange()
}

export function clearCompareTray() {
  writeCompareTray(createEmptyTray())
}

export function isVehicleSelectedInTray(tray, vehicleId) {
  if (!vehicleId) return false
  return tray.primaryEv?.id === vehicleId || tray.secondary?.id === vehicleId
}

export function toggleVehicleInCompareTray(vehicle) {
  const tray = readCompareTray()
  const entry = sanitizeEntry(vehicle)
  if (!entry) return tray

  if (tray.primaryEv?.id === entry.id) {
    writeCompareTray({
      primaryEv: tray.secondary?.vehicleType === 'ev' ? tray.secondary : null,
      secondary: tray.secondary?.vehicleType === 'ev' ? null : tray.secondary,
    })
    return readCompareTray()
  }

  if (tray.secondary?.id === entry.id) {
    writeCompareTray({
      ...tray,
      secondary: null,
    })
    return readCompareTray()
  }

  if (entry.vehicleType === 'ev') {
    if (!tray.primaryEv) {
      writeCompareTray({
        ...tray,
        primaryEv: entry,
      })
      return readCompareTray()
    }

    writeCompareTray({
      ...tray,
      secondary: entry,
    })
    return readCompareTray()
  }

  writeCompareTray({
    ...tray,
    secondary: entry,
  })
  return readCompareTray()
}

export function buildCalculatorUrlFromTray(tray) {
  const current = normalizeTray(tray)
  const params = new URLSearchParams()

  if (current.primaryEv) {
    params.set('ev1', current.primaryEv.id)
  }

  if (current.secondary?.vehicleType === 'ev') {
    params.set('mode', 'ev-ev')
    params.set('ev2', current.secondary.id)
  } else {
    params.set('mode', 'ev-ice')
    if (current.secondary?.vehicleType === 'ice') {
      params.set('ice1', current.secondary.id)
    }
  }

  const query = params.toString()
  return query ? `/rechner?${query}` : '/rechner'
}

export function getCompareTrayStatus(tray) {
  const current = normalizeTray(tray)

  if (current.primaryEv && current.secondary) return 'ready'
  if (current.primaryEv) return 'need-opponent'
  if (current.secondary?.vehicleType === 'ice') return 'need-ev'
  return 'empty'
}
