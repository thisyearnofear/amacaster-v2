import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { AMA_FEATURED_ABI } from '../config/ama-featured-contract'
import { CONTRACTS } from '../config/contracts'

export function useFeaturedQA(amaId: string, fid: number) {
  // Read featured Q&A
  const { data: featuredQA, isLoading: isLoadingFeatured } = useReadContract({
    address: CONTRACTS.AMAFeatured.address as `0x${string}`,
    abi: AMA_FEATURED_ABI,
    functionName: 'getFeaturedQA',
    args: [amaId as `0x${string}`, BigInt(fid)],
  })

  // Submit featured Q&A
  const { writeContract, data: hash, isPending } = useWriteContract()

  // Wait for transaction
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

  const submit = async (
    questionHash: `0x${string}`,
    answerHash: `0x${string}`,
    username: string,
  ) => {
    if (!writeContract) return
    try {
      return await writeContract({
        address: CONTRACTS.AMAFeatured.address as `0x${string}`,
        abi: AMA_FEATURED_ABI,
        functionName: 'submitFeaturedQA',
        args: [
          amaId as `0x${string}`,
          questionHash,
          answerHash,
          BigInt(fid),
          username,
        ],
      })
    } catch (error) {
      console.error('Error submitting featured Q&A:', error)
      throw error
    }
  }

  return {
    featuredQA,
    isLoadingFeatured,
    submitFeaturedQA: submit,
    isSubmitting: isPending || isConfirming,
  }
}
