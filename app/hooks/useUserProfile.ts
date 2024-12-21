import { useEffect, useState } from 'react'
import {
  useAccount,
  useContractRead,
  useWriteContract,
  useWaitForTransactionReceipt,
  type Config,
} from 'wagmi'
import { useNeynarUser } from './useNeynarUser'
import { type Hash } from 'viem'
import { type OnChainProfile, type UserProfile } from '../types'

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_PROFILE_CONTRACT_ADDRESS as `0x${string}`

const ABI = [
  'function createProfile(uint256 _fid) external',
  'function updateProfile(uint256 _matchesSubmitted, uint256 _score) external',
  'function getProfile(uint256 _fid) external view returns (tuple(uint256 fid, address walletAddress, uint256 matchesSubmitted, uint256 totalScore, uint256 achievementFlags, uint256 lastUpdated))',
  'function getProfileByAddress(address _address) external view returns (tuple(uint256 fid, address walletAddress, uint256 matchesSubmitted, uint256 totalScore, uint256 achievementFlags, uint256 lastUpdated))',
] as const

interface UseUserProfileReturn {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  createUserProfile: () => Promise<Hash | undefined>
  updateUserProfile: (
    matchesSubmitted: number,
    score: number,
  ) => Promise<Hash | undefined>
  isLoading: boolean
}

export function useUserProfile(): UseUserProfileReturn {
  const { address } = useAccount()
  const { neynarUser } = useNeynarUser()
  const [profile, setProfile] = useState<OnChainProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createTxHash, setCreateTxHash] = useState<Hash | undefined>()
  const [updateTxHash, setUpdateTxHash] = useState<Hash | undefined>()

  // Read profile data
  const { data: profileData, isError: readError } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getProfileByAddress',
    args: address ? [address] : undefined,
  })

  // Write contract functions
  const { writeContractAsync: createProfileWrite, isPending: isCreating } =
    useWriteContract()
  const { writeContractAsync: updateProfileWrite, isPending: isUpdating } =
    useWriteContract()

  // Wait for transactions
  const { isLoading: isWaitingCreate } = useWaitForTransactionReceipt({
    hash: createTxHash,
  })

  const { isLoading: isWaitingUpdate } = useWaitForTransactionReceipt({
    hash: updateTxHash,
  })

  useEffect(() => {
    if (profileData && Array.isArray(profileData) && profileData.length >= 6) {
      setProfile({
        fid: BigInt(profileData[0]),
        walletAddress: profileData[1] as `0x${string}`,
        matchesSubmitted: BigInt(profileData[2]),
        totalScore: BigInt(profileData[3]),
        achievementFlags: BigInt(profileData[4]),
        lastUpdated: BigInt(profileData[5]),
      })
      setLoading(false)
    }
  }, [profileData])

  useEffect(() => {
    if (readError) {
      setError('Failed to load profile data')
      setLoading(false)
    }
  }, [readError])

  const createUserProfile = async (): Promise<Hash | undefined> => {
    if (!neynarUser?.fid) {
      throw new Error('No Farcaster ID found')
    }

    try {
      const hash = await createProfileWrite({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'createProfile',
        args: [BigInt(neynarUser.fid)],
      })
      setCreateTxHash(hash)
      return hash
    } catch (err) {
      console.error('Error creating profile:', err)
      throw err
    }
  }

  const updateUserProfile = async (
    matchesSubmitted: number,
    score: number,
  ): Promise<Hash | undefined> => {
    try {
      const hash = await updateProfileWrite({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'updateProfile',
        args: [BigInt(matchesSubmitted), BigInt(score)],
      })
      setUpdateTxHash(hash)
      return hash
    } catch (err) {
      console.error('Error updating profile:', err)
      throw err
    }
  }

  return {
    profile: profile
      ? {
          fid: Number(profile.fid),
          walletAddress: profile.walletAddress,
          matchesSubmitted: Number(profile.matchesSubmitted),
          totalScore: Number(profile.totalScore),
          achievementFlags: Number(profile.achievementFlags),
          lastUpdated: Number(profile.lastUpdated),
        }
      : null,
    loading,
    error,
    createUserProfile,
    updateUserProfile,
    isLoading: isCreating || isUpdating || isWaitingCreate || isWaitingUpdate,
  }
}
