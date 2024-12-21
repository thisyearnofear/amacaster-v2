'use client'

import { useEffect, useState } from 'react'
import { useNeynarUser } from '../../hooks/useNeynarUser'
import { useAccount } from 'wagmi'
import { useUserProfile } from '../../hooks/useUserProfile'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { SignInWithNeynar } from '../../components/SignInWithNeynar'
import { ProfilesSection } from '../../components/ProfilesSection'
import Link from 'next/link'

interface Web3BioProfile {
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
  website?: {
    link: string
    handle: string
    sources: string[]
  }
}

interface ProfilePageProps {
  params: {
    fid: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { neynarUser } = useNeynarUser()
  const { address } = useAccount()
  const router = useRouter()
  const {
    profile: contractProfile,
    loading: contractProfileLoading,
    error: contractProfileError,
    createUserProfile,
  } = useUserProfile()
  const [web3BioProfile, setWeb3BioProfile] = useState<Web3BioProfile | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!params.fid) return

      // Don't fetch if we already have the profile for this FID
      if (web3BioProfile?.social?.uid === parseInt(params.fid)) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        // First get the username from our Neynar user context if it matches the FID
        let username = neynarUser?.username

        // If the FID doesn't match the current user, we need to fetch the username from Pinata
        if (!username || neynarUser?.fid !== parseInt(params.fid)) {
          const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT
          if (!pinataJwt) {
            throw new Error('Pinata JWT is not configured')
          }

          const pinataResponse = await fetch(
            `https://api.pinata.cloud/v3/farcaster/users/${params.fid}`,
            {
              headers: {
                Authorization: `Bearer ${pinataJwt}`,
                'Cache-Control': 'no-cache',
              },
              cache: 'no-store',
            },
          )

          if (!pinataResponse.ok) {
            throw new Error('Failed to fetch user data')
          }

          const pinataData = await pinataResponse.json()
          if (!pinataData.user?.username) {
            throw new Error('User not found')
          }

          username = pinataData.user.username
        }

        if (!username) {
          throw new Error('Could not find username for this FID')
        }

        // Fetch Web3.bio profile using our API route
        console.log('Fetching profile for username:', username)
        const profileResponse = await fetch(`/api/profile/${username}`)
        console.log('Profile response status:', profileResponse.status)

        let web3BioData
        try {
          const responseText = await profileResponse.text()
          console.log('Raw response text:', responseText)
          web3BioData = JSON.parse(responseText)
          console.log('Parsed web3bio data:', web3BioData)
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
          throw new Error('Failed to parse profile data')
        }

        if (!profileResponse.ok) {
          console.error('Profile response error:', web3BioData)
          throw new Error(web3BioData.details || 'Failed to load profile data')
        }

        if (!Array.isArray(web3BioData)) {
          console.error('Unexpected data format:', web3BioData)
          throw new Error('Invalid profile data format')
        }

        // Find the Farcaster profile
        const farcasterProfile = web3BioData.find(
          (profile: any) => profile.platform === 'farcaster',
        )

        if (!farcasterProfile) {
          console.error('No Farcaster profile found in:', web3BioData)
          throw new Error('Farcaster profile not found')
        }

        console.log('Found Farcaster profile:', farcasterProfile)

        // Also get the ENS profile for additional info if available
        const ensProfile = web3BioData.find(
          (profile: any) => profile.platform === 'ens',
        )

        if (ensProfile) {
          console.log('Found ENS profile:', ensProfile)
        }

        // Combine profiles for richer data
        const combinedProfile = {
          ...farcasterProfile,
          // Add ENS email and website if available
          email: ensProfile?.email || farcasterProfile.email,
          website:
            ensProfile?.links?.website || farcasterProfile.links?.website,
          // Combine social links
          links: {
            ...farcasterProfile.links,
            ...(ensProfile?.links || {}),
          },
        }

