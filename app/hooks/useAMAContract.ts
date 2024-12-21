import { useState, useCallback } from 'react'
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi'
import { type Hash } from 'viem'
import { CONTRACTS } from '../config/contracts'
import { AMA_CONTRACT_ABI } from '../config/ama-contract'

interface AMAContractSubmission {
  title: string
  description: string
  startTime: Date
  endTime: Date
  minQualityScore: number
  rewardAmount: bigint
}

interface ContractDetails {
  fid: bigint
  title: string
  description: string
  startTime: bigint
  endTime: bigint
  rewardPool: bigint
  state: number
  participantCount: bigint
  questionCount: bigint
  matchCount: bigint
  minQualityScore: bigint
  createdAt: bigint
}

export function useAMAContract() {
  const chainId = useChainId()
  const { address } = useAccount()
  const [transactionHash, setTransactionHash] = useState<Hash | undefined>(
    undefined,
  )

  const isCorrectNetwork = chainId === CONTRACTS.AMAMatcher.chainId

  const { writeContractAsync: submitContractWrite, isPending: isWriteLoading } =
    useWriteContract()

  const { writeContractAsync: registerFidWrite } = useWriteContract()

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: transactionHash,
  })

  const { data: contractDetails } = useReadContract({
    address: CONTRACTS.AMAMatcher.address as `0x${string}`,
    abi: AMA_CONTRACT_ABI,
    functionName: 'getContractDetails',
  })

  const getContractDetails = useCallback(
    async (contractId: string) => {
      return contractDetails as ContractDetails
    },
    [contractDetails],
  )

  const submitContract = useCallback(
    async ({
      title,
      description,
      startTime,
      endTime,
      minQualityScore,
      rewardAmount,
    }: AMAContractSubmission) => {
      if (!address) throw new Error('Wallet not connected')
      if (!isCorrectNetwork) throw new Error('Wrong network')
      if (!submitContractWrite) throw new Error('Contract write not available')

      try {
        const hash = await submitContractWrite({
          address: CONTRACTS.AMAMatcher.address as `0x${string}`,
          abi: AMA_CONTRACT_ABI,
          functionName: 'submitContract',
          args: [
            title,
            description,
            BigInt(Math.floor(startTime.getTime() / 1000)),
            BigInt(Math.floor(endTime.getTime() / 1000)),
            BigInt(minQualityScore),
          ],
          value: rewardAmount,
        })

        setTransactionHash(hash)
        return hash
      } catch (error) {
        console.error('Error submitting contract:', error)
        throw error
      }
    },
    [address, isCorrectNetwork, submitContractWrite],
  )

  const registerFid = useCallback(
    async (fid: number) => {
      if (!address) throw new Error('Wallet not connected')
      if (!isCorrectNetwork) throw new Error('Wrong network')
      if (!registerFidWrite) throw new Error('Contract write not available')

      try {
        const hash = await registerFidWrite({
          address: CONTRACTS.AMAMatcher.address as `0x${string}`,
          abi: AMA_CONTRACT_ABI,
          functionName: 'registerFid',
          args: [BigInt(fid)],
        })

        setTransactionHash(hash)
        return hash
      } catch (error) {
        console.error('Error registering FID:', error)
        throw error
      }
    },
    [address, isCorrectNetwork, registerFidWrite],
  )

  return {
    submitContract,
    registerFid,
    getContractDetails,
    isCorrectNetwork,
    transactionHash,
    isLoading: isWriteLoading || isConfirming,
  }
}
