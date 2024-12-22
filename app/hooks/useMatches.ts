import { useQuery } from '@tanstack/react-query'
import { type Match } from '../api/matches/[fid]/route'

export { type Match }

export function useMatches(fid: string) {
  return useQuery({
    queryKey: ['matches', fid],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${fid}`)
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      return response.json() as Promise<Match[]>
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })
}
