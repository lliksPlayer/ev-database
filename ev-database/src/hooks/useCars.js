import { useState, useEffect } from 'react'
import { subscribeToCars } from '../firebase/cars'

export function useCars() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToCars((data) => {
      setCars(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { cars, loading }
}
