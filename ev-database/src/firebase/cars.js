import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch
} from 'firebase/firestore'
import { db } from './config'

const carsRef = () => collection(db, 'ev_cars')

export const subscribeToCars = (callback) =>
  onSnapshot(query(carsRef(), orderBy('marke')), (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

export const addCar = (data) => addDoc(carsRef(), data)

export const updateCar = (id, data) => updateDoc(doc(db, 'ev_cars', id), data)

export const deleteCar = (id) => deleteDoc(doc(db, 'ev_cars', id))

export const importCars = async (cars) => {
  const batch = writeBatch(db)
  cars.forEach(car => batch.set(doc(carsRef()), car))
  return batch.commit()
}
