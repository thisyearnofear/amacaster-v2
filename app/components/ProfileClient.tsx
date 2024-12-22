'use client'

import { useWeb3BioProfile } from '../hooks/useWeb3BioProfile'
import { useMatches, type Match } from '../hooks/useMatches'
import { MatchHistory } from './MatchHistory'
import Link from 'next/link'
import IconImage from './IconImage'

// Import featured AMAs from home page
const hostLinks = [
  {
    icon: 'ethereum.svg',
    name: 'Vitalik Buterin',
    url: '/ama?url=https://warpcast.com/dwr.eth/0x390ae86a',
  },
  {
    icon: 'coinbase.svg',
    name: 'Brian Armstrong',
    url: '/ama?url=https://warpcast.com/dwr.eth/0x7735946a',
  },
  {
    icon: 'USV.svg',
    name: 'Fred Wilson',
    url: '/ama?url=https://warpcast.com/dwr.eth/0x87e91802',
  },
  {
    icon: 'y-combinator.svg',
    name: 'Garry Tan',
    url: '/ama?url=https://warpcast.com/dwr.eth/0xe4ec97c9',
  },
  {
    icon: 'ebay.svg',
    name: 'Chris Dixon',
    url: '/ama?url=https://warpcast.com/dwr.eth/0x231c3b60',
  },
]

interface ProfileHeaderProps {
  profile: {
    avatar: string | null
    displayName: string | null
    identity?: string | null
    description?: string | null
    followers?: number
    following?: number
    website?: string | null
  } | null
}

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  if (!profile) return null

  // Find the Farcaster profile to get correct follower count
  const farcasterProfile = Array.isArray(profile)
    ? profile.find((p) => p.platform === 'farcaster')
    : profile

  // Use web3bio API's social data for follower counts
  const followerCount = farcasterProfile?.social?.follower || 0
  const followingCount = farcasterProfile?.social?.following || 0

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-start gap-6">
        {profile.avatar && (
          <img
            src={profile.avatar}
            alt={profile.displayName || 'Profile'}
            className="w-20 h-20 rounded-full"
          />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.displayName || 'Anonymous'}
          </h1>
          {profile.identity && (
            <p className="text-gray-500 mb-3">@{profile.identity}</p>
          )}
          {profile.description && (
            <p className="text-gray-700 mb-4">{profile.description}</p>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700"
            >
              {profile.website}
            </a>
          )}
          <div className="flex gap-6 mt-4">
            <div>
              <span className="font-semibold text-gray-900">
                {followerCount.toLocaleString()}
              </span>
              <span className="text-gray-500 ml-1">Followers</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">
                {followingCount.toLocaleString()}
              </span>
              <span className="text-gray-500 ml-1">Following</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProfileMetrics = ({
  matches,
  fid,
}: {
  matches: Match[]
  fid: string
}) => {
  const usefulQuestions = matches.filter(
    (match) => match.question.author.fid === parseInt(fid),
  ).length
  const usefulAnswers = matches.filter(
    (match) => match.answer.author.fid === parseInt(fid),
  ).length

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
        <p className="text-3xl font-bold text-indigo-600">{usefulQuestions}</p>
        <p className="text-sm text-gray-500">Others found useful</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Answers</h3>
        <p className="text-3xl font-bold text-indigo-600">{usefulAnswers}</p>
        <p className="text-sm text-gray-500">Others found useful</p>
      </div>
    </div>
  )
}

const FeaturedAMAs = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Featured AMAs</h2>
        <Link
          href="/"
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          View All →
        </Link>
      </div>
      <div className="space-y-4">
        {hostLinks.map((ama) => (
          <div
            key={ama.url}
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-indigo-100 transition-colors"
          >
            <IconImage
              src={`https://res.cloudinary.com/dsneebaw0/image/upload/v1708031540/${ama.icon}`}
              alt={`${ama.name}'s profile picture`}
              className="w-8 h-8"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{ama.name}</h3>
            </div>
            <Link
              href={ama.url}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              AMA
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

const EmptyState = () => (
  <div className="text-center py-12 bg-white rounded-lg shadow-sm mb-8">
    <p className="text-gray-500">No q&a's here ... yet</p>
  </div>
)

export default function ProfileClient({ fid }: { fid: string }) {
  const { profile, loading: isLoadingProfile } = useWeb3BioProfile(fid)
  const { data: matches = [], isLoading: isLoadingMatches } = useMatches(fid)

  // Group matches by AMA and take all matches from the latest submission for each AMA
  const latestMatches = matches.reduce((acc: Match[], match) => {
    const existingMatchesForAma = acc.filter(
      (m) => m.contractId === match.contractId,
    )

    if (existingMatchesForAma.length === 0) {
      // First time seeing this AMA, add all matches from this submission
      acc.push(...matches.filter((m) => m.contractId === match.contractId))
    } else {
      const existingTimestamp = new Date(existingMatchesForAma[0].timestamp)
      const newTimestamp = new Date(match.timestamp)

      if (newTimestamp > existingTimestamp) {
        // Remove old matches for this AMA
        acc = acc.filter((m) => m.contractId !== match.contractId)
        // Add all matches from this newer submission
        acc.push(...matches.filter((m) => m.contractId === match.contractId))
      }
    }
    return acc
  }, [])

  // Sort matches by ranking (1 to 5)
  const sortedMatches = [...latestMatches].sort((a, b) => {
    // First sort by contractId to group AMA matches together
    if (a.contractId !== b.contractId) {
      return a.contractId.localeCompare(b.contractId)
    }
    // Then sort by ranking within each AMA
    return (a.score || 0) - (b.score || 0)
  })

  console.log('Matches:', {
    original: matches.length,
    latest: latestMatches.length,
    sorted: sortedMatches.length,
    byAma: sortedMatches.reduce((acc, m) => {
      acc[m.contractId] = (acc[m.contractId] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {isLoadingProfile || isLoadingMatches ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <ProfileHeader profile={profile} />
          <ProfileMetrics matches={sortedMatches} fid={fid} />
          {sortedMatches.length === 0 ? (
            <EmptyState />
          ) : (
            <MatchHistory matches={sortedMatches} />
          )}
          <FeaturedAMAs />
        </>
      )}
    </div>
  )
}
