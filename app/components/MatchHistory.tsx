'use client'

import { useState, useMemo } from 'react'
import { Match } from '../api/matches/[fid]/route'

interface MatchHistoryProps {
  matches: Match[]
}

type SortOption = 'recent' | 'quality' | 'relevance' | 'engagement'
type FilterOption = 'all' | 'withNotes' | 'highQuality'

export function MatchHistory({ matches }: MatchHistoryProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAndSortedMatches = useMemo(() => {
    let result = [...matches]

    // Apply filters
    switch (filterBy) {
      case 'withNotes':
        result = result.filter((m) => m.quality_signals?.curator_notes)
        break
      case 'highQuality':
        result = result.filter(
          (m) =>
            (m.quality_signals?.relevance_score || 0) > 0.7 ||
            (m.quality_signals?.engagement_score || 0) > 0.7,
        )
        break
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (m) =>
          m.question.text.toLowerCase().includes(query) ||
          m.answer.text.toLowerCase().includes(query) ||
          m.category?.toLowerCase().includes(query) ||
          m.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        result.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        break
      case 'quality':
        result.sort(
          (a, b) =>
            (b.quality_signals?.relevance_score || 0) -
            (a.quality_signals?.relevance_score || 0),
        )
        break
      case 'relevance':
        result.sort(
          (a, b) =>
            (b.quality_signals?.relevance_score || 0) -
            (a.quality_signals?.relevance_score || 0),
        )
        break
      case 'engagement':
        result.sort(
          (a, b) =>
            (b.quality_signals?.engagement_score || 0) -
            (a.quality_signals?.engagement_score || 0),
        )
        break
    }

    return result
  }, [matches, sortBy, filterBy, searchQuery])

  if (!matches.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No curated Q&As found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1 rounded-full text-sm ${
              sortBy === 'recent'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy('quality')}
            className={`px-3 py-1 rounded-full text-sm ${
              sortBy === 'quality'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Quality
          </button>
          <button
            onClick={() => setSortBy('engagement')}
            className={`px-3 py-1 rounded-full text-sm ${
              sortBy === 'engagement'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Engagement
          </button>
        </div>
        <div className="flex gap-2">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-3 py-1 rounded-lg text-sm border border-gray-300"
          >
            <option value="all">All Q&As</option>
            <option value="withNotes">With Notes</option>
            <option value="highQuality">High Quality</option>
          </select>
          <input
            type="search"
            placeholder="Search Q&As..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1 rounded-lg text-sm border border-gray-300"
          />
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {filteredAndSortedMatches.map((match) => (
          <div
            key={match.id}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3"
          >
            {/* Question */}
            <div>
              <div className="flex items-start justify-between">
                <h3 className="font-medium">Q: {match.question.text}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(match.question.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                by @{match.question.author.username}
              </p>
            </div>

            {/* Answer */}
            <div>
              <div className="flex items-start justify-between">
                <h3 className="font-medium">A: {match.answer.text}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(match.answer.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                by @{match.answer.author.username}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {match.category && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                  {match.category}
                </span>
              )}
              {match.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Quality Signals */}
            {match.quality_signals && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex gap-4 text-sm text-gray-600">
                  {match.quality_signals.relevance_score && (
                    <span>
                      Relevance:{' '}
                      {(match.quality_signals.relevance_score * 100).toFixed(0)}
                      %
                    </span>
                  )}
                  {match.quality_signals.engagement_score && (
                    <span>
                      Engagement:{' '}
                      {(match.quality_signals.engagement_score * 100).toFixed(
                        0,
                      )}
                      %
                    </span>
                  )}
                </div>
                {match.quality_signals.curator_notes && (
                  <p className="mt-2 text-sm text-gray-700 italic">
                    "{match.quality_signals.curator_notes}"
                  </p>
                )}
              </div>
            )}

            {/* Contract Info */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
              <div>
                Contract: {match.contractId.slice(0, 6)}...
                {match.contractId.slice(-4)}
              </div>
              <div>Rank: {match.rankings[0] + 1}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
