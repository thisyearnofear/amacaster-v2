import { useState, useCallback } from 'react'
import { uploadMatchesToIPFS } from '../utils/ipfs'
import { useIPCM } from './useIPCM'
import { useAccount } from 'wagmi'
import type { Match } from '../utils/matchSubmission'

interface SubmissionState {
  isDraft: boolean
  isSubmitted: boolean
  lastSubmittedAt?: number
  uploadState?: {
    type: 'ipfs' | 'contract'
    attempt?: number
  }
  submissionDetails?: {
    ipfsUrl?: string
    transactionHash?: string
  }
}

export function useMatchSubmission(amaId: string) {
  const { address } = useAccount()
  const [state, setState] = useState<SubmissionState>({
    isDraft: true,
    isSubmitted: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentSubmission, setCurrentSubmission] = useState<Match[]>([])
  const { updateIPFSMapping, isUpdating } = useIPCM()

  const submit = useCallback(
    async (matches: Match[]) => {
      if (isSubmitting || isUpdating || !address) return
      setIsSubmitting(true)
      setError(null)

      try {
        setState((prev) => ({
          ...prev,
          uploadState: { type: 'ipfs', attempt: 1 },
        }))

        // Upload to IPFS and update IPCM mapping
        const contentHash = await uploadMatchesToIPFS(
          {
            amaId,
            matches,
            metadata: {
              version: 1,
              submitter: address,
              timestamp: Math.floor(Date.now() / 1000),
              submitter_fid: '', // Optional Farcaster ID - to be populated when Farcaster auth is implemented
              ama_title: amaId,
              ama_host: '', // Optional
              curation_criteria: {
                focus_topics: [],
                quality_threshold: 0.7,
                curation_guidelines: 'Select high-quality, relevant Q&As',
              },
            },
          },
          updateIPFSMapping,
        )

        setState((prev) => ({
          isDraft: false,
          isSubmitted: true,
          lastSubmittedAt: Date.now(),
          submissionDetails: {
            ...prev.submissionDetails,
            ipfsUrl: contentHash,
          },
        }))

        setCurrentSubmission(matches)
        return contentHash
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        throw error
      } finally {
        setIsSubmitting(false)
        setState((prev) => ({ ...prev, uploadState: undefined }))
      }
    },
    [amaId, isSubmitting, isUpdating, updateIPFSMapping, address],
  )

  const saveDraft = useCallback(async (matches: Match[]) => {
    try {
      setCurrentSubmission(matches)
      setState((prev) => ({
        ...prev,
        isDraft: true,
        isSubmitted: false,
      }))
      // Could add local storage persistence here if needed
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }, [])

  const deleteDraft = useCallback(() => {
    setCurrentSubmission([])
    setState({
      isDraft: true,
      isSubmitted: false,
    })
  }, [])

  return {
    submit,
    saveDraft,
    deleteDraft,
    isSubmitting,
    error,
    state,
    currentSubmission,
  }
}
