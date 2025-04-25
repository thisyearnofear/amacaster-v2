import { useCachedFetch } from './useCachedFetch'
import type { AMAData } from './useAMAData'

/**
 * Fetches the list of AMAs with caching (1-minute TTL).
 */
export function useAMAList() {
  const { data: amas, loading, error } = useCachedFetch<AMAData[]>(
    'ama-list',
    '/api/ama',
    60 * 1000
  )
  return { amas, loading, error }
}
