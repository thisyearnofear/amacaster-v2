'use client'

import Link from 'next/link'
import { useState } from 'react'
import IconImage from './components/IconImage'
import { TestnetInstructions } from './components/TestnetInstructions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Home() {
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
    {
      icon: 'Twitter.svg',
      name: 'Elad Gil',
      url: '/ama?url=https://warpcast.com/dwr.eth/0xd39ac80f',
    },
    {
      icon: 'a16z.svg',
      name: 'Marc Andreessen',
      url: '/ama?url=https://warpcast.com/pmarca/0x5901e102',
    },
  ]

  const communityLinks = [
    {
      icon: 'paragraph.svg',
      name: '@colin',
      url: '/ama?url=https://warpcast.com/yb/0x8bac9cbb',
    },
    {
      icon: 'horsefacts.svg',
      name: 'horsefacts',
      url: '/ama?url=https://warpcast.com/yb/0x7d5219e5',
    },
    {
      icon: 'purple.svg',
      name: '@dwr',
      url: '/ama?url=https://warpcast.com/dwr.eth/0xf41e24f1',
    },
    {
      icon: 'perl.svg',
      name: '@ace',
      url: '/ama?url=https://warpcast.com/jam/0x794f4a4e',
    },
    {
      icon: 'mod.svg',
      name: '@df',
      url: '/ama?url=https://warpcast.com/jam/0xe195a8e2',
    },
    {
      icon: 'fxhash.svg',
      name: '@qualv',
      url: '/ama?url=https://warpcast.com/kugusha.eth/0xa404739c',
    },
    {
      icon: 'bountycaster.svg',
      name: '@linda',
      url: '/ama?url=https://warpcast.com/yb/0x803cf956',
    },
  ]

  const socialLinks = [
    {
      icon: 'twitter.svg',
      name: 'Twitter',
      url: 'https://twitter.com/papajimjams',
    },
    {
      icon: 'farcaster.svg',
      name: 'farcaster',
      url: 'https://warpcast.com/papa',
    },
    {
      icon: 'paragraph.svg',
      name: 'paragraph',
      url: 'https://paragraph.xyz/@papajams.eth',
    },
  ]

  return (
    <div className="flex flex-col items-center py-12 w-full text-center">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-6">AMACASTER</h1>
        <p className="text-xl text-gray-600 mb-12">
          Discover, curate, & learn from Farcaster AMAs
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-16">
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3">Crowdsource Truth</h3>
            <p className="text-gray-600">
              Match questions with answers from Farcaster AMAs and assess the
              most useful content for the community.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-3xl mb-4">⛓️</div>
            <h3 className="text-xl font-semibold mb-3">On-chain Recognition</h3>
            <p className="text-gray-600">
              Receive POAPs for your contributions in matching and ranking AMA
              content you find useful.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm sm:col-span-2 md:col-span-1">
            <div className="text-3xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-3">NFT to ERC-20</h3>
            <p className="text-gray-600">
              Top Q&A pairs become mintable NFTs with proceeds shared among
              active contributors.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Featured AMAs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="archive-section">
              <h3 className="text-xl font-semibold mb-4">Industry Leaders</h3>
              <ul className="space-y-3">
                {hostLinks.map((link) => (
                  <li
                    key={link.url}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Link
                      href={link.url}
                      className="flex items-center justify-center space-x-3"
                    >
                      <IconImage
                        src={`https://res.cloudinary.com/dsneebaw0/image/upload/v1708031540/${link.icon}`}
                        alt={`${link.name}'s icon`}
                        className="w-6 h-6"
                      />
                      <span className="hover:underline">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="archive-section">
              <h3 className="text-xl font-semibold mb-4">
                Community Favorites
              </h3>
              <ul className="space-y-3">
                {communityLinks.map((link) => (
                  <li
                    key={link.url}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Link
                      href={link.url}
                      className="flex items-center justify-center space-x-3"
                    >
                      <IconImage
                        src={`https://res.cloudinary.com/dsneebaw0/image/upload/v1708031540/${link.icon}`}
                        alt={`${link.name}'s icon`}
                        className="w-6 h-6"
                      />
                      <span className="hover:underline">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-12">
          <h3 className="text-xl font-semibold mb-4">Credits</h3>
          <div className="space-y-2 text-gray-400">
            <p>
              Challenge{' '}
              <a
                href="https://warpcast.com/dwr.eth/0xa04f0f2c"
                className="text-purple-400 hover:underline"
              >
                @dwr
              </a>{' '}
              ({' '}
              <a
                href="https://warpcast.com/dwr.eth/0x6186cf9b"
                className="text-purple-400 hover:underline"
              >
                ama
              </a>{' '}
              )
            </p>
            <p>
              Ideas from{' '}
              <a
                href="https://github.com/wojtekwtf/fc-ama-formatter"
                className="text-purple-400 hover:underline"
              >
                @woj
              </a>{' '}
              and{' '}
              <a
                href="https://warpcast.com/alvesjtiago.eth"
                className="text-purple-400 hover:underline"
              >
                @tiago
              </a>
            </p>
            <p>
              Coding assist{' '}
              <a
                href="https://warpcast.com/carter"
                className="text-purple-400 hover:underline"
              >
                @carter
              </a>
            </p>
            <p className="pt-4">
              Built by{' '}
              <a
                href="https://warpcast.com/papa"
                className="text-purple-400 hover:underline"
              >
                @papa
              </a>
            </p>
          </div>

          <div className="flex justify-center gap-6 mt-8">
            {socialLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                className="hover:opacity-80 transition-opacity"
                aria-label={`Visit ${link.name}`}
              >
                <IconImage
                  src={`https://res.cloudinary.com/dsneebaw0/image/upload/v1708031540/${link.icon}`}
                  alt={`${link.name} icon`}
                  className="w-8 h-8"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
