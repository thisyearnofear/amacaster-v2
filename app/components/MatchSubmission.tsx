import { useState } from 'react'
import { useIPCM } from '../hooks/useIPCM'
import { uploadMatchesToIPFS } from '../utils/ipfs'
import type { IPFSMatchData } from '../utils/ipfs'
import { ErrorMessage } from './common/ErrorMessage'
import { Card } from './common/Card'

interface MatchSubmissionProps {
  matchData: IPFSMatchData
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function MatchSubmission({
  matchData,
  onSuccess,
  onError,
}: MatchSubmissionProps) {
  const { updateIPFSMapping, isUpdating } = useIPCM()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (isSubmitting || isUpdating) return
    setIsSubmitting(true)
    setError(null)

    try {
      // Upload to IPFS and update IPCM mapping
      const contentHash = await uploadMatchesToIPFS(
        matchData
      )
      console.log('Successfully uploaded and mapped:', contentHash)
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting matches:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card title="Submit Matches" className="space-y-6">
      {/* Match Summary Card */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          Match Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Total Matches</p>
            <p className="text-sm mt-1">{matchData.matches.length} pairs</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Version</p>
            <p className="text-sm mt-1">{matchData.metadata.version}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500">AMA ID</p>
            <p className="text-sm mt-1 font-mono">{matchData.amaId}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500">Submitter</p>
            <p className="text-sm mt-1">{matchData.metadata.submitter}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || isUpdating}
        className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        {isSubmitting || isUpdating ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Submitting...
          </span>
        ) : (
          'Submit Matches'
        )}
      </button>
    </Card>
  )
}
