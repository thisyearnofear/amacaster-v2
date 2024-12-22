'use client'

import { useEffect, useState } from 'react'
import { cache } from '../utils/cache'
import { getProfileData } from '../utils/farcaster'
import type { Web3BioProfile } from '../utils/farcaster'

export function useWeb3BioProfile(identifier: string | null) {
  const [profile, setProfile] = useState<Web3BioProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    const fetchProfile = async () => {
      if (!identifier) {
        console.log('useWeb3BioProfile: No identifier provided')
        setProfile(null)
        return
      }

      // Check cache first (1 hour TTL)
      const cacheKey = `web3bio-profile-${identifier}`
      const cached = cache.get<Web3BioProfile>(cacheKey, 60 * 60 * 1000)
      if (cached) {
        console.log('useWeb3BioProfile: Found cached profile:', cached)
        if (isMounted) {
          setProfile(cached)
        }
        return
      }

      if (isMounted) {
        setLoading(true)
        setError(null)
      }

      try {
        const { profile: fetchedProfile } = await getProfileData(identifier)

        if (!fetchedProfile) {
          throw new Error('Profile not found')
        }

        // Cache the result
        cache.set(cacheKey, fetchedProfile)

        if (isMounted) {
          setProfile(fetchedProfile)
        }
      } catch (err) {
        console.error('useWeb3BioProfile: Error fetching profile:', err)
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch profile',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [identifier])

  return { profile, loading, error }
}
