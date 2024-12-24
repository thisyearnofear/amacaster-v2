import { useQuery } from '@tanstack/react-query'
import { getNeynarClient } from '@/lib/neynarClient'

export function useAMA(url: string) {
  const neynarClient = getNeynarClient()
  return useQuery({
    queryKey: ['ama', url],
    queryFn: async () => {
      const mainCastResponse = await neynarClient.lookupCastByUrl(url)
      const mainCast = mainCastResponse.result.cast
      const threadResponse = await neynarClient.fetchThread(
        mainCast.thread_hash,
      )

      return {
        mainCast,
        thread: threadResponse.result.casts,
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (renamed from cacheTime)
  })
}
