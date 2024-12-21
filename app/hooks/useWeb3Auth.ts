import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useNeynarUser } from './useNeynarUser'

export function useWeb3Auth() {
  const { isConnected: isWalletConnected } = useAccount()
  const { neynarUser, isConnected: isFarcasterConnected } = useNeynarUser()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // During testing phase, any logged-in user can be admin
    setIsAdmin(isWalletConnected || isFarcasterConnected)
  }, [isWalletConnected, isFarcasterConnected])

  return {
    isAdmin,
    isWalletConnected,
    isFarcasterConnected,
    neynarUser,
  }
}
