import { useCallback, useEffect, useState } from 'react'

// Runs `loader` and exposes { data, loading, error, reload }.
// Pass enabled=false to defer loading (e.g. until an accordion opens).
export function useAsync(loader, deps = [], enabled = true) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    loader()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}
