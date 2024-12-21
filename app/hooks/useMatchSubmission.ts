import { useState, useCallback, useEffect } from 'react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { CONTRACTS } from '../config/contracts'
import { AMA_MATCHER_ABI } from '../config/abis'
import { keccak256, type Hash } from 'viem'
import {
  submitMatches,
  type Match,
  type SubmissionResult,
  type SubmissionMetadata,
} from '../utils/matchSubmission'

interface SubmissionState {
  isDraft: boolean
  isSubmitted: boolean
  lastSavedAt?: number
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

const DRAFT_STORAGE_KEY = 'amacaster_drafts'

interface StoredDraft {
  matches: Match[]
  lastSavedAt: number
  metadata: Omit<SubmissionMetadata, 'submitter'> & {
    submitter: string
  }
}

interface DraftStorage {
  [amaId: string]: StoredDraft
}

export function useMatchSubmission(amaId: string) {
  const { isConnected, address } = useAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hash, setHash] = useState<Hash | undefined>(undefined)
  const [state, setState] = useState<SubmissionState>({
    isDraft: true,
    isSubmitted: false,
  })
  const [currentSubmission, setCurrentSubmission] = useState<Match[]>([])

  const { writeContract, data } = useWriteContract()

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

  // Load draft from local storage on mount
  useEffect(() => {
    if (amaId) {
      try {
        const storedDrafts = JSON.parse(
          localStorage.getItem(DRAFT_STORAGE_KEY) || '{}',
        ) as DraftStorage
        const draft = storedDrafts[amaId]
        if (draft) {
          setCurrentSubmission(draft.matches)
          setState((prev) => ({
            ...prev,
            isDraft: true,
            lastSavedAt: draft.lastSavedAt,
          }))
        }
      } catch (err) {
        console.error('Error loading draft:', err)
      }
    }
  }, [amaId])

  // Save draft to local storage
  const saveDraft = useCallback(
    async (matches: Match[]) => {
      if (!amaId) return

      try {
        const timestamp = Date.now()
        const metadata = {
          timestamp: Math.floor(timestamp / 1000),
          version: 0,
          submitter: address || 'anonymous',
        }

        // Save to local storage
        const storedDrafts = JSON.parse(
          localStorage.getItem(DRAFT_STORAGE_KEY) || '{}',
        ) as DraftStorage
        storedDrafts[amaId] = {
          matches,
          lastSavedAt: timestamp,
          metadata,
        }
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(storedDrafts))

        setCurrentSubmission(matches)
        setState((prev) => ({
          ...prev,
          isDraft: true,
          lastSavedAt: timestamp,
        }))

        return timestamp
      } catch (err) {
        console.error('Error saving draft:', err)
        throw err
      }
    },
    [amaId, address],
  )

  // Delete draft from local storage
  const deleteDraft = useCallback(() => {
    if (!amaId) return

    try {
      const storedDrafts = JSON.parse(
        localStorage.getItem(DRAFT_STORAGE_KEY) || '{}',
      ) as DraftStorage
      delete storedDrafts[amaId]
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(storedDrafts))

      setCurrentSubmission([])
      setState((prev) => ({
        ...prev,
        isDraft: true,
        lastSavedAt: undefined,
      }))
    } catch (err) {
      console.error('Error deleting draft:', err)
      throw err
    }
  }, [amaId])

  const submit = useCallback(
    async (matches: Match[]) => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected')
      }

      try {
        setIsSubmitting(true)
        setError(null)
        setCurrentSubmission(matches)

        // Convert AMA ID to bytes32
        const amaIdHash = keccak256(
          new TextEncoder().encode(amaId),
        ) as `0x${string}`

        // Prepare metadata
        const metadata: SubmissionMetadata = {
          timestamp: Math.floor(Date.now() / 1000),
          version: 0,
          submitter: address,
        }

        // Submit matches to IPFS and get merkle data
        console.log('Preparing submission data...')
        setState((prev) => ({
          ...prev,
          uploadState: { type: 'ipfs', attempt: 1 },
        }))

        const submissionResult = await submitMatches(
          amaId,
          matches,
          metadata,
          {
            signMessage: async (message) => {
              const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, address],
              })
              return signature as string
            },
          },
          3,
          (attempt) => {
            setState((prev) => ({
              ...prev,
              uploadState: { type: 'ipfs', attempt },
            }))
          },
        )

        console.log('Submitting to contract:', {
          amaIdHash,
          contentHash: submissionResult.contentHash,
          merkleRoot: submissionResult.merkleRoot,
          signature: submissionResult.signature,
        })

        // Submit to contract
        if (!writeContract) {
          throw new Error('Contract write function not available')
        }

        setState((prev) => ({
          ...prev,
          uploadState: { type: 'contract' },
        }))

        // Convert matches to the format expected by the contract
        const matchHashes = matches.map(
          (match) =>
            keccak256(
              new TextEncoder().encode(JSON.stringify(match)),
            ) as `0x${string}`,
        )
        const rankings = matches.map((_, index) => BigInt(index))

        const result = await writeContract({
          address: CONTRACTS.AMAMatcher.address as `0x${string}`,
          abi: AMA_MATCHER_ABI,
          functionName: 'submitMatch',
          args: [amaIdHash, matchHashes, rankings] as const,
        })

        if (typeof result === 'string') {
          setHash(result as Hash)
          const timestamp = Date.now()
          setState({
            isDraft: false,
            isSubmitted: true,
            lastSubmittedAt: timestamp,
            submissionDetails: {
              ipfsUrl: submissionResult.contentHash,
              transactionHash: result,
            },
          })
          // Clear draft after successful submission
          deleteDraft()
        }
        setIsSubmitting(false)
        return result
      } catch (err) {
        console.error('Error submitting matches:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setIsSubmitting(false)
        throw err
      }
    },
    [isConnected, address, amaId, writeContract, deleteDraft],
  )

  return {
    submit,
    saveDraft,
    deleteDraft,
    isSubmitting: isSubmitting || isConfirming,
    error,
    hash,
    state,
    currentSubmission,
  }
}
