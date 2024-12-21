import { useState, useCallback } from 'react'
import {
  useAccount,
  useNetwork,
  useContractWrite,
  useWaitForTransactionReceipt,
  useContractRead,
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
  const { chain } = useNetwork()
  const { address } = useAccount()
  const [transactionHash, setTransactionHash] = useState<Hash | null>(null)

  const isCorrectNetwork = chain?.id === CONTRACTS.AMAMatcher.chainId

  const { writeAsync: submitContractWrite, isLoading: isWriteLoading } =
    useContractWrite({
      address: CONTRACTS.AMAMatcher.address,
      abi: AMA_CONTRACT_ABI,
      functionName: 'submitContract',
    })

  const { writeAsync: registerFidWrite } = useContractWrite({
    address: CONTRACTS.AMAMatcher.address,
    abi: AMA_CONTRACT_ABI,
    functionName: 'registerFid',
  })

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: transactionHash,
  })

  const getContractDetails = useCallback(async (contractId: string) => {
    const { data } = await useContractRead({
      address: CONTRACTS.AMAMatcher.address,
      abi: AMA_CONTRACT_ABI,
      functionName: 'getContractDetails',
      args: [contractId as `0x${string}`],
    })
    return data as ContractDetails
  }, [])

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

      try {
        const tx = await submitContractWrite({
          args: [
            title,
            description,
            BigInt(Math.floor(startTime.getTime() / 1000)),
            BigInt(Math.floor(endTime.getTime() / 1000)),
            BigInt(minQualityScore),
          ],
          value: rewardAmount,
        })

        setTransactionHash(tx.hash)
        return tx.hash
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

      try {
        const tx = await registerFidWrite({
          args: [BigInt(fid)],
        })

        setTransactionHash(tx.hash)
        return tx.hash
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
