import { type Match } from '../api/matches/[fid]/route'
import { useCachedFetch } from './useCachedFetch'

export { type Match }

export function useMatches(fid: string) {
  const { data: matches, loading, error } = useCachedFetch<Match[]>(
    `matches-${fid}`,
    fid ? `/api/matches/${fid}` : null,
    5 * 60 * 1000
  )
  return { matches, loading, error }
}
