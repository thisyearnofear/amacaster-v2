'use client'

import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultConfig,
  RainbowKitProvider,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, http, createStorage } from 'wagmi'
import { mainnet, optimism, optimismSepolia } from 'wagmi/chains'
import { useState } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!

const { wallets } = getDefaultWallets({
  appName: 'Amacast',
  projectId,
})

// Define RPC URLs
const RPC_URLS = {
  [mainnet.id]:
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com',
  [optimism.id]:
    process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  [optimismSepolia.id]:
    process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC_URL ||
    'https://sepolia.optimism.io',
}

// Create a custom storage that works in both client and server environments
const storage = createStorage({
  storage: {
    getItem: (key) => {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key)
      }
      return null
    },
    setItem: (key, value) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value)
      }
    },
    removeItem: (key) => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    },
  },
})

const config = getDefaultConfig({
  appName: 'Amacast',
  projectId,
  chains: [optimismSepolia, mainnet, optimism],
  transports: {
    [mainnet.id]: http(RPC_URLS[mainnet.id]),
    [optimism.id]: http(RPC_URLS[optimism.id]),
    [optimismSepolia.id]: http(RPC_URLS[optimismSepolia.id]),
  },
  wallets,
  ssr: true,
  storage,
  // Add additional options for better stability
  syncConnectedChain: true,
  pollingInterval: 12_000, // 12 seconds
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1_000 * 60 * 60 * 24, // 24 hours
            staleTime: 1_000 * 60 * 60, // 1 hour
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          showRecentTransactions={true}
          modalSize="compact"
          appInfo={{
            appName: 'Amacast',
            learnMoreUrl: 'https://amacast.netlify.app',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
