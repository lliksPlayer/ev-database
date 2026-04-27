import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch
} from 'firebase/firestore'
import { db } from './config'
import { prepareVehicleForStorage } from '../entities/vehicle/vehicleSchema.js'

const carsRef = () => collection(db, 'ev_cars')

export const subscribeToCars = (callback) =>
  onSnapshot(query(carsRef(), orderBy('marke')), (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

export const addCar = (data) => addDoc(carsRef(), prepareVehicleForStorage(data, 'ev'))

export const updateCar = (id, data) =>
  updateDoc(doc(carsRef(), id), prepareVehicleForStorage(data, 'ev', { includeNulls: true }))

export const deleteCar = (id) => deleteDoc(doc(carsRef(), id))

export const importCars = async (cars) => {
  const batch = writeBatch(db)
  cars.forEach((car) => batch.set(doc(carsRef()), prepareVehicleForStorage(car, 'ev')))
  return batch.commit()
}
