import { useEffect, useState } from 'react'
import { cache } from '../utils/cache'

export interface Web3BioProfile {
  address: string
  identity: string
  platform: string
  displayName: string
  avatar: string | null
  description: string | null
  email: string | null
  location: string | null
  header: string | null
  contenthash: string | null
  links: {
    [key: string]: {
      link: string
      handle: string
      sources: string[]
    }
  }
  social: {
    uid?: number
    follower?: number
    following?: number
  }
}

export function useWeb3BioProfile(username: string | null) {
  const [profile, setProfile] = useState<Web3BioProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return

      // Check cache first (1 hour TTL)
      const cacheKey = `web3bio-profile-${username}`
      const cached = cache.get<Web3BioProfile>(cacheKey, 60 * 60 * 1000)
      if (cached) {
        setProfile(cached)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/profile/${username}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch profile')
        }

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Profile not found')
        }

        const farcasterProfile = data.find(
          (p: Web3BioProfile) => p.platform === 'farcaster',
        )
        const ensProfile = data.find(
          (p: Web3BioProfile) => p.platform === 'ens',
        )

        if (!farcasterProfile) {
          throw new Error('Farcaster profile not found')
        }

        // Combine profiles for richer data
        const combinedProfile = {
          ...farcasterProfile,
          email: ensProfile?.email || farcasterProfile.email,
          website:
            ensProfile?.links?.website || farcasterProfile.links?.website,
          links: {
            ...farcasterProfile.links,
            ...(ensProfile?.links || {}),
          },
        }

        // Cache the result
        cache.set(cacheKey, combinedProfile)
        setProfile(combinedProfile)
      } catch (err) {
        console.error('Error fetching Web3.bio profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  return { profile, loading, error }
}
