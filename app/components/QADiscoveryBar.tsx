'use client'

import { useState, useEffect } from 'react'
import { MatchSubmission } from './MatchSubmission'
import { type Match } from '../utils/matchSubmission'
import { useMatchDiscovery } from '../hooks/useMatchDiscovery'
import { toast } from 'react-hot-toast'

interface QADiscoveryBarProps {
  amaId: string
  currentMatches: Match[]
  onMatchApply?: (matches: Match[]) => void
  onSuccess?: () => void
  onError?: (error: Error) => void
}

type TabType = 'submit' | 'discover'

export function QADiscoveryBar({
  amaId,
  currentMatches,
  onMatchApply,
  onSuccess,
  onError,
}: QADiscoveryBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('discover')
  const {
    popularSets,
    recentSets,
    loading,
    error,
    applyMatchSet,
    refreshSets,
  } = useMatchDiscovery({ amaId })

  const handleApplyMatchSet = async (matchSet: any) => {
    try {
      await applyMatchSet(matchSet)
      onMatchApply?.(matchSet.matches)
      toast.success('Applied match set')
      setIsExpanded(false)
    } catch (err) {
      console.error('Error applying match set:', err)
      toast.error('Failed to apply match set')
      onError?.(err as Error)
    }
  }

  return (
    <>
      {/* Minimal Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 px-4 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
        >
          {isExpanded ? '↓ Close' : '↑ Discover Matches'}
        </button>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div
          className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4"
          style={{ maxHeight: '60vh', overflowY: 'auto' }}
        >
          <div className="max-w-3xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('discover')}
                className={`text-sm ${
                  activeTab === 'discover'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Discover
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`text-sm ${
                  activeTab === 'submit'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Submit
              </button>
            </div>

            {/* Content */}
            {activeTab === 'submit' ? (
              <MatchSubmission
                amaId={amaId}
                matches={currentMatches}
                onSuccess={() => {
                  onSuccess?.()
                  refreshSets()
                  setIsExpanded(false)
                }}
                onError={onError}
              />
            ) : (
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading...
                  </div>
                ) : error ? (
                  <div className="text-center py-4 text-gray-600">
                    {error.message}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {popularSets.map((set) => (
                      <div
                        key={set.id}
                        className="p-4 border border-gray-200 hover:border-gray-300"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-sm text-gray-900">
                              @{set.metadata.submitter}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(
                                set.metadata.timestamp,
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {set.matches.length} matches
                          </div>
                        </div>
                        <button
                          onClick={() => handleApplyMatchSet(set)}
                          className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300"
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
