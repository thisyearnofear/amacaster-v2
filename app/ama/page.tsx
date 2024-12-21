'use client'

import { useEffect, useState } from 'react'
import { getNeynarClient } from '../../lib/neynarClient'
import DraggableQASection, {
  isAnswerStack,
} from '../components/DraggableQASection'
import type { Cast, Author } from '../types'
import type { Cast as NeynarCast } from '../../lib/neynarClient'
import type { AnswerEntry, AnswerStack } from '../components/DraggableQASection'
import Image from 'next/image'
import { useNeynarUser } from '../hooks/useNeynarUser'
import Link from 'next/link'

const DEFAULT_AVATAR = '/default-avatar.png'

const transformNeynarAuthor = (neynarAuthor: any): Author => {
  console.log('Raw author data:', neynarAuthor)

  // Handle different avatar URL structures
  let avatarUrl = DEFAULT_AVATAR
  try {
    avatarUrl =
      neynarAuthor.avatar_url ||
      neynarAuthor.pfp_url ||
      (neynarAuthor.pfp && neynarAuthor.pfp.url) ||
      DEFAULT_AVATAR
  } catch (error) {
    console.warn('Error processing avatar URL:', error)
  }

  return {
    fid: neynarAuthor.fid,
    username: neynarAuthor.username || '',
    fname: neynarAuthor.fname || neynarAuthor.username || '',
    display_name: neynarAuthor.display_name,
    avatar_url: avatarUrl,
    custody_address: neynarAuthor.custody_address || '',
  }
}

const transformNeynarCast = (neynarCast: NeynarCast): Cast => ({
  hash: neynarCast.hash,
  thread_hash: neynarCast.thread_hash,
  parent_hash: neynarCast.parent_hash,
  author: transformNeynarAuthor(neynarCast.author),
  text: neynarCast.text,
  timestamp: neynarCast.timestamp,
  reactions: neynarCast.reactions,
  replies: neynarCast.replies,
  mentioned_profiles: neynarCast.mentioned_profiles?.map(transformNeynarAuthor),
})

