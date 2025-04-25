'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from './common/Card'

interface FeaturedProfile {
  username: string
  fid: number
  address: string
  avatar?: string
  displayName?: string
  description?: string
}

const FEATURED_PROFILES: FeaturedProfile[] = [
  {
    username: 'papa',
    fid: 5254,
    address: '0x55A5705453Ee82c742274154136Fce8149597058',
  },
]

export function ProfilesSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.web3.bio/profile/farcaster/${searchQuery}`,
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults([data])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching profiles:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h3 className="text-lg mb-6 text-center">profiles</h3>

      {/* Search Bar */}
      <div className="flex flex-row justify-center mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search Farcaster username..."
          className="border rounded-l-md px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-r-md"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Featured Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {FEATURED_PROFILES.map((profile) => (
          <Link key={profile.fid} href={`/profile/${profile.fid}`}>
            <Card className="hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <Image
                    src={profile.avatar || '/default-avatar.png'}
                    alt={`${profile.username}'s profile picture`}
                    fill
                    sizes="(max-width: 768px) 64px, 64px"
                    className="rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-semibold">
                    {profile.displayName || `@${profile.username}`}
                  </h4>
                  <p className="text-sm text-gray-600">FID: {profile.fid}</p>
                  {profile.description && (
                    <p className="mt-2 text-sm text-gray-700">
                      {profile.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {searchResults.map((result) => (
            <Link key={result.fid} href={`/profile/${result.fid}`}>
              <Card className="hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <Image
                      src={result.avatar || '/default-avatar.png'}
                      alt={`${result.identity}'s profile picture`}
                      fill
                      sizes="(max-width: 768px) 64px, 64px"
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">
                      {result.displayName || `@${result.identity}`}
                    </h4>
                    {result.description && (
                      <p className="mt-2 text-sm text-gray-700">
                        {result.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
