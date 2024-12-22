import { useState, useEffect } from 'react'
import { type Match } from '../utils/matchSubmission'

export interface MatchSet {
  id: string
  matches: Match[]
  metadata: {
    submitter: string
    timestamp: number
    usageCount: number
    averageScore: number
    tags?: string[]
  }
}

interface UseMatchDiscoveryProps {
  amaId: string
  limit?: number
}

interface UseMatchDiscoveryReturn {
  popularSets: MatchSet[]
  recentSets: MatchSet[]
  loading: boolean
  error: Error | null
  applyMatchSet: (matchSet: MatchSet) => void
  refreshSets: () => Promise<void>
}

export function useMatchDiscovery({
  amaId,
  limit = 10,
}: UseMatchDiscoveryProps): UseMatchDiscoveryReturn {
  const [popularSets, setPopularSets] = useState<MatchSet[]>([])
  const [recentSets, setRecentSets] = useState<MatchSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch match sets from IPFS
  const fetchMatchSets = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Implement fetching from a directory or index of match sets
      // For now, using mock data
      const mockSets: MatchSet[] = Array.from({ length: 5 }, (_, i) => ({
        id: `set_${i}`,
        matches: [],
        metadata: {
          submitter: `user_${i}`,
          timestamp: Date.now() - i * 86400000, // Each set 1 day apart
          usageCount: Math.floor(Math.random() * 100),
          averageScore: Math.random() * 5,
          tags: ['development', 'design', 'strategy'],
        },
      }))

      // Sort by usage count for popular sets
      const sortedByPopularity = [...mockSets].sort(
        (a, b) => b.metadata.usageCount - a.metadata.usageCount,
      )

      // Sort by timestamp for recent sets
      const sortedByRecent = [...mockSets].sort(
        (a, b) => b.metadata.timestamp - a.metadata.timestamp,
      )

      setPopularSets(sortedByPopularity.slice(0, limit))
      setRecentSets(sortedByRecent.slice(0, limit))
    } catch (err) {
      console.error('Error fetching match sets:', err)
      setError(
        err instanceof Error ? err : new Error('Failed to fetch match sets'),
      )
    } finally {
      setLoading(false)
    }
  }

  // Function to apply a match set
  const applyMatchSet = (matchSet: MatchSet) => {
    // TODO: Implement match set application logic
    console.log('Applying match set:', matchSet)
  }

  // Initial fetch
  useEffect(() => {
    fetchMatchSets()
  }, [amaId, limit])

  return {
    popularSets,
    recentSets,
    loading,
    error,
    applyMatchSet,
    refreshSets: fetchMatchSets,
  }
}
