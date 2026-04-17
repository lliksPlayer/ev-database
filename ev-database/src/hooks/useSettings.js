import { useState, useEffect } from 'react'
import { subscribeToSettings } from '../firebase/settings'

export function useSettings() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToSettings((data) => {
      setFields(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { fields, loading }
}
