import { useEffect, useState } from 'react'
import { cache } from '../utils/cache'

export function useCachedFetch<T>(
  cacheKey: string,
  url: string | null,
  ttl: number,
  options?: RequestInit
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    const fetchData = async () => {
      const cached = cache.get<T>(cacheKey, ttl)
      if (cached) {
        setData(cached)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(url, options)
        const json = await response.json()
        if (!response.ok) {
          throw new Error(json.error || 'Failed to fetch')
        }
        cache.set(cacheKey, json)
        if (!cancelled) {
          setData(json)
        }
      } catch (err) {
        console.error(`Error fetching ${url}:`, err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [cacheKey, url, ttl, options])

  return { data, loading, error }
}
