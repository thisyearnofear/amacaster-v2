import { useCachedFetch } from './useCachedFetch'

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
  const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT
  const cacheKey = `farcaster-user-${fid}`
  const url = fid && pinataJwt
    ? `https://api.pinata.cloud/v3/farcaster/users/${fid}`
    : null
  const options: RequestInit | undefined = pinataJwt
    ? { headers: { Authorization: `Bearer ${pinataJwt}` } }
    : undefined
  const { data: user, loading, error: fetchError } = useCachedFetch<FarcasterUser>(
    cacheKey,
    url,
    30 * 60 * 1000,
    options
  )
  const error = !pinataJwt ? 'Pinata JWT is not configured' : fetchError
  return { user, loading, error }
}
