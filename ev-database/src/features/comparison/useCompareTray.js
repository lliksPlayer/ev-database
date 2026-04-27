import { useSyncExternalStore } from 'react'
import {
  buildCalculatorUrlFromTray,
  clearCompareTray,
  getCompareTrayStatus,
  isVehicleSelectedInTray,
  readCompareTray,
  subscribeCompareTray,
  toggleVehicleInCompareTray,
} from './compareTrayStore.js'

export function useCompareTray() {
  const tray = useSyncExternalStore(subscribeCompareTray, readCompareTray, readCompareTray)
  const status = getCompareTrayStatus(tray)

  return {
    tray,
    status,
    calculatorUrl: buildCalculatorUrlFromTray(tray),
    isSelected: (vehicleId) => isVehicleSelectedInTray(tray, vehicleId),
    toggleVehicle: (vehicle) => toggleVehicleInCompareTray(vehicle),
    clearTray: () => clearCompareTray(),
  }
}
