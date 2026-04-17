import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './config'

const settingsDoc = () => doc(db, 'settings', 'card_fields')

export const subscribeToSettings = (callback) =>
  onSnapshot(settingsDoc(), (snap) =>
    callback(snap.exists() ? snap.data().fields : [])
  )

export const saveSettings = (fields) =>
  setDoc(settingsDoc(), { fields })
