import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch
} from 'firebase/firestore'
import { db } from './config'
import { prepareVehicleForStorage } from '../entities/vehicle/vehicleSchema.js'

const carsRef = () => collection(db, 'ice_cars')

export const subscribeToIceCars = (callback) =>
  onSnapshot(query(carsRef(), orderBy('marke')), (snap) =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  )

export const addIceCar = (data) => addDoc(carsRef(), prepareVehicleForStorage(data, 'ice'))
export const updateIceCar = (id, data) =>
  updateDoc(doc(carsRef(), id), prepareVehicleForStorage(data, 'ice', { includeNulls: true }))
export const deleteIceCar = (id) => deleteDoc(doc(carsRef(), id))

export const importIceCars = async (cars) => {
  const batch = writeBatch(db)
  cars.forEach((car) => batch.set(doc(carsRef()), prepareVehicleForStorage(car, 'ice')))
  return batch.commit()
}
