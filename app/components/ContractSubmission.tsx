import { useState, useEffect } from 'react'
import { useAMAContract } from '../hooks/useAMAContract'
import { parseEther, type TransactionReceipt } from 'viem'
import { useWaitForTransactionReceipt } from 'wagmi'
import { Card } from './common/Card'
import { ErrorMessage } from './common/ErrorMessage'

interface ContractSubmissionProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function ContractSubmission({
  onSuccess,
  onError,
}: ContractSubmissionProps) {
  const {
    submitContract,
    isCorrectNetwork,
    transactionHash,
    isLoading: isContractLoading,
  } = useAMAContract()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isLoading: isWaiting, data: receipt } = useWaitForTransactionReceipt({
    hash: transactionHash,
  })

  // Handle transaction receipt updates
  useEffect(() => {
    if (receipt) {
      onSuccess?.()
    }
  }, [receipt, onSuccess])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      if (!isCorrectNetwork) {
        throw new Error('Please switch to Optimism Sepolia network')
      }

      const startTime = new Date(formData.get('startTime') as string)
      const endTime = new Date(formData.get('endTime') as string)

      if (startTime <= new Date()) {
        throw new Error('Start time must be in the future')
      }

      if (endTime <= startTime) {
        throw new Error('End time must be after start time')
      }

      await submitContract({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        startTime,
        endTime,
        minQualityScore: 7000, // Default 70%
        rewardAmount: parseEther(
          (formData.get('rewardAmount') as string) || '0',
        ),
      })

      // Form will be reset after successful transaction in onSuccess callback
    } catch (error) {
      console.error('Error submitting contract:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      setError(message)
      onError?.(error as Error)
      form.reset()
    } finally {
      setLoading(false)
    }
  }

  const isSubmitting = loading || isContractLoading || isWaiting

  return (
    <Card title="Submit AMA Contract">
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            name="description"
            id="description"
            required
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700"
            >
              Start Time
            </label>
            <input
              type="datetime-local"
              name="startTime"
              id="startTime"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700"
            >
              End Time
            </label>
            <input
              type="datetime-local"
              name="endTime"
              id="endTime"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="rewardAmount"
            className="block text-sm font-medium text-gray-700"
          >
            Reward Amount (ETH)
          </label>
          <input
            type="number"
            name="rewardAmount"
            id="rewardAmount"
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isCorrectNetwork}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Contract'}
        </button>

        {!isCorrectNetwork && (
          <p className="mt-2 text-sm text-red-600">
            Please switch to Optimism Sepolia network
          </p>
        )}
      </form>
    </Card>
  )
}
