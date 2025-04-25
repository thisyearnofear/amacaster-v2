import { useCachedFetch } from './useCachedFetch'

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
  const { data: ama, loading, error } = useCachedFetch<AMAData>(
    `ama-${id}`,
    id ? `/api/ama/${id}` : null,
    5 * 60 * 1000
  )

  return { ama, loading, error }
}
