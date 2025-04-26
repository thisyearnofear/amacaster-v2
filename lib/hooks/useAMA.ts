import { useQuery } from '@tanstack/react-query'

// Client-side Neynar calls moved to backend API routes
export function useAMA(url: string) {
  return useQuery({
    queryKey: ['ama', url],
    queryFn: async () => {
      // Fetch main cast via backend
      const mainRes = await fetch(`/api/fetchCast?url=${encodeURIComponent(url)}`)
      if (!mainRes.ok) throw new Error(`Failed to fetch cast: ${mainRes.statusText}`)
      const mainData = await mainRes.json()
      const mainCast = mainData.result.cast

      // Fetch thread via backend
      const threadRes = await fetch(
        `/api/fetchThread?threadHash=${encodeURIComponent(mainCast.thread_hash)}`
      )
      if (!threadRes.ok) throw new Error(`Failed to fetch thread: ${threadRes.statusText}`)
      const threadData = await threadRes.json()
      const thread = threadData.result.casts

      return { mainCast, thread }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
  })
}
