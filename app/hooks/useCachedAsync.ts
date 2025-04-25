import { useEffect, useState } from 'react'
import { cache } from '../utils/cache'

export function useCachedAsync<T>(
  cacheKey: string,
  asyncFn: (() => Promise<T>) | null,
  ttl: number
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!asyncFn) return
    let cancelled = false

    const run = async () => {
      const cached = cache.get<T>(cacheKey, ttl)
      if (cached) {
        setData(cached)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await asyncFn()
        cache.set(cacheKey, result)
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        console.error(`Error in cached async [${cacheKey}]:`, err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [cacheKey, asyncFn, ttl])

  return { data, loading, error }
}
