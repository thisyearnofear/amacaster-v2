import { useReadContract, useWriteContract } from 'wagmi'
import { type Address } from 'viem'
import { AMAIPCM_ABI } from '../constants/abis'
import { AMAIPCM_ADDRESS } from '../constants/addresses'

export function useIPCM() {
  const { data: currentMapping, isLoading: isLoadingMapping } = useReadContract(
    {
      address: AMAIPCM_ADDRESS as Address,
      abi: AMAIPCM_ABI,
      functionName: 'getMapping',
    },
  )

  const { writeContract: updateMapping, isPending: isUpdating } =
    useWriteContract()

  const updateIPFSMapping = async (cid: string) => {
    try {
      if (!updateMapping) {
        throw new Error('Contract write not ready')
      }

      await updateMapping({
        address: AMAIPCM_ADDRESS as Address,
        abi: AMAIPCM_ABI,
        functionName: 'updateMapping',
        args: [cid],
      })
    } catch (error) {
      console.error('Error updating IPFS mapping:', error)
      throw error
    }
  }

  return {
    currentMapping: currentMapping as string,
    isLoadingMapping,
    updateIPFSMapping,
    isUpdating,
  }
}
