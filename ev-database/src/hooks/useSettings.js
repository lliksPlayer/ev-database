import { useState, useEffect } from 'react'
import { subscribeToSettings } from '../firebase/settings'
import { normalizeCardFields } from '../entities/vehicle/fields.js'

export function useSettings() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToSettings((data) => {
      setFields(normalizeCardFields(data, 'ev'))
      setLoading(false)
    })
    return unsub
  }, [])

  return { fields, loading }
}