interface AMAPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function AMAPage({ searchParams }: AMAPageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mainCast, setMainCast] = useState<any>(null)
  const [secondTier, setSecondTier] = useState<Cast[]>([])
  const [thirdTier, setThirdTier] = useState<Cast[]>([])
  const [amaUser, setAmaUser] = useState<Author | null>(null)
  const [hostUser, setHostUser] = useState<Author | null>(null)
  const [guestUser, setGuestUser] = useState<Author | null>(null)
  const { neynarUser, isConnected } = useNeynarUser()

  // Update admin state based on user connection - during testing phase, any logged-in user can submit
  const isAdmin = isConnected || !!neynarUser

  useEffect(() => {
    async function fetchData() {
      try {
        // Debug all search parameters
        console.log('All search parameters:', searchParams)
        console.log('Search params type:', typeof searchParams)

        // Try getting URL from different methods
        const urlFromParams = searchParams['url']
        const urlFromSearchParams = new URLSearchParams(
          window.location.search,
        ).get('url')

        console.log('URL from searchParams:', urlFromParams)
        console.log('URL from window.location:', urlFromSearchParams)

        // Use the URL from either source
        const url = urlFromParams || urlFromSearchParams

        if (!url || typeof url !== 'string') {
          console.error('Invalid URL parameter:', {
            fromParams: urlFromParams,
            fromLocation: urlFromSearchParams,
            fullUrl: window.location.href,
          })
          setError('Please provide a valid Warpcast URL.')
          setIsLoading(false)
          return
        }

        console.log('Using URL for fetch:', url)
        console.log('Initializing Neynar client...')

        if (!process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
          throw new Error('NEXT_PUBLIC_NEYNAR_API_KEY is not set')
        }

        const neynarClient = getNeynarClient()
        console.log('Neynar client initialized successfully')

        // Make single API call for main cast
        console.log('Fetching main cast...')
        const mainCastResponse = await neynarClient.lookupCastByUrl(url)
        if (!mainCastResponse?.result?.cast) {
          console.error('Main cast response invalid:', mainCastResponse)
          throw new Error('Failed to fetch main cast')
        }
        console.log('Main cast fetched successfully')

        const fetchedMainCast = mainCastResponse.result.cast
        setMainCast(fetchedMainCast)

        // Transform and set users
        const fetchedAmaUser = transformNeynarAuthor(
          fetchedMainCast.mentioned_profiles?.[0] || fetchedMainCast.author,
        )
        const fetchedGuestUser = transformNeynarAuthor(fetchedMainCast.author)

        setAmaUser(fetchedAmaUser)
        setHostUser(fetchedAmaUser)
        setGuestUser(fetchedGuestUser)

        // Use the result for thread fetch
        const threadResponse = await neynarClient.fetchThread(
          fetchedMainCast.thread_hash,
        )
        if (!threadResponse?.result?.casts) {
          throw new Error('Failed to fetch thread')
        }

        const casts = threadResponse.result.casts
          .filter((cast) => cast && typeof cast === 'object')
          .map(transformNeynarCast)

        // Separate responses into second and third tier based on AMA user
        const secondTierResponses: Cast[] = []
        const thirdTierResponses: Cast[] = []

        casts.forEach((cast) => {
          if (cast.hash === fetchedMainCast.hash) return // Skip the main cast

          // Check if the cast is from the AMA user by comparing both username and fname
          const isFromAMAUser =
            (fetchedAmaUser.username &&
              cast.author.username === fetchedAmaUser.username) ||
            (fetchedAmaUser.fname && cast.author.fname === fetchedAmaUser.fname)

          if (isFromAMAUser) {
            thirdTierResponses.push(cast)
          } else if (!cast.parent_hash) {
            secondTierResponses.push(cast)
          }
        })

        // Sort by timestamp
        setSecondTier(
          secondTierResponses.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          ),
        )
        setThirdTier(
          thirdTierResponses.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          ),
        )
      } catch (err: unknown) {
        console.error('Detailed error in AMA page:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Error loading AMA. Please try refreshing the page.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

  if (error) {
    return (
      <div className="ama-container">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      </div>
    )
  }

  if (isLoading || !mainCast || !amaUser || !hostUser || !guestUser) {
    return (
      <div className="ama-container">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="ama-container">
      {/* AMA Header */}
      <div className="ama-header">
        {/* Instructions Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg text-center">
          <h2 className="text-lg font-medium mb-2">AMAcaster</h2>
          <p className="text-sm text-gray-600">
            {isAdmin ? (
              'Arrange questions and answers in the correct order. Stack multiple answers if needed.'
            ) : (
              <>
                Match q&a pairs. Rank question usefulness. Submit onchain.
                <br />
                POAPs distributed [participation, understanding, usefulness] =
                NFT split.
              </>
            )}
          </p>
        </div>

        {/* Guest Profile */}
        <div className="guest-profile">
          <div className="profile-tag">Guest</div>
          <div className="guest-info">
            <Link
              href={`/profile/${amaUser.fid}`}
              className="relative w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Image
                src={amaUser.avatar_url}
                alt={amaUser.display_name}
                fill
                className="guest-avatar rounded-full object-cover"
                unoptimized={amaUser.avatar_url.startsWith('data:')}
              />
            </Link>
            <Link
              href={`/profile/${amaUser.fid}`}
              className="hover:text-purple-600 transition-colors"
            >
              <div className="guest-name">{amaUser.display_name}</div>
              <div className="guest-username">@{amaUser.username}</div>
            </Link>
          </div>
        </div>

        {/* Initial Cast with Host Info */}
        <div className="initial-cast">
          <div className="cast-header">
            <Link
              href={`/profile/${mainCast.author.fid}`}
              className="relative w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Image
                src={
                  mainCast.author.pfp_url ||
                  mainCast.author.avatar_url ||
                  DEFAULT_AVATAR
                }
                alt={mainCast.author.display_name}
                fill
                className="cast-avatar rounded-full object-cover"
                unoptimized={(
                  mainCast.author.pfp_url ||
                  mainCast.author.avatar_url ||
                  ''
                ).startsWith('data:')}
              />
            </Link>
            <div>
              <div className="host-tag">Host</div>
              <Link
                href={`/profile/${mainCast.author.fid}`}
                className="hover:text-purple-600 transition-colors"
              >
                <div className="font-medium">
                  {mainCast.author.display_name}
                </div>
                <div className="text-gray-600">@{mainCast.author.username}</div>
              </Link>
            </div>
          </div>
          <div className="cast-text">{mainCast.text}</div>
        </div>
      </div>

      {/* Q&A Section */}
      <DraggableQASection
        secondTier={secondTier}
        thirdTier={thirdTier}
        isAdmin={isAdmin}
        neynarUser={neynarUser}
        onOrderChange={async (newSecondTier, newThirdTier) => {
          if (!isAdmin) return

          try {
            const response = await fetch('/api/save-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                castHash: mainCast.hash,
                order: {
                  secondTier: newSecondTier.map((cast) => cast.hash),
                  thirdTier: newThirdTier.map((entry) =>
                    isAnswerStack(entry) ? entry.answers[0].hash : entry.hash,
                  ),
                },
              }),
            })

            if (!response.ok) {
              console.error('Failed to save order')
            }
          } catch (error) {
            console.error('Error saving order:', error)
          }
        }}
      />
    </div>
  )
}
