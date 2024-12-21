// Re-export all Neynar types
export * from './neynar'

// Local types
export interface Author {
  fid: number
  username: string
  fname?: string
  display_name: string
  avatar_url: string
  custody_address?: string
}

export interface Cast {
  hash: string
  thread_hash: string
  parent_hash?: string
  author: Author
  text: string
  timestamp: string
  reactions: {
    likes_count: number
    recasts_count: number
  }
  replies: {
    count: number
  }
  mentioned_profiles?: Author[]
}

export interface AnswerEntry extends Cast {
  answers?: Cast[]
}

export interface AnswerStack {
  id: string
  answers: Cast[]
}

export interface DraggableQASectionProps {
  secondTier: Cast[]
  thirdTier: AnswerEntry[]
  isAdmin: boolean
  neynarUser?: import('./neynar').NeynarUser | null
  onOrderChange: (newSecondTier: Cast[], newThirdTier: AnswerEntry[]) => void
}

export interface QuestionRanking {
  questionHash: string
  usefulnessScore: number
  selected: boolean
}

export interface MatchSubmission {
  questionHash: string
  answerHash: string
  usefulnessScore: number
  ranking: number
}

export interface QAItemProps {
  question: Cast
  answer?: Cast
  thirdTierResponses?: Cast[]
  amaUser: Author
  userAvatar: string
}

// Contract types
export interface OnChainProfile {
  fid: bigint
  walletAddress: `0x${string}`
  matchesSubmitted: bigint
  totalScore: bigint
  achievementFlags: bigint
  lastUpdated: bigint
}

export interface UserProfile {
  fid: number
  walletAddress: `0x${string}`
  matchesSubmitted: number
  totalScore: number
  achievementFlags: number
  lastUpdated: number
}
