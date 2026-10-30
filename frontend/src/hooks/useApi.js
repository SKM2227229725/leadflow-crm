import { useCallback, useEffect, useState } from 'react'
import { parseApiError } from '../utils/errors'

/** Runs `fn` whenever `fn` identity changes (wrap it in useCallback). Exposes loading, error, reload. */
export function useApi(fn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await fn())
    } catch (e) {
      setError(parseApiError(e).message)
    } finally {
      setLoading(false)
    }
  }, [fn])

  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load, setData }
}
