import { useEffect, useState } from 'react'
import { cache } from '../utils/cache'

export interface FarcasterUser {
  username: string
  displayName: string
  pfp?: {
    url: string
  }
  profile?: {
    bio?: {
      text: string
    }
  }
}

export function useFarcasterUser(fid: string | null) {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!fid) return

      // Check cache first (30 minute TTL)
      const cacheKey = `farcaster-user-${fid}`
      const cached = cache.get<FarcasterUser>(cacheKey, 30 * 60 * 1000)
      if (cached) {
        setUser(cached)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT
        if (!pinataJwt) {
          throw new Error('Pinata JWT is not configured')
        }

        const response = await fetch(
          `https://api.pinata.cloud/v3/farcaster/users/${fid}`,
          {
            headers: {
              Authorization: `Bearer ${pinataJwt}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }

        const data = await response.json()
        if (!data.user) {
          throw new Error('User not found')
        }

        // Cache the result
        cache.set(cacheKey, data.user)
        setUser(data.user)
      } catch (err) {
        console.error('Error fetching Farcaster user:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch user')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [fid])

  return { user, loading, error }
}
