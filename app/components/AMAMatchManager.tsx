import { useState } from 'react'
import { MatchSubmission } from './MatchSubmission'
import { IPFSHistory } from './IPFSHistory'
import type { IPFSMatchData } from '../utils/ipfs'

interface AMAMatchManagerProps {
  amaId: string
  initialMatches?: IPFSMatchData
  className?: string
}

export function AMAMatchManager({
  amaId,
  initialMatches,
  className = '',
}: AMAMatchManagerProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit')

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('submit')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'submit'
              ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50/50'
              : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/30'
          }`}
        >
          Submit Matches
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'history'
              ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50/50'
              : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/30'
          }`}
        >
          Version History
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'submit' && initialMatches ? (
          <MatchSubmission
            matchData={initialMatches}
            onSuccess={() => setActiveTab('history')}
          />
        ) : activeTab === 'submit' ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No matches available to submit</p>
            <button
              onClick={() => setActiveTab('history')}
              className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              View Previous Submissions →
            </button>
          </div>
        ) : (
          <IPFSHistory amaId={amaId} />
        )}
      </div>
    </div>
  )
}
