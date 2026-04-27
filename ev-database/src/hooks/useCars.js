import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getCollectionVehicleType, normalizeVehicle } from '../entities/vehicle/vehicleSchema.js'

export function useCarsCollection(collectionName) {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const vehicleType = getCollectionVehicleType(collectionName)
    const unsub = onSnapshot(
      query(collection(db, collectionName), orderBy('marke')),
      (snap) => {
        setCars(snap.docs.map((d) => normalizeVehicle({ id: d.id, ...d.data() }, vehicleType)))
        setLoading(false)
      }
    )
    return unsub
  }, [collectionName])

  return { cars, loading }
}

export function useCars() {
  return useCarsCollection('ev_cars')
}
