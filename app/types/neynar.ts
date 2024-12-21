// Base profile type
export interface NeynarUserProfile {
  username: string
  displayName: string
  pfp: {
    url: string
  }
  bio?: string
}

// Core Neynar user type
export interface NeynarUser {
  // Core user data
  fid: number
  username: string
  displayName: string

  // Profile data
  pfp: {
    url: string
  }
  profile?: {
    bio?: string
  }

  // Social stats
  followerCount: number
  followingCount: number

  // Authentication
  signer_uuid?: string

  // Status and verification
  activeStatus?: string
  verifications?: string[]

  // Optional fields from different contexts
  fname?: string
  custody_address?: string
}

// API response types
export interface NeynarUserResponse {
  result: {
    user: NeynarUser
  }
}

export interface NeynarSignInResponse {
  signer_uuid: string
  fid: number
  user: {
    username: string
    displayName: string
    pfp: {
      url: string
    }
  }
}

// Cast-related types
export interface NeynarCast {
  hash: string
  thread_hash: string
  parent_hash?: string
  author: NeynarAuthor
  text: string
  timestamp: string
  reactions: {
    likes_count: number
    recasts_count: number
  }
  replies: {
    count: number
  }
  mentioned_profiles?: NeynarAuthor[]
}

export interface NeynarAuthor {
  fid: number
  username: string
  displayName: string
  pfp_url?: string
  avatar_url?: string
  fname?: string
  custody_address?: string
}

// Error types
export interface NeynarError {
  message: string
  code?: string
}

// Hook return types
export interface UseNeynarUserReturn {
  neynarUser: NeynarUser | null
  loading: boolean
  isLoading: boolean
  error: string | null
  updateNeynarUser: (user: NeynarSignInResponse) => void
  clearNeynarUser: () => void
  isConnected: boolean
}
