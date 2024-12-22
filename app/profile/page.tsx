'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNeynarUser } from '../hooks/useNeynarUser'
import { SignInWithNeynar } from '../components/SignInWithNeynar'
import { ProfilesSection } from '../components/ProfilesSection'

export default function ProfileIndexPage() {
  const router = useRouter()
  const { neynarUser, isLoading } = useNeynarUser()

  useEffect(() => {
    if (!isLoading && neynarUser?.fid) {
      router.push(`/profile/${neynarUser.fid}`)
    }
  }, [neynarUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">
          Welcome to AMAcaster Profiles
        </h2>
        <p className="text-gray-600 mb-4">
          Please connect with Farcaster to view your profile or search for other
          profiles.
        </p>
        <div className="flex justify-center mb-8">
          <SignInWithNeynar />
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Browse Profiles</h3>
          <ProfilesSection />
        </div>
      </div>
    </div>
  )
}
