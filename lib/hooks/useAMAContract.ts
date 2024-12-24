import { useContractWrite, useContractRead, type Config } from 'wagmi'
import { useAuth } from './useAuth'

const AMA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AMA_CONTRACT_ADDRESS!
const AMA_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'questionId', type: 'uint256' },
      { internalType: 'uint256', name: 'rank', type: 'uint256' },
    ],
    name: 'updateRanking',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getRankings',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'questionId', type: 'uint256' },
          { internalType: 'uint256', name: 'rank', type: 'uint256' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct AMARegistry.AMAEntry[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function useAMAContract() {
  const { user } = useAuth()

  const { data: rankings, isLoading: isLoadingRankings } = useContractRead({
    address: AMA_CONTRACT_ADDRESS as `0x${string}`,
    abi: AMA_CONTRACT_ABI,
    functionName: 'getRankings',
    args: user?.walletAddress
      ? [user.walletAddress as `0x${string}`]
      : undefined,
    query: {
      enabled: !!user?.walletAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  })

  const { writeContract: updateRanking, isPending: isUpdatingRanking } =
    useContractWrite()

  const saveRanking = async (questionId: number, rank: number) => {
    if (!user?.walletAddress) {
      throw new Error('Wallet not connected')
    }

    try {
      const hash = await updateRanking({
        address: AMA_CONTRACT_ADDRESS as `0x${string}`,
        abi: AMA_CONTRACT_ABI,
        functionName: 'updateRanking',
        args: [BigInt(questionId), BigInt(rank)],
      })

      return hash
    } catch (error) {
      console.error('Error saving ranking:', error)
      throw error
    }
  }

  return {
    rankings,
    isLoadingRankings,
    saveRanking,
    isUpdatingRanking,
  }
}
