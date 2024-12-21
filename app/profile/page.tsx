'use client'

import { useEffect, useState } from 'react'
import { useNeynarUser } from '../hooks/useNeynarUser'
import { useAccount } from 'wagmi'
import { useUserProfile } from '../hooks/useUserProfile'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { SignInWithNeynar } from '../components/SignInWithNeynar'
import { ProfilesSection } from '../components/ProfilesSection'

interface Web3BioProfile {
  address: string
  identity: string
  platform: string
  displayName: string
  avatar: string
  description: string
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

export default function ProfilePage() {
  const { neynarUser, isLoading: neynarLoading } = useNeynarUser()
  const { address } = useAccount()
  const router = useRouter()
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    createUserProfile,
  } = useUserProfile()
  const [web3BioProfile, setWeb3BioProfile] = useState<Web3BioProfile | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!neynarLoading && neynarUser?.fid) {
      router.push(`/profile/${neynarUser.fid}`)
    }
  }, [neynarUser, neynarLoading, router])

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!neynarUser?.username) {
        setLoading(false)
        return
      }

      try {
        // Fetch Web3.bio profile
        const username = neynarUser.username
        const web3BioResponse = await fetch(
          `https://api.web3.bio/profile/farcaster/${username}`,
        )
        if (web3BioResponse.ok) {
          const web3BioData = await web3BioResponse.json()
          setWeb3BioProfile(web3BioData)
        }
      } catch (err) {
        console.error('Error fetching profiles:', err)
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [neynarUser])

  const handleCreateProfile = async () => {
    if (!neynarUser || creating) return

    setCreating(true)
    try {
      await createUserProfile()
      // Profile will be automatically updated through the useUserProfile hook
    } catch (err) {
      console.error('Error creating profile:', err)
      setError('Failed to create profile')
    } finally {
      setCreating(false)
    }
  }

  if (neynarLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!neynarUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">
            Welcome to AMAcaster Profiles
          </h2>
          <p className="text-gray-600 mb-4">
            Please connect with Farcaster to view your profile or search for
            other profiles.
          </p>
          <div className="flex justify-center mb-8">
            <SignInWithNeynar />
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Search Profiles</h3>
            <ProfilesSection />
          </div>
        </div>
      </div>
    )
  }

  if (loading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    )
  }

  if (error || profileError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error || profileError}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <Image
                src={
                  web3BioProfile?.avatar ||
                  neynarUser?.pfp?.url ||
                  '/default-avatar.png'
                }
                alt={web3BioProfile?.displayName || neynarUser?.displayName}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {web3BioProfile?.displayName || neynarUser?.displayName}
              </h1>
              <p className="text-gray-600">@{neynarUser?.username}</p>
              {web3BioProfile?.description && (
                <p className="mt-2 text-gray-700">
                  {web3BioProfile.description}
                </p>
              )}
            </div>
            {!profile && (
              <button
                onClick={handleCreateProfile}
                disabled={creating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Profile'}
              </button>
            )}
          </div>

          {/* Social Stats */}
          {web3BioProfile?.social && (
            <div className="flex gap-6 mt-6">
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
            </div>
          )}
        </div>

        {/* On-chain Activity */}
        {profile && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">AMAcaster Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {profile.matchesSubmitted}
                </div>
                <div className="text-gray-600">Matches Submitted</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {profile.totalScore}
                </div>
                <div className="text-gray-600">Total Score</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {countAchievements(profile.achievementFlags)}
                </div>
                <div className="text-gray-600">Achievements</div>
              </div>
            </div>

            {/* Achievements List */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Achievement
                  title="First Match"
                  description="Submit your first match"
                  unlocked={Boolean(profile.achievementFlags & 1)}
                />
                <Achievement
                  title="Match Master"
                  description="Submit 10 matches"
                  unlocked={Boolean(profile.achievementFlags & 2)}
                />
              </div>
            </div>
          </div>
        )}
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
            unlocked ? 'bg-purple-500' : 'bg-gray-300'
          }`}
        >
          {unlocked ? '✓' : '?'}
        </div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

function countAchievements(flags: number): number {
  let count = 0
  while (flags) {
    count += flags & 1
    flags >>= 1
  }
  return count
}