        console.log('Setting combined profile:', combinedProfile)
        setWeb3BioProfile(combinedProfile)
        setError(null)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load profile data',
        )
        setWeb3BioProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [
    params.fid,
    neynarUser?.fid,
    neynarUser?.username,
    web3BioProfile?.social?.uid,
  ])

  const handleCreateProfile = async () => {
    if (!neynarUser || creating) return

    setCreating(true)
    try {
      await createUserProfile()
    } catch (err) {
      console.error('Error creating profile:', err)
      setError('Failed to create profile')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  if (!web3BioProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header with Hero Banner */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-t-lg h-32 relative mb-16">
          {web3BioProfile.header && (
            <Image
              src={web3BioProfile.header}
              alt="Profile banner"
              fill
              className="object-cover rounded-t-lg opacity-50"
            />
          )}
          <div className="absolute -bottom-12 left-6 w-24 h-24">
            <div className="relative w-full h-full">
              <Image
                src={web3BioProfile.avatar || '/default-avatar.png'}
                alt={`Profile picture of ${
                  web3BioProfile.displayName || web3BioProfile.identity
                }`}
                fill
                className="rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="ml-32">
            {' '}
            {/* Offset to account for the avatar */}
            <h1 className="text-2xl font-bold">{web3BioProfile.displayName}</h1>
            <p className="text-gray-600">@{web3BioProfile.identity}</p>
            {web3BioProfile.description && (
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                {web3BioProfile.description}
              </p>
            )}
            {web3BioProfile.location && (
              <p className="mt-1 text-gray-600">📍 {web3BioProfile.location}</p>
            )}
          </div>

          {/* Social Stats and Links */}
          <div className="mt-6 flex flex-col gap-4">
            {web3BioProfile.social && (
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {web3BioProfile.social.follower?.toLocaleString() || 0}
                  </div>
                  <div className="text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {web3BioProfile.social.following?.toLocaleString() || 0}
                  </div>
                  <div className="text-gray-600">Following</div>
                </div>
                {contractProfile && (
                  <>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {contractProfile.matchesSubmitted}
                      </div>
                      <div className="text-gray-600">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {contractProfile.totalScore}
                      </div>
                      <div className="text-gray-600">Score</div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Social Links */}
            {web3BioProfile.links &&
              Object.keys(web3BioProfile.links).length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {Object.entries(web3BioProfile.links).map(
                    ([platform, data]: [string, any]) =>
                      data?.link && (
                        <a
                          key={platform}
                          href={data.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                        >
                          {platform === 'website'
                            ? '🌐'
                            : platform === 'twitter'
                            ? '𝕏'
                            : '🔗'}
                          <span className="capitalize">{platform}</span>
                        </a>
                      ),
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Achievements and Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* AMA Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">AMA Stats</h2>
              <span className="text-3xl">📊</span>
            </div>
            {!contractProfile ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">Start your AMA journey!</p>
                <button
                  onClick={handleCreateProfile}
                  disabled={creating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : '🎯 Get Started'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Matches</span>
                  <span className="font-bold">
                    {contractProfile.matchesSubmitted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Score</span>
                  <span className="font-bold">
                    {contractProfile.totalScore}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rank</span>
                  <span className="font-bold text-purple-600">Coming Soon</span>
                </div>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Achievements</h2>
              <span className="text-3xl">🏆</span>
            </div>
            {!contractProfile ? (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  Unlock achievements by participating!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Achievement
                  title="First Match"
                  description="Submit your first match"
                  unlocked={Boolean(contractProfile.achievementFlags & 1)}
                />
                <Achievement
                  title="Match Master"
                  description="Submit 10 matches"
                  unlocked={Boolean(contractProfile.achievementFlags & 2)}
                />
                <Achievement
                  title="High Scorer"
                  description="Reach a total score of 100"
                  unlocked={Boolean(contractProfile.achievementFlags & 4)}
                />
              </div>
            )}
          </div>

          {/* NFT Collection */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">NFT Collection</h2>
              <span className="text-3xl">🎨</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center group cursor-pointer hover:shadow-md transition-all">
                <div className="text-center">
                  <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                    🔒
                  </span>
                  <p className="text-xs text-gray-600 mt-1">Coming Soon</p>
                </div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center group cursor-pointer hover:shadow-md transition-all">
                <div className="text-center">
                  <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                    🔒
                  </span>
                  <p className="text-xs text-gray-600 mt-1">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <Link
              href="/ama"
              className="text-purple-600 hover:text-purple-700 transition-colors text-sm"
            >
              View All AMAs →
            </Link>
          </div>

          {!contractProfile ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Start participating to see your activity!
              </p>
              <Link
                href="/ama"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <span className="mr-2">🎯</span>
                Explore AMAs
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-purple-100 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Recent Match</h4>
                    <p className="text-sm text-gray-600">Compared 2 AMAs</p>
                  </div>
                  <span className="text-purple-600">+10 pts</span>
                </div>
              </div>
              <div className="border border-purple-100 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Achievement Unlocked</h4>
                    <p className="text-sm text-gray-600">
                      First Match Completed
                    </p>
                  </div>
                  <span className="text-purple-600">🏆</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Featured AMAs Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Featured AMAs</h2>
            <Link
              href="/ama"
              className="text-purple-600 hover:text-purple-700 transition-colors text-sm"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Vitalik Buterin',
                category: 'Ethereum',
                icon: '⟠',
              },
              {
                title: 'Brian Armstrong',
                category: 'Crypto',
                icon: '₿',
              },
            ].map((ama, i) => (
              <Link
                key={i}
                href="/ama"
                className="block border border-purple-100 rounded-lg p-4 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-xl">
                    {ama.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{ama.title}</h4>
                    <p className="text-sm text-gray-600">
                      Compare and rank this AMA
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-purple-50 rounded text-xs text-purple-700">
                      {ama.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Achievement({
  title,
  description,
  unlocked,
}: {
  title: string
  description: string
  unlocked: boolean
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        unlocked
          ? 'bg-purple-50 border-purple-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            unlocked ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}
        >
          {unlocked ? '✓' : '?'}
        </div>
        <div>
          <h4
            className={`font-semibold ${
              unlocked ? 'text-purple-900' : 'text-gray-600'
            }`}
          >
            {title}
          </h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

function countAchievements(flags: number): number {
  let count = 0
  while (flags > 0) {
    count += flags & 1
    flags >>= 1
  }
  return count
}
