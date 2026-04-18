import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useCarsCollection(collectionName) {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, collectionName), orderBy('marke')),
      (snap) => {
        setCars(snap.docs.map(d => ({ id: d.id, ...d.data() })))
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
