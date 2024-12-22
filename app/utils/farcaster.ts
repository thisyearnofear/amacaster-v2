interface PinataUserResponse {
  user: {
    active_status: string
    custody_address: string
    display_name: string
    fid: number
    follower_count: number
    following_count: number
    object: string
    pfp_url: string
    power_badge: boolean
    profile: {
      bio: {
        mentioned_profiles: any[]
        text: string
      }
    }
    username: string
    verifications: string[]
    verified_addresses: {
      eth_addresses: string[]
      sol_addresses: string[]
    }
  }
}

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

async function fetchFromPinata(endpoint: string) {
  const pinataJwt = process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT
  if (!pinataJwt) {
    throw new Error('Pinata JWT not configured')
  }

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Resource not found at ${endpoint}`)
    }
    throw new Error(`Failed to fetch from Pinata: ${response.statusText}`)
  }

  return response.json()
}

async function getFarcasterUsername(fid: string | number): Promise<string> {
  const endpoint = `https://api.pinata.cloud/v3/farcaster/users/${fid}`
  const data: PinataUserResponse = await fetchFromPinata(endpoint)
  return data.user.username
}

export async function getFarcasterUser(
  identifier: string,
  type: 'fid' | 'username' = 'fid',
): Promise<Web3BioProfile> {
  try {
    // Get username if FID is provided
    const username =
      type === 'fid' ? await getFarcasterUsername(identifier) : identifier
    const formattedIdentifier = !username.endsWith('.farcaster')
      ? `${username}.farcaster`
      : username

    // Fetch from Web3.bio
    const response = await fetch(
      `https://api.web3.bio/profile/${formattedIdentifier}`,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch from Web3.bio: ${response.statusText}`)
    }

    const profiles = await response.json()
    const farcasterProfile = Array.isArray(profiles)
      ? profiles.find(
          (profile: Web3BioProfile) => profile.platform === 'farcaster',
        )
      : null

    if (!farcasterProfile) {
      throw new Error(`Farcaster profile not found for ${formattedIdentifier}`)
    }

    // Add FID to social object if available
    if (type === 'fid') {
      farcasterProfile.social = {
        ...farcasterProfile.social,
        uid: Number(identifier),
      }
    }

    return farcasterProfile
  } catch (error) {
    console.error('Error in getFarcasterUser:', error)
    throw error
  }
}

export async function getProfileData(fid: string) {
  try {
    const profile = await getFarcasterUser(fid)
    return { profile }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return { profile: null }
  }
}
