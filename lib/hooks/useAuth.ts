import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi'
import { injected } from 'wagmi/connectors'

interface AuthState {
  isAuthenticated: boolean
  user: {
    walletAddress?: string
  } | null
}

interface AuthContextType extends AuthState {
  connectWallet: () => Promise<void>
  signOut: () => Promise<void>
  signTransaction: (transaction: any) => Promise<`0x${string}` | undefined>
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  connectWallet: async () => {},
  signOut: async () => {},
  signTransaction: async () => undefined,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  })

  const { address, isConnected } = useAccount()
  const { connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { data: walletClient } = useWalletClient()

  // Update auth state when RainbowKit connection changes
  useEffect(() => {
    if (isConnected && address) {
      setAuthState({
        isAuthenticated: true,
        user: {
          walletAddress: address,
        },
      })
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
      })
    }
  }, [isConnected, address])

  const connectWallet = async () => {
    await connectAsync({ connector: injected() })
  }

  const signOut = async () => {
    await disconnectAsync()
  }

  const signTransaction = async (transaction: any) => {
    if (!walletClient) {
      throw new Error('No wallet client available')
    }
    return walletClient.sendTransaction(transaction)
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        connectWallet,
        signOut,
        signTransaction,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
