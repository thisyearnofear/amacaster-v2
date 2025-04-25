'use client'

import { useCachedAsync } from './useCachedAsync'
import { getProfileData } from '../utils/farcaster'
import type { Web3BioProfile } from '../utils/farcaster'

export function useWeb3BioProfile(identifier: string | null) {
  const { data: profile, loading, error } = useCachedAsync<Web3BioProfile>(
    `web3bio-profile-${identifier}`,
    identifier
      ? async () => {
          const { profile: fetchedProfile } = await getProfileData(identifier)
          if (!fetchedProfile) {
            throw new Error('Profile not found')
          }
          return fetchedProfile
        }
      : null,
    60 * 60 * 1000
  )
  return { profile, loading, error }
}
