import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch
} from 'firebase/firestore'
import { db } from './config'

const carsRef = () => collection(db, 'ice_cars')

export const subscribeToIceCars = (callback) =>
  onSnapshot(query(carsRef(), orderBy('marke')), (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

export const addIceCar = (data) => addDoc(carsRef(), data)
export const updateIceCar = (id, data) => updateDoc(doc(carsRef(), id), data)
export const deleteIceCar = (id) => deleteDoc(doc(carsRef(), id))

export const importIceCars = async (cars) => {
  const batch = writeBatch(db)
  cars.forEach(car => batch.set(doc(carsRef()), car))
  return batch.commit()
}
