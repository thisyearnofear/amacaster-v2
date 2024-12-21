import { useCallback } from 'react'
import { type Match } from '../utils/matchSubmission'
import { useAccount } from 'wagmi'
import { optimismSepolia } from 'viem/chains'

interface DraftControlsProps {
  state: {
    isDraft: boolean
    isSubmitted: boolean
    lastSavedAt?: number
    lastSubmittedAt?: number
  }
  isSubmitting: boolean
  canSubmit: boolean
  onSaveDraft: (matches: Match[]) => Promise<number | void>
  onDeleteDraft: () => void
  matches: Match[]
  isInline?: boolean
}

export default function DraftControls({
  state,
  isSubmitting,
  canSubmit,
  onSaveDraft,
  onDeleteDraft,
  matches,
  isInline = false,
}: DraftControlsProps) {
  const { isConnected } = useAccount()

  const handleSaveDraft = useCallback(async () => {
    try {
      await onSaveDraft(matches)
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }, [matches, onSaveDraft])

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString()
  }

  const renderTimestamps = () => (
    <>
      {state.lastSavedAt && (
        <p className="text-sm text-gray-600">
          Last saved: {formatTimestamp(state.lastSavedAt)}
        </p>
      )}
      {state.lastSubmittedAt && (
        <p className="text-sm text-gray-600">
          Last submitted: {formatTimestamp(state.lastSubmittedAt)}
        </p>
      )}
    </>
  )

  if (isInline) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              isSubmitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Progress'}
          </button>
        </div>
        {state.isDraft && (
          <div className="flex-shrink-0">
            <button
              onClick={onDeleteDraft}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-100 hover:bg-red-200 text-red-700'
              }`}
            >
              Clear Draft
            </button>
          </div>
        )}
        <div className="flex-grow text-right">{renderTimestamps()}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg shadow">
      <div className="flex flex-col gap-2">{renderTimestamps()}</div>

      <div className="flex gap-3">
        <button
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            isSubmitting
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Progress'}
        </button>

        {state.isDraft && (
          <button
            onClick={onDeleteDraft}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              isSubmitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-red-100 hover:bg-red-200 text-red-700'
            }`}
          >
            Clear Draft
          </button>
        )}
      </div>
    </div>
  )
}
