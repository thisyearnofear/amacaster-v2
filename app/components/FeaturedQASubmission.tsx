'use client'

import { useState } from 'react'
import { ErrorMessage } from './common/ErrorMessage'
import { useFeaturedQA } from '../hooks/useFeaturedQA'
import { Match } from '../hooks/useMatches'

interface FeaturedQASubmissionProps {
  match: Match
  onSuccess?: () => void
}

export function FeaturedQASubmission({
  match,
  onSuccess,
}: FeaturedQASubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { submitFeaturedQA } = useFeaturedQA(
    match.contractId,
    match.submitter?.fid || 0,
  )

  const handleSubmit = async () => {
    if (!match.submitter?.fid || !match.submitter?.username) return

    try {
      setIsSubmitting(true)
      await submitFeaturedQA(
        match.question.cast_id as `0x${string}`,
        match.answer.cast_id as `0x${string}`,
        match.submitter.username,
      )
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting featured Q&A:', error)
      setErrorMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {errorMessage && <ErrorMessage>Error: {errorMessage}</ErrorMessage>}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !match.submitter?.fid}
        className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Feature this Q&A'}
      </button>
    </>
  )
}
