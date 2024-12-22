import { useEffect, useState } from 'react'
import { cache } from '../utils/cache'

export interface AMAData {
  id: string
  title: string
  description: string
  authorFid: string
  createdAt: string
  tags: string[]
  // Add other AMA fields as needed
}

export function useAMAData(id?: string) {
  const [ama, setAMA] = useState<AMAData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAMA = async () => {
      if (!id) return

      // Check cache first (5 minutes TTL for individual AMAs)
      const cacheKey = `ama-${id}`
      const cached = cache.get<AMAData>(cacheKey, 5 * 60 * 1000)
      if (cached) {
        setAMA(cached)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/ama/${id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch AMA')
        }

        // Cache the result
        cache.set(cacheKey, data)
        setAMA(data)
      } catch (err) {
        console.error('Error fetching AMA:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch AMA')
      } finally {
        setLoading(false)
      }
    }

    fetchAMA()
  }, [id])

  return { ama, loading, error }
}

export function useAMAList() {
  const [amas, setAMAs] = useState<AMAData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAMAs = async () => {
      // Check cache first (1 minute TTL for list)
      const cacheKey = 'ama-list'
      const cached = cache.get<AMAData[]>(cacheKey, 60 * 1000)
      if (cached) {
        setAMAs(cached)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/ama')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch AMAs')
        }

        // Cache the result
        cache.set(cacheKey, data)
        setAMAs(data)
      } catch (err) {
        console.error('Error fetching AMAs:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch AMAs')
      } finally {
        setLoading(false)
      }
    }

    fetchAMAs()
  }, [])

  return { amas, loading, error }
}
