'use client'

import { useState, useMemo } from 'react'
import { Match } from '../hooks/useMatches'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { FeaturedQASubmission } from './FeaturedQASubmission'
import { Card } from './common/Card'

export function MatchHistory({ matches }: { matches: Match[] }) {
  return (
    <div className="space-y-6">
      {matches.map((match) => (
        <Card key={match.id} className="space-y-4">
          {/* Question */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-900">Q:</span>
              <span className="text-sm text-gray-500">
                by @{match.question.author.username}
              </span>
              <span className="text-sm text-gray-400">
                {formatDistanceToNow(new Date(match.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-gray-900">{match.question.text}</p>
          </div>

          {/* Answer */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-900">A:</span>
              <span className="text-sm text-gray-500">
                by @{match.answer.author.username}
              </span>
            </div>
            <p className="text-gray-900">{match.answer.text}</p>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Found useful by</span>
                {match.submitter?.fid ? (
                  <Link
                    href={`/profile/${match.submitter.fid}`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    @{match.submitter.username}
                  </Link>
                ) : (
                  <span className="text-gray-500">@anonymous</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Contract</span>
                  <a
                    href={`https://optimistic.etherscan.io/tx/${match.contractId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    {match.contractId.slice(0, 6)}...
                    {match.contractId.slice(-4)}
                  </a>
                </div>
                <FeaturedQASubmission match={match} />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
