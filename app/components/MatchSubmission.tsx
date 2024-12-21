import { useState, useEffect, useMemo, memo } from 'react'
import { useMatchSubmission } from '../hooks/useMatchSubmission'
import { type Match } from '../utils/matchSubmission'

interface MatchSubmissionProps {
  amaId: string
  matches: Match[] // Existing matches from your matching logic
  onSuccess?: () => void
  onError?: (error: Error) => void
}

// Define the submission tuple type
type MatchSubmissionData = readonly [
  matchHashes: readonly `0x${string}`[],
  rankings: readonly bigint[],
  timestamp: bigint,
]

// Memoized match list item component
const MatchListItem = memo(({ match }: { match: Match }) => (
  <li className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div>
      <p className="text-sm font-medium">
        Q: {match.questionHash.slice(0, 10)}...
      </p>
      <p className="text-sm font-medium">
        A: {match.answerHash.slice(0, 10)}...
      </p>
      <p className="text-sm text-gray-600">Rank: {match.ranking}</p>
    </div>
  </li>
))
MatchListItem.displayName = 'MatchListItem'

// Memoized submission info component
const SubmissionInfo = memo(
  ({ submission }: { submission: MatchSubmissionData }) => (
    <div className="mb-6 p-4 bg-purple-50 rounded-lg">
      <h3 className="font-semibold mb-2">Current Submission</h3>
      <p className="text-sm text-gray-600">Matches: {submission[0].length}</p>
      <p className="text-sm text-gray-600">
        Status: {submission[1].length === 0 ? 'Draft' : 'Submitted'}
      </p>
      <p className="text-sm text-gray-600">
        Timestamp: {new Date(Number(submission[2])).toLocaleString()}
      </p>
    </div>
  ),
)
SubmissionInfo.displayName = 'SubmissionInfo'

export function MatchSubmission({
  amaId,
  matches,
  onSuccess,
  onError,
}: MatchSubmissionProps) {
  const { submit, finalize, isSubmitting, error, state, currentSubmission } =
    useMatchSubmission(amaId)

  const [localError, setLocalError] = useState<string | null>(null)
  const [isDraft, setIsDraft] = useState(true)

  // Load existing submission state
  useEffect(() => {
    if (currentSubmission) {
      const submissionData = currentSubmission as MatchSubmissionData
      setIsDraft(submissionData[1].length === 0) // If no rankings, it's a draft
    }
  }, [currentSubmission])

  // Memoize handlers to prevent unnecessary re-renders
  const handleSubmit = useMemo(
    () => async () => {
      setLocalError(null)

      try {
        if (matches.length === 0) {
          throw new Error('Please add at least one match')
        }

        await submit(matches, isDraft)
        onSuccess?.()
      } catch (err) {
        console.error('Error submitting matches:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        setLocalError(message)
        onError?.(err as Error)
      }
    },
    [matches, isDraft, submit, onSuccess, onError],
  )

  const handleFinalize = useMemo(
    () => async () => {
      try {
        await finalize()
        onSuccess?.()
      } catch (err) {
        console.error('Error finalizing submission:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        setLocalError(message)
        onError?.(err as Error)
      }
    },
    [finalize, onSuccess, onError],
  )

  // Memoize button states
  const submitButtonDisabled = useMemo(
    () => isSubmitting || matches.length === 0,
    [isSubmitting, matches.length],
  )

  const showFinalizeButton = useMemo(
    () => state.isDraft && matches.length > 0,
    [state.isDraft, matches.length],
  )

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Submit Matches</h2>

      {(error || localError) && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error?.message || localError}
        </div>
      )}

      {/* Current Submission Info */}
      {currentSubmission && (
        <SubmissionInfo submission={currentSubmission as MatchSubmissionData} />
      )}

      {/* Match List */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4">Matches</h3>
        {matches.length === 0 ? (
          <p className="text-gray-500">No matches available</p>
        ) : (
          <ul className="space-y-4">
            {matches.map((match, index) => (
              <MatchListItem key={index} match={match} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={submitButtonDisabled}
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Matches'}
        </button>

        {showFinalizeButton && (
          <button
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="flex-1 py-2 px-4 border border-purple-600 rounded-md shadow-sm text-sm font-medium text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            Finalize Submission
          </button>
        )}
      </div>
    </div>
  )
}
